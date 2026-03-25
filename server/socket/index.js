const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Friend = require('../models/Friend');
const DirectMessage = require('../models/DirectMessage');

const onlineUsers = new Map(); // Map<userId, Set<socketId>>
const messageBuckets = new Map();
const pinnedByConversation = new Map();

const MESSAGE_LIMIT = 10;
const WINDOW_MS = 5000;

function canSend(socketId) {
  const now = Date.now();
  const bucket = messageBuckets.get(socketId) || [];
  const recent = bucket.filter((ts) => now - ts < WINDOW_MS);
  if (recent.length >= MESSAGE_LIMIT) {
    messageBuckets.set(socketId, recent);
    return false;
  }
  recent.push(now);
  messageBuckets.set(socketId, recent);
  return true;
}

function authenticateSocket(socket) {
  const auth = socket.handshake.auth || {};
  let token = auth.token;

  if (!token && socket.handshake.headers.authorization) {
    const header = socket.handshake.headers.authorization;
    if (header.startsWith('Bearer ')) {
      token = header.split(' ')[1];
    }
  }

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    return { id: decoded.sub, username: decoded.username };
  } catch {
    return null;
  }
}

function safeAck(ack, payload) {
  if (typeof ack === 'function') ack(payload);
}

function toDMRoomKey(userA, userB) {
  return `dm-${Math.min(userA, userB)}-${Math.max(userA, userB)}`;
}

function roomConversationKey(room) {
  return `room:${room}`;
}

function dmConversationKey(userA, userB) {
  return `dm:${toDMRoomKey(userA, userB)}`;
}

function canRevokeWithin24Hours(createdAt) {
  const createdTime = new Date(createdAt).getTime();
  if (Number.isNaN(createdTime)) return false;
  return Date.now() - createdTime <= 24 * 60 * 60 * 1000;
}

function getOnlineUsersSnapshot() {
  return Array.from(onlineUsers.entries()).map(([userId, socketIds]) => ({
    userId: Number(userId),
    socketCount: socketIds.size
  }));
}

function initSocket(io) {
  io.on('connection', async (socket) => {
    const user = authenticateSocket(socket);
    if (!user) {
      socket.emit('auth:error', { message: 'Không có quyền truy cập' });
      socket.disconnect(true);
      return;
    }

    const currentSet = onlineUsers.get(user.id) || new Set();
    const wasOffline = currentSet.size === 0;
    currentSet.add(socket.id);
    onlineUsers.set(user.id, currentSet);
    await User.updateLastOnline(user.id);

    socket.join('global');
    socket.join(`user:${user.id}`);

    socket.emit('presence:snapshot', getOnlineUsersSnapshot());

    if (wasOffline) {
      io.emit('presence:online', { userId: user.id, username: user.username });
    }

    socket.on('chat:global', async (payload) => {
      if (!payload || typeof payload.content !== 'string') return;
      if (!canSend(socket.id)) return;

      const content = payload.content.trim();
      if (!content || content.length > 1000) return;

      const message = await Message.createMessage({
        userId: user.id,
        room: 'global',
        content,
        replyToMessageId: payload.replyToMessageId || null
      });

      io.to('global').emit('chat:global', {
        id: message.id,
        userId: user.id,
        username: user.username,
        content,
        room: 'global',
        replyToMessageId: payload.replyToMessageId || null,
        createdAt: new Date().toISOString()
      });
    });

    socket.on('room:join', (payload) => {
      if (!payload || !payload.room) return;
      socket.join(payload.room);
      socket.emit('room:joined', { room: payload.room });
    });

    socket.on('chat:room', async (payload) => {
      if (!payload || !payload.room || typeof payload.content !== 'string') return;
      if (!canSend(socket.id)) return;

      const content = payload.content.trim();
      if (!content || content.length > 1000) return;

      const message = await Message.createMessage({
        userId: user.id,
        room: payload.room,
        content,
        replyToMessageId: payload.replyToMessageId || null
      });

      io.to(payload.room).emit('chat:room', {
        id: message.id,
        userId: user.id,
        username: user.username,
        content,
        room: payload.room,
        replyToMessageId: payload.replyToMessageId || null,
        createdAt: new Date().toISOString()
      });
    });

    socket.on('message:revoke', async (payload, ack) => {
      try {
        const { type, messageId, room, toUserId } = payload || {};
        const parsedMessageId = Number(messageId);
        if (!Number.isFinite(parsedMessageId)) {
          safeAck(ack, { ok: false, message: 'Mã tin nhắn không hợp lệ' });
          return;
        }

        if (type === 'room') {
          const found = await Message.findById(parsedMessageId);
          if (!found || found.user_id !== user.id || found.room !== room || found.is_revoked) {
            safeAck(ack, { ok: false, message: 'Không thể thu hồi tin nhắn này' });
            return;
          }
          if (!canRevokeWithin24Hours(found.created_at)) {
            safeAck(ack, { ok: false, message: 'Chỉ thu hồi được trong 24 giờ' });
            return;
          }
          await Message.revokeMessage(parsedMessageId);
          io.to(room).emit('message:revoked', { type: 'room', room, messageId: parsedMessageId });
          safeAck(ack, { ok: true });
          return;
        }

        if (type === 'dm') {
          const targetUserId = Number(toUserId);
          if (!Number.isFinite(targetUserId)) {
            safeAck(ack, { ok: false, message: 'Mã người dùng không hợp lệ' });
            return;
          }
          const found = await DirectMessage.findById(parsedMessageId);
          if (!found || found.sender_id !== user.id || found.is_revoked) {
            safeAck(ack, { ok: false, message: 'Không thể thu hồi tin nhắn này' });
            return;
          }
          if (!canRevokeWithin24Hours(found.created_at)) {
            safeAck(ack, { ok: false, message: 'Chỉ thu hồi được trong 24 giờ' });
            return;
          }
          await DirectMessage.revokeDirectMessage(parsedMessageId);
          const roomKey = toDMRoomKey(user.id, targetUserId);
          io.to(`user:${user.id}`).emit('message:revoked', { type: 'dm', room: roomKey, messageId: parsedMessageId });
          io.to(`user:${targetUserId}`).emit('message:revoked', { type: 'dm', room: roomKey, messageId: parsedMessageId });
          safeAck(ack, { ok: true });
          return;
        }

        safeAck(ack, { ok: false, message: 'Loại hội thoại không hợp lệ' });
      } catch {
        safeAck(ack, { ok: false, message: 'Thu hồi thất bại' });
      }
    });

    socket.on('message:pin', (payload, ack) => {
      const { type, room, toUserId, message } = payload || {};
      if (!message?.id) {
        safeAck(ack, { ok: false, message: 'Tin nhắn không hợp lệ' });
        return;
      }

      if (type === 'room') {
        const key = roomConversationKey(room);
        pinnedByConversation.set(key, message);
        io.to(room).emit('message:pinned', { conversationKey: key, message });
        safeAck(ack, { ok: true });
        return;
      }

      if (type === 'dm') {
        const peer = Number(toUserId);
        if (!Number.isFinite(peer)) {
          safeAck(ack, { ok: false, message: 'Mã người dùng không hợp lệ' });
          return;
        }
        const key = dmConversationKey(user.id, peer);
        pinnedByConversation.set(key, message);
        io.to(`user:${user.id}`).emit('message:pinned', { conversationKey: key, message });
        io.to(`user:${peer}`).emit('message:pinned', { conversationKey: key, message });
        safeAck(ack, { ok: true });
        return;
      }

      safeAck(ack, { ok: false, message: 'Loại hội thoại không hợp lệ' });
    });

    socket.on('message:forward', async (payload, ack) => {
      try {
        const toUserId = Number(payload?.toUserId);
        const content = payload?.content?.trim();
        if (!Number.isFinite(toUserId) || !content) {
          safeAck(ack, { ok: false, message: 'Dữ liệu không hợp lệ' });
          return;
        }
        const isFriend = await Friend.areFriends(user.id, toUserId);
        if (!isFriend) {
          safeAck(ack, { ok: false, message: 'Chỉ chuyển tiếp cho bạn bè' });
          return;
        }

        const created = await DirectMessage.createDirectMessage({
          senderId: user.id,
          receiverId: toUserId,
          content: `[Forward] ${content}`
        });

        const messagePayload = {
          id: created.id,
          senderId: user.id,
          senderUsername: user.username,
          receiverId: toUserId,
          content: `[Forward] ${content}`,
          createdAt: new Date().toISOString(),
          room: toDMRoomKey(user.id, toUserId)
        };

        io.to(`user:${user.id}`).emit('dm:new', messagePayload);
        io.to(`user:${toUserId}`).emit('dm:new', messagePayload);

        safeAck(ack, { ok: true });
      } catch {
        safeAck(ack, { ok: false, message: 'Chuyển tiếp thất bại' });
      }
    });

    socket.on('friend:request', async (payload, ack) => {
      try {
        const username = payload?.username?.trim();
        if (!username) {
          safeAck(ack, { ok: false, message: 'Vui lòng nhập username' });
          return;
        }

        const target = await Friend.findUserByUsername(username);
        if (!target) {
          safeAck(ack, { ok: false, message: 'Không tìm thấy người dùng' });
          return;
        }

        if (target.id === user.id) {
          safeAck(ack, { ok: false, message: 'Bạn không thể kết bạn với chính mình' });
          return;
        }

        const alreadyFriends = await Friend.areFriends(user.id, target.id);
        if (alreadyFriends) {
          safeAck(ack, { ok: false, message: 'Hai bạn đã là bạn bè' });
          return;
        }

        const hasPending = await Friend.hasPendingRequestBetween(user.id, target.id);
        if (hasPending) {
          safeAck(ack, { ok: false, message: 'Đã có lời mời kết bạn đang chờ xử lý' });
          return;
        }

        const requestId = await Friend.createFriendRequest(user.id, target.id);
        const requestPayload = {
          id: requestId,
          senderId: user.id,
          senderUsername: user.username,
          createdAt: new Date().toISOString()
        };

        io.to(`user:${target.id}`).emit('friend:request:new', requestPayload);
        safeAck(ack, { ok: true, message: 'Đã gửi lời mời kết bạn' });
      } catch {
        safeAck(ack, { ok: false, message: 'Gửi lời mời thất bại' });
      }
    });

    socket.on('friend:accept', async (payload, ack) => {
      try {
        const requestId = Number(payload?.requestId);
        if (!Number.isFinite(requestId)) {
          safeAck(ack, { ok: false, message: 'Mã lời mời không hợp lệ' });
          return;
        }

        const request = await Friend.findRequestById(requestId);
        if (!request || request.status !== 'pending') {
          safeAck(ack, { ok: false, message: 'Không tìm thấy lời mời đang chờ xử lý' });
          return;
        }

        if (request.receiver_id !== user.id) {
          safeAck(ack, { ok: false, message: 'Bạn không có quyền xử lý lời mời này' });
          return;
        }

        await Friend.updateRequestStatus(requestId, 'accepted');
        await Friend.createFriendship(request.sender_id, request.receiver_id);

        const sender = await Friend.findUserById(request.sender_id);
        const receiver = await Friend.findUserById(request.receiver_id);
        if (!sender || !receiver) {
          safeAck(ack, { ok: false, message: 'Không tìm thấy người dùng' });
          return;
        }

        io.to(`user:${request.sender_id}`).emit('friend:accepted', {
          requestId,
          friend: { userId: receiver.id, username: receiver.username }
        });

        io.to(`user:${request.receiver_id}`).emit('friend:accepted', {
          requestId,
          friend: { userId: sender.id, username: sender.username }
        });

        safeAck(ack, { ok: true, message: 'Đã chấp nhận lời mời kết bạn' });
      } catch {
        safeAck(ack, { ok: false, message: 'Chấp nhận lời mời thất bại' });
      }
    });

    socket.on('friend:reject', async (payload, ack) => {
      try {
        const requestId = Number(payload?.requestId);
        if (!Number.isFinite(requestId)) {
          safeAck(ack, { ok: false, message: 'Mã lời mời không hợp lệ' });
          return;
        }

        const request = await Friend.findRequestById(requestId);
        if (!request || request.status !== 'pending') {
          safeAck(ack, { ok: false, message: 'Không tìm thấy lời mời đang chờ xử lý' });
          return;
        }

        if (request.receiver_id !== user.id) {
          safeAck(ack, { ok: false, message: 'Bạn không có quyền xử lý lời mời này' });
          return;
        }

        await Friend.updateRequestStatus(requestId, 'rejected');
        io.to(`user:${request.sender_id}`).emit('friend:rejected', { requestId, byUserId: user.id });
        safeAck(ack, { ok: true, message: 'Đã từ chối lời mời kết bạn' });
      } catch {
        safeAck(ack, { ok: false, message: 'Từ chối lời mời thất bại' });
      }
    });

    socket.on('friend:remove', async (payload, ack) => {
      try {
        const friendUserId = Number(payload?.friendUserId);
        if (!Number.isFinite(friendUserId)) {
          safeAck(ack, { ok: false, message: 'Mã người dùng không hợp lệ' });
          return;
        }

        const deleted = await Friend.removeFriendship(user.id, friendUserId);
        if (!deleted) {
          safeAck(ack, { ok: false, message: 'Không tìm thấy quan hệ bạn bè' });
          return;
        }

        io.to(`user:${user.id}`).emit('friend:removed', { friendUserId });
        io.to(`user:${friendUserId}`).emit('friend:removed', { friendUserId: user.id });
        safeAck(ack, { ok: true, message: 'Đã hủy kết bạn' });
      } catch {
        safeAck(ack, { ok: false, message: 'Hủy kết bạn thất bại' });
      }
    });

    socket.on('dm:typing', async (payload) => {
      const toUserId = Number(payload?.toUserId);
      if (!Number.isFinite(toUserId)) return;

      const isFriend = await Friend.areFriends(user.id, toUserId);
      if (!isFriend) return;

      io.to(`user:${toUserId}`).emit('dm:typing', {
        fromUserId: user.id,
        toUserId,
        isTyping: Boolean(payload?.isTyping)
      });
    });

    socket.on('dm:send', async (payload, ack) => {
      try {
        if (!canSend(socket.id)) {
          safeAck(ack, { ok: false, message: 'Bạn gửi tin quá nhanh, vui lòng thử lại sau' });
          return;
        }

        const toUserId = Number(payload?.toUserId);
        const content = payload?.content?.trim();

        if (!Number.isFinite(toUserId)) {
          safeAck(ack, { ok: false, message: 'Mã người dùng không hợp lệ' });
          return;
        }

        if (!content) {
          safeAck(ack, { ok: false, message: 'Nội dung tin nhắn không được để trống' });
          return;
        }

        if (content.length > 1000) {
          safeAck(ack, { ok: false, message: 'Tin nhắn quá dài' });
          return;
        }

        if (toUserId === user.id) {
          safeAck(ack, { ok: false, message: 'Không thể nhắn tin cho chính mình' });
          return;
        }

        const isFriend = await Friend.areFriends(user.id, toUserId);
        if (!isFriend) {
          safeAck(ack, { ok: false, message: 'Bạn chỉ có thể nhắn tin với bạn bè' });
          return;
        }

        const created = await DirectMessage.createDirectMessage({
          senderId: user.id,
          receiverId: toUserId,
          content,
          replyToMessageId: payload.replyToMessageId || null
        });

        const messagePayload = {
          id: created.id,
          senderId: user.id,
          senderUsername: user.username,
          receiverId: toUserId,
          content,
          replyToMessageId: payload.replyToMessageId || null,
          createdAt: new Date().toISOString(),
          room: toDMRoomKey(user.id, toUserId)
        };

        io.to(`user:${user.id}`).emit('dm:new', messagePayload);
        io.to(`user:${toUserId}`).emit('dm:new', messagePayload);

        safeAck(ack, { ok: true });
      } catch {
        safeAck(ack, { ok: false, message: 'Gửi tin nhắn thất bại' });
      }
    });

    socket.on('disconnect', async () => {
      const current = onlineUsers.get(user.id);
      if (current) {
        current.delete(socket.id);
        if (current.size === 0) {
          onlineUsers.delete(user.id);
          await User.updateLastOnline(user.id);
          io.emit('presence:offline', { userId: user.id, username: user.username });
        } else {
          onlineUsers.set(user.id, current);
        }
      }
    });
  });
}

module.exports = initSocket;
