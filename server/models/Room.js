const db = require('../config/db');

async function getRooms() {
  const [rows] = await db.execute(
    'SELECT room_id, label FROM chat_rooms ORDER BY created_at ASC'
  );
  return rows;
}

async function createRoom({ roomId, label, createdBy }) {
  const [result] = await db.execute(
    'INSERT INTO chat_rooms (room_id, label, created_by) VALUES (?, ?, ?)',
    [roomId, label, createdBy]
  );
  return { id: result.insertId, roomId, label };
}

async function findRoomById(roomId) {
  const [rows] = await db.execute(
    'SELECT id, room_id, label FROM chat_rooms WHERE room_id = ? LIMIT 1',
    [roomId]
  );
  return rows[0] || null;
}

async function deleteRoom(roomId) {
  const [result] = await db.execute('DELETE FROM chat_rooms WHERE room_id = ?', [roomId]);
  return result.affectedRows || 0;
}

module.exports = {
  getRooms,
  createRoom,
  findRoomById,
  deleteRoom
};
