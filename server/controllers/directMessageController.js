const Friend = require('../models/Friend');
const DirectMessage = require('../models/DirectMessage');

async function getConversation(req, res) {
  const otherUserId = Number(req.params.userId);
  if (!Number.isFinite(otherUserId)) {
    return res.status(400).json({ message: 'Mã người dùng không hợp lệ' });
  }

  const messages = await DirectMessage.getDirectMessagesBetweenUsers(req.user.id, otherUserId, 100);
  return res.json(
    messages.map((m) => ({
      id: m.id,
      senderId: m.sender_id,
      senderUsername: m.sender_username,
      receiverId: m.receiver_id,
      receiverUsername: m.receiver_username,
      content: m.content,
      createdAt: m.created_at,
      room: `dm-${Math.min(m.sender_id, m.receiver_id)}-${Math.max(m.sender_id, m.receiver_id)}`
    }))
  );
}

async function sendDirectMessage(req, res) {
  const receiverUserId = Number(req.params.userId);
  const content = req.body?.content?.trim();

  if (!Number.isFinite(receiverUserId)) {
    return res.status(400).json({ message: 'Mã người dùng không hợp lệ' });
  }

  if (!content) {
    return res.status(400).json({ message: 'Nội dung tin nhắn không được để trống' });
  }

  if (content.length > 1000) {
    return res.status(400).json({ message: 'Tin nhắn quá dài' });
  }

  if (receiverUserId === req.user.id) {
    return res.status(400).json({ message: 'Không thể nhắn tin cho chính mình' });
  }

  const isFriend = await Friend.areFriends(req.user.id, receiverUserId);
  if (!isFriend) {
    return res.status(403).json({ message: 'Bạn chỉ có thể nhắn tin với bạn bè' });
  }

  const created = await DirectMessage.createDirectMessage({
    senderId: req.user.id,
    receiverId: receiverUserId,
    content
  });

  return res.status(201).json({
    id: created.id,
    senderId: req.user.id,
    receiverId: receiverUserId,
    content,
    createdAt: new Date().toISOString(),
    room: `dm-${Math.min(req.user.id, receiverUserId)}-${Math.max(req.user.id, receiverUserId)}`
  });
}

module.exports = {
  getConversation,
  sendDirectMessage
};
