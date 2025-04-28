const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  updateOrderTracking,
  getOrderTracking,
  updateRiderLocation,
  getRiderLocation,
  getOnlineRiders,
  findNearbyRiders
} = require('../controllers/trackingController');

// Order tracking routes
router.put('/orders/:orderId', protect, authorize('rider'), updateOrderTracking);
router.get('/orders/:orderId', protect, getOrderTracking);

// Rider location routes
router.put('/riders/location', protect, authorize('rider'), updateRiderLocation);
router.get('/riders/:riderId/location', protect, getRiderLocation);
router.get('/riders/online', protect, getOnlineRiders);
router.get('/riders/nearby', protect, findNearbyRiders);

module.exports = router; 