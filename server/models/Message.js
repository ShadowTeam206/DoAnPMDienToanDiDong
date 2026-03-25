const db = require('../config/db');

async function createMessage({ userId, room, content, replyToMessageId = null }) {
  const [result] = await db.execute(
    'INSERT INTO messages (user_id, room, content, reply_to_message_id) VALUES (?, ?, ?, ?)',
    [userId, room, content, replyToMessageId]
  );
  return { id: result.insertId, userId, room, content, replyToMessageId };
}

async function getRecentMessages({ room, limit = 50 }) {
  const [rows] = await db.execute(
    `SELECT m.id, m.user_id, m.content, m.room, m.created_at, m.is_revoked, m.revoked_at,
            m.reply_to_message_id,
            u.username,
            rm.content AS reply_content,
            ru.username AS reply_username
     FROM messages m
     JOIN users u ON m.user_id = u.id
     LEFT JOIN messages rm ON rm.id = m.reply_to_message_id
     LEFT JOIN users ru ON ru.id = rm.user_id
     WHERE m.room = ?
     ORDER BY m.created_at DESC
     LIMIT ?`,
    [room, limit]
  );
  return rows.reverse();
}

async function findById(messageId) {
  const [rows] = await db.execute(
    'SELECT id, user_id, room, created_at, is_revoked FROM messages WHERE id = ? LIMIT 1',
    [messageId]
  );
  return rows[0] || null;
}

async function revokeMessage(messageId) {
  await db.execute(
    "UPDATE messages SET is_revoked = 1, revoked_at = NOW(), content = 'Tin nhắn đã được thu hồi' WHERE id = ?",
    [messageId]
  );
}

async function deleteMessagesByRoom(room) {
  const [result] = await db.execute('DELETE FROM messages WHERE room = ?', [room]);
  return result.affectedRows || 0;
}

module.exports = {
  createMessage,
  getRecentMessages,
  findById,
  revokeMessage,
  deleteMessagesByRoom
};
