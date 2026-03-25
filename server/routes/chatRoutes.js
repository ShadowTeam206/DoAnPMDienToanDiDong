const express = require('express');
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/rooms', authMiddleware, chatController.getRooms);
router.post('/rooms', authMiddleware, chatController.createRoom);
router.get('/global', authMiddleware, chatController.getGlobalMessages);
router.get('/room/:room', authMiddleware, chatController.getRoomMessages);
router.delete('/room/:room', authMiddleware, chatController.deleteRoomMessages);

module.exports = router;

