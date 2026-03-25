const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const friendController = require('../controllers/friendController');

const router = express.Router();

router.get('/', authMiddleware, friendController.getFriends);
router.get('/requests', authMiddleware, friendController.getPendingRequests);
router.post('/requests', authMiddleware, friendController.sendFriendRequest);
router.post('/requests/:requestId/accept', authMiddleware, friendController.acceptFriendRequest);
router.post('/requests/:requestId/reject', authMiddleware, friendController.rejectFriendRequest);
router.delete('/:friendUserId', authMiddleware, friendController.unfriend);

module.exports = router;
