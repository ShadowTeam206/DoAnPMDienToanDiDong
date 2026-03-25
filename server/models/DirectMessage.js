const db = require('../config/db');

async function createDirectMessage({ senderId, receiverId, content, replyToMessageId = null }) {
  const [result] = await db.execute(
    'INSERT INTO direct_messages (sender_id, receiver_id, content, reply_to_message_id) VALUES (?, ?, ?, ?)',
    [senderId, receiverId, content, replyToMessageId]
  );
  return { id: result.insertId, senderId, receiverId, content, replyToMessageId };
}

async function getDirectMessagesBetweenUsers(userId, otherUserId, limit = 100) {
  const [rows] = await db.execute(
    `SELECT dm.id, dm.sender_id, dm.receiver_id, dm.content, dm.created_at, dm.is_revoked, dm.revoked_at,
            dm.reply_to_message_id,
            su.username AS sender_username,
            ru.username AS receiver_username,
            rdm.content AS reply_content,
            rsu.username AS reply_sender_username
     FROM direct_messages dm
     JOIN users su ON su.id = dm.sender_id
     JOIN users ru ON ru.id = dm.receiver_id
     LEFT JOIN direct_messages rdm ON rdm.id = dm.reply_to_message_id
     LEFT JOIN users rsu ON rsu.id = rdm.sender_id
     WHERE (dm.sender_id = ? AND dm.receiver_id = ?)
        OR (dm.sender_id = ? AND dm.receiver_id = ?)
     ORDER BY dm.created_at DESC
     LIMIT ?`,
    [userId, otherUserId, otherUserId, userId, limit]
  );

  return rows.reverse();
}

async function findById(messageId) {
  const [rows] = await db.execute(
    'SELECT id, sender_id, receiver_id, created_at, is_revoked FROM direct_messages WHERE id = ? LIMIT 1',
    [messageId]
  );
  return rows[0] || null;
}

async function revokeDirectMessage(messageId) {
  await db.execute(
    "UPDATE direct_messages SET is_revoked = 1, revoked_at = NOW(), content = 'Tin nhắn đã được thu hồi' WHERE id = ?",
    [messageId]
  );
}

module.exports = {
  createDirectMessage,
  getDirectMessagesBetweenUsers,
  findById,
  revokeDirectMessage
};
