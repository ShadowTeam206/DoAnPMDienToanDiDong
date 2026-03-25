require('dotenv').config({ path: 'db.env' });

const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const friendRoutes = require('./routes/friendRoutes');
const directMessageRoutes = require('./routes/directMessageRoutes');
const initSocket = require('./socket');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/dm', directMessageRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

initSocket(io);

const PORT = process.env.PORT || 4000;

async function startServer() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS chat_rooms (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      room_id VARCHAR(100) NOT NULL UNIQUE,
      label VARCHAR(100) NOT NULL,
      created_by INT UNSIGNED NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_chat_rooms_user
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.execute(
    'INSERT IGNORE INTO chat_rooms (room_id, label) VALUES (?, ?), (?, ?)',
    ['room-1', 'room-1', 'room-2', 'room-2']
  );

  await db.execute(`
    CREATE TABLE IF NOT EXISTS friend_requests (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      sender_id INT UNSIGNED NOT NULL,
      receiver_id INT UNSIGNED NOT NULL,
      status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_friend_requests_sender
        FOREIGN KEY (sender_id) REFERENCES users(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_friend_requests_receiver
        FOREIGN KEY (receiver_id) REFERENCES users(id)
        ON DELETE CASCADE,
      CONSTRAINT uq_friend_request_pending UNIQUE KEY (sender_id, receiver_id, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS friendships (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_one_id INT UNSIGNED NOT NULL,
      user_two_id INT UNSIGNED NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_friendships_user_one
        FOREIGN KEY (user_one_id) REFERENCES users(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_friendships_user_two
        FOREIGN KEY (user_two_id) REFERENCES users(id)
        ON DELETE CASCADE,
      CONSTRAINT uq_friend_pair UNIQUE KEY (user_one_id, user_two_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS direct_messages (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      sender_id INT UNSIGNED NOT NULL,
      receiver_id INT UNSIGNED NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      reply_to_message_id INT UNSIGNED NULL,
      is_revoked TINYINT(1) NOT NULL DEFAULT 0,
      revoked_at DATETIME NULL,
      CONSTRAINT fk_direct_messages_sender
        FOREIGN KEY (sender_id) REFERENCES users(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_direct_messages_receiver
        FOREIGN KEY (receiver_id) REFERENCES users(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.execute('ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_message_id INT UNSIGNED NULL');
  await db.execute('ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_revoked TINYINT(1) NOT NULL DEFAULT 0');
  await db.execute('ALTER TABLE messages ADD COLUMN IF NOT EXISTS revoked_at DATETIME NULL');

  await db.execute('ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS reply_to_message_id INT UNSIGNED NULL');
  await db.execute('ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS is_revoked TINYINT(1) NOT NULL DEFAULT 0');
  await db.execute('ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS revoked_at DATETIME NULL');

  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
