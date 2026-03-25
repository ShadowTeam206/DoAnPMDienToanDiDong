const Friend = require('../models/Friend');

async function getFriends(req, res) {
  const friends = await Friend.getFriends(req.user.id);
  return res.json(friends.map((f) => ({ userId: f.user_id, username: f.username })));
}

async function getPendingRequests(req, res) {
  const requests = await Friend.getPendingRequestsForUser(req.user.id);
  return res.json(
    requests.map((r) => ({
      id: r.id,
      senderId: r.sender_id,
      senderUsername: r.sender_username,
      createdAt: r.created_at
    }))
  );
}

async function sendFriendRequest(req, res) {
  const username = req.body?.username?.trim();
  if (!username) {
    return res.status(400).json({ message: 'Vui lòng nhập username' });
  }

  const target = await Friend.findUserByUsername(username);
  if (!target) {
    return res.status(404).json({ message: 'Không tìm thấy người dùng' });
  }

  if (target.id === req.user.id) {
    return res.status(400).json({ message: 'Bạn không thể kết bạn với chính mình' });
  }

  const alreadyFriends = await Friend.areFriends(req.user.id, target.id);
  if (alreadyFriends) {
    return res.status(409).json({ message: 'Hai bạn đã là bạn bè' });
  }

  const hasPending = await Friend.hasPendingRequestBetween(req.user.id, target.id);
  if (hasPending) {
    return res.status(409).json({ message: 'Đã có lời mời kết bạn đang chờ xử lý' });
  }

  const requestId = await Friend.createFriendRequest(req.user.id, target.id);
  return res.status(201).json({ id: requestId, message: 'Đã gửi lời mời kết bạn' });
}

async function acceptFriendRequest(req, res) {
  const requestId = Number(req.params.requestId);
  if (!Number.isFinite(requestId)) {
    return res.status(400).json({ message: 'Mã lời mời không hợp lệ' });
  }

  const request = await Friend.findRequestById(requestId);
  if (!request || request.status !== 'pending') {
    return res.status(404).json({ message: 'Không tìm thấy lời mời đang chờ xử lý' });
  }

  if (request.receiver_id !== req.user.id) {
    return res.status(403).json({ message: 'Bạn không có quyền xử lý lời mời này' });
  }

  await Friend.updateRequestStatus(requestId, 'accepted');
  await Friend.createFriendship(request.sender_id, request.receiver_id);

  return res.json({ success: true, message: 'Đã chấp nhận lời mời kết bạn' });
}

async function rejectFriendRequest(req, res) {
  const requestId = Number(req.params.requestId);
  if (!Number.isFinite(requestId)) {
    return res.status(400).json({ message: 'Mã lời mời không hợp lệ' });
  }

  const request = await Friend.findRequestById(requestId);
  if (!request || request.status !== 'pending') {
    return res.status(404).json({ message: 'Không tìm thấy lời mời đang chờ xử lý' });
  }

  if (request.receiver_id !== req.user.id) {
    return res.status(403).json({ message: 'Bạn không có quyền xử lý lời mời này' });
  }

  await Friend.updateRequestStatus(requestId, 'rejected');
  return res.json({ success: true, message: 'Đã từ chối lời mời kết bạn' });
}

async function unfriend(req, res) {
  const friendUserId = Number(req.params.friendUserId);
  if (!Number.isFinite(friendUserId)) {
    return res.status(400).json({ message: 'Mã người dùng không hợp lệ' });
  }

  const deleted = await Friend.removeFriendship(req.user.id, friendUserId);
  if (!deleted) {
    return res.status(404).json({ message: 'Không tìm thấy quan hệ bạn bè' });
  }

  return res.json({ success: true, message: 'Đã hủy kết bạn' });
}

module.exports = {
  getFriends,
  getPendingRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  unfriend
};
