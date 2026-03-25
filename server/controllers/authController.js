const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function register(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu' });
  }

  const existing = await User.findByUsername(username);
  if (existing) {
    return res.status(409).json({ message: 'Tên đăng nhập đã tồn tại' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.createUser({ username, passwordHash });

  return res.status(201).json({ id: user.id, username: user.username });
}

async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu' });
  }

  const user = await User.findByUsername(username);
  if (!user) {
    return res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu' });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu' });
  }

  const payload = { sub: user.id, username: user.username };
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', {
    expiresIn: '7d'
  });

  return res.json({ token, user: { id: user.id, username: user.username } });
}

module.exports = {
  register,
  login
};

