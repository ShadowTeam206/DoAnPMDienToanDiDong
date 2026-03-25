const Message = require('../models/Message');
const Room = require('../models/Room');

const normalizeRoomId = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '');

async function getRooms(req, res) {
  const rooms = await Room.getRooms();
  const formatted = rooms.map((r) => ({ id: r.room_id, label: r.label || r.room_id }));
  return res.json(formatted);
}

async function createRoom(req, res) {
  const roomName = req.body?.name;
  if (!roomName || typeof roomName !== 'string') {
    return res.status(400).json({ message: 'Tên phòng chat không hợp lệ' });
  }

  const roomId = normalizeRoomId(roomName);
  if (!roomId) {
    return res.status(400).json({ message: 'Tên phòng chat không hợp lệ' });
  }

  if (roomId === 'global') {
    return res.status(409).json({ message: 'Phòng chat đã tồn tại' });
  }

  const existed = await Room.findRoomById(roomId);
  if (existed) {
    return res.status(409).json({ message: 'Phòng chat đã tồn tại', roomId });
  }

  const label = roomId;
  await Room.createRoom({ roomId, label, createdBy: req.user?.id || null });

  return res.status(201).json({ id: roomId, label });
}

async function getGlobalMessages(req, res) {
  const messages = await Message.getRecentMessages({ room: 'global', limit: 50 });
  return res.json(messages);
}

async function getRoomMessages(req, res) {
  const { room } = req.params;
  if (!room) {
    return res.status(400).json({ message: 'Thiếu tên phòng chat' });
  }
  const messages = await Message.getRecentMessages({ room, limit: 50 });
  return res.json(messages);
}

async function deleteRoomMessages(req, res) {
  const { room } = req.params;
  if (!room) {
    return res.status(400).json({ message: 'Thiếu tên phòng chat' });
  }

  if (room === 'global') {
    return res.status(400).json({ message: 'Không thể xóa lịch sử của room global' });
  }

  await Room.deleteRoom(room);
  const deletedCount = await Message.deleteMessagesByRoom(room);
  return res.json({ success: true, deletedCount });
}

module.exports = {
  getRooms,
  createRoom,
  getGlobalMessages,
  getRoomMessages,
  deleteRoomMessages
};
