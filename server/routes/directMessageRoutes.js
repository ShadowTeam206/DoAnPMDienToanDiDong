const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const directMessageController = require('../controllers/directMessageController');

const router = express.Router();

router.get('/:userId', authMiddleware, directMessageController.getConversation);
router.post('/:userId', authMiddleware, directMessageController.sendDirectMessage);

module.exports = router;
