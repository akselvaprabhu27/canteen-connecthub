const express = require('express');
const router = express.Router();
const { 
  sendMessage, 
  replyMessage, 
  getMessageThread, 
  getOrgThreads, 
  getCanteenInbox, 
  markAsRead 
} = require('../controllers/messageController');
const { protect, orgAdmin, canteenOwner } = require('../middleware/auth');

router.post('/send', protect, orgAdmin, sendMessage);
router.post('/reply', protect, replyMessage);
router.get('/thread/:canteenId', protect, getMessageThread);
router.get('/org/threads', protect, orgAdmin, getOrgThreads);
router.get('/canteen/inbox', protect, canteenOwner, getCanteenInbox);
router.put('/read/:canteenId', protect, markAsRead);

module.exports = router;
