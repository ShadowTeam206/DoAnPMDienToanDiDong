import { useEffect, useMemo, useRef, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import ChatHeader from '../components/chat/ChatHeader';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';
import useAuthRedirect from '../hooks/useAuthRedirect';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';
import api from '../api/axios';
import { getSocket, disconnectSocket } from '../socket/client';

const buildDmRoomKey = (userA, userB) => `dm-${Math.min(userA, userB)}-${Math.max(userA, userB)}`;
const roomConversationKey = (room) => `room:${room}`;
const dmConversationKey = (a, b) => `dm:${buildDmRoomKey(a, b)}`;

function ChatPage() {
  useAuthRedirect(true);

  const currentRoom = useChatStore((s) => s.currentRoom);
  const currentDMUser = useChatStore((s) => s.currentDMUser);
  const messagesByRoom = useChatStore((s) => s.messagesByRoom);
  const setMessagesForRoom = useChatStore((s) => s.setMessagesForRoom);
  const updateMessageInRoom = useChatStore((s) => s.updateMessageInRoom);
  const setChannels = useChatStore((s) => s.setChannels);
  const appendMessage = useChatStore((s) => s.appendMessage);
  const setConnectionStatus = useChatStore((s) => s.setConnectionStatus);
  const setOnlineUsers = useChatStore((s) => s.setOnlineUsers);
  const addOnlineUser = useChatStore((s) => s.addOnlineUser);
  const removeOnlineUser = useChatStore((s) => s.removeOnlineUser);
  const friends = useChatStore((s) => s.friends);
  const setFriends = useChatStore((s) => s.setFriends);
  const addFriend = useChatStore((s) => s.addFriend);
  const removeFriendByUserId = useChatStore((s) => s.removeFriendByUserId);
  const setPendingRequests = useChatStore((s) => s.setPendingRequests);
  const addPendingRequest = useChatStore((s) => s.addPendingRequest);
  const removePendingRequest = useChatStore((s) => s.removePendingRequest);
  const incrementUnreadForUser = useChatStore((s) => s.incrementUnreadForUser);
  const markDmActivity = useChatStore((s) => s.markDmActivity);
  const setDmTyping = useChatStore((s) => s.setDmTyping);
  const dmTypingByUserId = useChatStore((s) => s.dmTypingByUserId);
  const replyDraft = useChatStore((s) => s.replyDraft);
  const setReplyDraft = useChatStore((s) => s.setReplyDraft);
  const clearReplyDraft = useChatStore((s) => s.clearReplyDraft);
  const pinnedByConversation = useChatStore((s) => s.pinnedByConversation);
  const setPinnedMessageForConversation = useChatStore((s) => s.setPinnedMessageForConversation);
  const connectionStatus = useChatStore((s) => s.connectionStatus);
  const user = useAuthStore((s) => s.user);
  const [scrollBehavior, setScrollBehavior] = useState('auto');
  const [forwardTargetUserId, setForwardTargetUserId] = useState('');
  const [forwardMessage, setForwardMessage] = useState(null);
  const typingThrottleRef = useRef(0);

  const activeRoomKey = useMemo(() => {
    if (currentDMUser?.userId && user?.id) {
      return buildDmRoomKey(user.id, currentDMUser.userId);
    }
    return currentRoom;
  }, [currentDMUser, currentRoom, user]);

  const activeConversationKey = useMemo(() => {
    if (currentDMUser?.userId && user?.id) {
      return dmConversationKey(user.id, currentDMUser.userId);
    }
    return roomConversationKey(currentRoom);
  }, [currentDMUser, currentRoom, user]);

  const pinnedMessage = pinnedByConversation[activeConversationKey] || null;

  const typingText = useMemo(() => {
    if (!currentDMUser?.userId) return '';
    return dmTypingByUserId[currentDMUser.userId] ? `${currentDMUser.username} đang nhập...` : '';
  }, [currentDMUser, dmTypingByUserId]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [roomsRes, friendsRes, requestsRes] = await Promise.all([
          api.get('/api/chat/rooms'),
          api.get('/api/friends'),
          api.get('/api/friends/requests')
        ]);
        setChannels(roomsRes.data || []);
        setFriends(friendsRes.data || []);
        setPendingRequests(requestsRes.data || []);
      } catch {
        setChannels([]);
        setFriends([]);
        setPendingRequests([]);
      }
    };

    fetchInitialData();
  }, [setChannels, setFriends, setPendingRequests]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        if (currentDMUser?.userId && user?.id) {
          const roomKey = buildDmRoomKey(user.id, currentDMUser.userId);
          const res = await api.get(`/api/dm/${currentDMUser.userId}`);
          setMessagesForRoom(roomKey, res.data || []);
          (res.data || []).forEach((m) => {
            const peerId = m.senderId === user.id ? m.receiverId : m.senderId;
            markDmActivity(peerId, m.createdAt);
          });
        } else if (currentRoom === 'global') {
          const res = await api.get('/api/chat/global');
          setMessagesForRoom('global', res.data || []);
        } else {
          const res = await api.get(`/api/chat/room/${encodeURIComponent(currentRoom)}`);
          setMessagesForRoom(currentRoom, res.data || []);
        }
        setScrollBehavior('auto');
      } catch {
        setMessagesForRoom(activeRoomKey, []);
      }
    };

    fetchHistory();
  }, [currentDMUser, currentRoom, user, setMessagesForRoom, activeRoomKey, markDmActivity]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    setConnectionStatus(socket.connected ? 'connected' : 'connecting');
    socket.emit('room:join', { room: currentRoom });

    const handleGlobal = (payload) => {
      if (!payload || payload.room !== 'global') return;
      appendMessage('global', payload);
      setScrollBehavior('smooth');
    };

    const handleRoom = (payload) => {
      if (!payload || !payload.room) return;
      appendMessage(payload.room, payload);
      setScrollBehavior('smooth');
    };

    const handleDM = (payload) => {
      if (!payload || !payload.senderId || !payload.receiverId || !user?.id) return;
      const dmRoomKey = buildDmRoomKey(payload.senderId, payload.receiverId);
      const normalized = {
        ...payload,
        username: payload.senderUsername,
        createdAt: payload.createdAt
      };
      appendMessage(dmRoomKey, normalized);

      const peerId = payload.senderId === user.id ? payload.receiverId : payload.senderId;
      markDmActivity(peerId, payload.createdAt);
      setDmTyping(peerId, false);

      if (payload.senderId !== user.id) {
        incrementUnreadForUser(payload.senderId);
      }
      setScrollBehavior('smooth');
    };

    const handleDmTyping = (payload) => {
      if (!payload?.fromUserId || !payload?.toUserId || !user?.id) return;
      if (payload.toUserId !== user.id) return;
      setDmTyping(payload.fromUserId, Boolean(payload.isTyping));
    };

    const handleRevoked = (payload) => {
      if (!payload?.room || !payload?.messageId) return;
      updateMessageInRoom(payload.room, payload.messageId, { content: 'Tin nhắn đã được thu hồi', isRevoked: true });
    };

    const handlePinned = (payload) => {
      if (!payload?.conversationKey) return;
      setPinnedMessageForConversation(payload.conversationKey, payload.message || null);
    };

    const handleFriendRequestNew = (payload) => {
      addPendingRequest(payload);
    };

    const handleFriendAccepted = (payload) => {
      if (!payload?.friend) return;
      addFriend(payload.friend);
      if (payload.requestId) {
        removePendingRequest(payload.requestId);
      }
    };

    const handleFriendRemoved = (payload) => {
      if (!payload?.friendUserId) return;
      removeFriendByUserId(payload.friendUserId);
    };

    const handleConnect = () => {
      setConnectionStatus('connected');
      socket.emit('room:join', { room: currentRoom });
    };

    const handleReconnectAttempt = () => {
      setConnectionStatus('reconnecting');
    };

    const handleReconnect = () => {
      setConnectionStatus('connected');
      socket.emit('room:join', { room: currentRoom });
    };

    const handleDisconnect = () => {
      setConnectionStatus('offline');
    };

    const handlePresenceSnapshot = (payload) => {
      const snapshot = Array.isArray(payload)
        ? payload
            .filter((u) => Number(u.userId) > 0 && Number(u.socketCount) > 0)
            .map((u) => ({ userId: Number(u.userId) }))
        : [];
      setOnlineUsers(snapshot);
    };

    const handlePresenceOnline = (payload) => {
      addOnlineUser(payload);
    };

    const handlePresenceOffline = (payload) => {
      if (!payload || !payload.userId) return;
      removeOnlineUser(payload.userId);
    };

    socket.on('chat:global', handleGlobal);
    socket.on('chat:room', handleRoom);
    socket.on('dm:new', handleDM);
    socket.on('dm:typing', handleDmTyping);
    socket.on('message:revoked', handleRevoked);
    socket.on('message:pinned', handlePinned);
    socket.on('friend:request:new', handleFriendRequestNew);
    socket.on('friend:accepted', handleFriendAccepted);
    socket.on('friend:removed', handleFriendRemoved);
    socket.on('presence:snapshot', handlePresenceSnapshot);
    socket.on('connect', handleConnect);
    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('reconnect', handleReconnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('presence:online', handlePresenceOnline);
    socket.on('presence:offline', handlePresenceOffline);

    return () => {
      socket.off('chat:global', handleGlobal);
      socket.off('chat:room', handleRoom);
      socket.off('dm:new', handleDM);
      socket.off('dm:typing', handleDmTyping);
      socket.off('message:revoked', handleRevoked);
      socket.off('message:pinned', handlePinned);
      socket.off('friend:request:new', handleFriendRequestNew);
      socket.off('friend:accepted', handleFriendAccepted);
      socket.off('friend:removed', handleFriendRemoved);
      socket.off('presence:snapshot', handlePresenceSnapshot);
      socket.off('connect', handleConnect);
      socket.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('reconnect', handleReconnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('presence:online', handlePresenceOnline);
      socket.off('presence:offline', handlePresenceOffline);
    };
  }, [
    currentRoom,
    user,
    appendMessage,
    updateMessageInRoom,
    setConnectionStatus,
    setOnlineUsers,
    setPinnedMessageForConversation,
    addOnlineUser,
    removeOnlineUser,
    addPendingRequest,
    addFriend,
    removePendingRequest,
    removeFriendByUserId,
    incrementUnreadForUser,
    markDmActivity,
    setDmTyping
  ]);

  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  const handleTypingChange = (isTyping) => {
    const socket = getSocket();
    if (!socket || !user || !currentDMUser?.userId) return;

    const now = Date.now();
    if (isTyping && now - typingThrottleRef.current < 400) return;
    typingThrottleRef.current = now;

    socket.emit('dm:typing', {
      toUserId: currentDMUser.userId,
      isTyping: Boolean(isTyping)
    });
  };

  const handleSend = (content) => {
    const socket = getSocket();
    if (!socket || !user) return;

    if (currentDMUser?.userId) {
      socket.emit('dm:send', {
        toUserId: currentDMUser.userId,
        content,
        replyToMessageId: replyDraft?.id || null
      });
      clearReplyDraft();
      return;
    }

    if (currentRoom === 'global') {
      socket.emit('chat:global', {
        content,
        replyToMessageId: replyDraft?.id || null
      });
      clearReplyDraft();
    } else {
      socket.emit('chat:room', {
        room: currentRoom,
        content,
        replyToMessageId: replyDraft?.id || null
      });
      clearReplyDraft();
    }
  };

  const handleMessageAction = (action, message) => {
    const socket = getSocket();
    if (!socket || !message) return;

    if (action === 'copy') {
      navigator.clipboard?.writeText(message.content || '');
      return;
    }

    if (action === 'reply') {
      setReplyDraft({
        id: message.id,
        username: message.username,
        content: message.content
      });
      return;
    }

    if (action === 'forward') {
      setForwardMessage(message);
      setForwardTargetUserId(currentDMUser?.userId ? String(currentDMUser.userId) : '');
      return;
    }

    if (action === 'pin') {
      if (currentDMUser?.userId) {
        socket.emit('message:pin', {
          type: 'dm',
          toUserId: currentDMUser.userId,
          message
        });
      } else {
        socket.emit('message:pin', {
          type: 'room',
          room: currentRoom,
          message
        });
      }
      return;
    }

    if (action === 'revoke') {
      if (currentDMUser?.userId) {
        socket.emit('message:revoke', {
          type: 'dm',
          messageId: message.id,
          toUserId: currentDMUser.userId
        });
      } else {
        socket.emit('message:revoke', {
          type: 'room',
          room: currentRoom,
          messageId: message.id
        });
      }
    }
  };

  const messages = messagesByRoom[activeRoomKey] || [];
  const inputDisabled = currentDMUser ? false : connectionStatus !== 'connected';

  return (
    <MainLayout header={<ChatHeader />}>
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {pinnedMessage && (
          <div className="mx-4 mt-3 shrink-0 rounded border-l-2 border-yellow-400 bg-yellow-900/20 px-3 py-2 text-xs text-yellow-100">
            📌 {pinnedMessage.username}: {pinnedMessage.content}
          </div>
        )}
        <MessageList
          messages={messages}
          scrollBehavior={scrollBehavior}
          onAction={handleMessageAction}
          currentUser={user}
        />
        {typingText && <div className="px-4 pb-1 shrink-0 text-xs text-textSecondary">{typingText}</div>}

        {forwardMessage && (
        <div className="mx-4 mb-2 rounded border border-white/10 bg-[#1f2124] p-3 text-xs">
          <div className="mb-2 font-semibold text-textPrimary">Chuyển tiếp tin nhắn</div>
          <div className="mb-2 rounded bg-black/20 px-2 py-1 text-textSecondary">{forwardMessage.content}</div>
          <div className="flex items-center gap-2">
            <select
              value={forwardTargetUserId}
              onChange={(e) => setForwardTargetUserId(e.target.value)}
              className="flex-1 rounded bg-inputBg px-2 py-1.5 text-xs outline-none"
            >
              <option value="">Chọn bạn để chuyển tiếp...</option>
              {friends.map((f) => (
                <option key={f.userId} value={f.userId}>
                  {f.username}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                const socket = getSocket();
                const toUserId = Number(forwardTargetUserId);
                if (!socket || !Number.isFinite(toUserId) || !forwardMessage?.content) return;
                socket.emit('message:forward', {
                  toUserId,
                  content: forwardMessage.content
                });
                setForwardMessage(null);
                setForwardTargetUserId('');
              }}
              className="rounded bg-accent px-2 py-1.5 font-semibold"
            >
              Chuyển tiếp
            </button>
            <button
              type="button"
              onClick={() => {
                setForwardMessage(null);
                setForwardTargetUserId('');
              }}
              className="rounded bg-inputBg px-2 py-1.5"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

        <MessageInput
          onSend={handleSend}
          disabled={inputDisabled}
          onTypingChange={currentDMUser ? handleTypingChange : undefined}
          replyDraft={replyDraft}
          onCancelReply={clearReplyDraft}
        />
      </div>
    </MainLayout>
  );
}

export default ChatPage;
