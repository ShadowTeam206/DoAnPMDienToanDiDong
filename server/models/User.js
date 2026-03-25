const db = require('../config/db');

async function createUser({ username, passwordHash }) {
  const [result] = await db.execute(
    'INSERT INTO users (username, password_hash) VALUES (?, ?)',
    [username, passwordHash]
  );
  return { id: result.insertId, username };
}

async function findByUsername(username) {
  const [rows] = await db.execute(
    'SELECT id, username, password_hash FROM users WHERE username = ? LIMIT 1',
    [username]
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await db.execute(
    'SELECT id, username FROM users WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

async function updateLastOnline(id) {
  await db.execute('UPDATE users SET last_online = NOW() WHERE id = ?', [id]);
}

module.exports = {
  createUser,
  findByUsername,
  findById,
  updateLastOnline
};

