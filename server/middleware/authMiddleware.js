const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = { id: decoded.sub, username: decoded.username };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại' });
  }
}

module.exports = authMiddleware;

