const express = require('express');
const router = express.Router();
const { 
  createRequest, 
  getOrgRequests, 
  getCanteenRequests, 
  processRequest 
} = require('../controllers/paymentRequestController');
const { protect, orgAdmin, canteenOwner } = require('../middleware/auth');

router.post('/request', protect, canteenOwner, createRequest);
router.get('/org/:orgId', protect, orgAdmin, getOrgRequests);
router.get('/canteen/:canteenId', protect, canteenOwner, getCanteenRequests);
router.put('/process/:requestId', protect, orgAdmin, processRequest);

module.exports = router;
