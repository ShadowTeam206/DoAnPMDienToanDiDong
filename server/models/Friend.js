const db = require('../config/db');

async function findUserByUsername(username) {
  const [rows] = await db.execute('SELECT id, username FROM users WHERE username = ? LIMIT 1', [username]);
  return rows[0] || null;
}

async function findUserById(userId) {
  const [rows] = await db.execute('SELECT id, username FROM users WHERE id = ? LIMIT 1', [userId]);
  return rows[0] || null;
}

async function areFriends(userId, otherUserId) {
  const [rows] = await db.execute(
    `SELECT id FROM friendships
     WHERE user_one_id = LEAST(?, ?) AND user_two_id = GREATEST(?, ?)
     LIMIT 1`,
    [userId, otherUserId, userId, otherUserId]
  );
  return Boolean(rows[0]);
}

async function createFriendRequest(senderId, receiverId) {
  const [result] = await db.execute(
    `INSERT INTO friend_requests (sender_id, receiver_id, status)
     VALUES (?, ?, 'pending')`,
    [senderId, receiverId]
  );
  return result.insertId;
}

async function hasPendingRequestBetween(userId, otherUserId) {
  const [rows] = await db.execute(
    `SELECT id FROM friend_requests
     WHERE status = 'pending'
       AND ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
     LIMIT 1`,
    [userId, otherUserId, otherUserId, userId]
  );
  return Boolean(rows[0]);
}

async function getPendingRequestsForUser(userId) {
  const [rows] = await db.execute(
    `SELECT fr.id, fr.sender_id, fr.receiver_id, fr.created_at,
            u.username AS sender_username
     FROM friend_requests fr
     JOIN users u ON u.id = fr.sender_id
     WHERE fr.receiver_id = ? AND fr.status = 'pending'
     ORDER BY fr.created_at DESC`,
    [userId]
  );
  return rows;
}

async function findRequestById(requestId) {
  const [rows] = await db.execute(
    'SELECT id, sender_id, receiver_id, status FROM friend_requests WHERE id = ? LIMIT 1',
    [requestId]
  );
  return rows[0] || null;
}

async function updateRequestStatus(requestId, status) {
  await db.execute('UPDATE friend_requests SET status = ? WHERE id = ?', [status, requestId]);
}

async function createFriendship(userId, otherUserId) {
  await db.execute(
    `INSERT IGNORE INTO friendships (user_one_id, user_two_id)
     VALUES (LEAST(?, ?), GREATEST(?, ?))`,
    [userId, otherUserId, userId, otherUserId]
  );
}

async function getFriends(userId) {
  const [rows] = await db.execute(
    `SELECT u.id AS user_id, u.username
     FROM friendships f
     JOIN users u ON u.id = CASE
       WHEN f.user_one_id = ? THEN f.user_two_id
       ELSE f.user_one_id
     END
     WHERE f.user_one_id = ? OR f.user_two_id = ?
     ORDER BY u.username ASC`,
    [userId, userId, userId]
  );
  return rows;
}

async function removeFriendship(userId, otherUserId) {
  const [result] = await db.execute(
    `DELETE FROM friendships
     WHERE user_one_id = LEAST(?, ?) AND user_two_id = GREATEST(?, ?)`,
    [userId, otherUserId, userId, otherUserId]
  );
  return result.affectedRows || 0;
}

module.exports = {
  findUserByUsername,
  findUserById,
  areFriends,
  createFriendRequest,
  hasPendingRequestBetween,
  getPendingRequestsForUser,
  findRequestById,
  updateRequestStatus,
  createFriendship,
  getFriends,
  removeFriendship
};
