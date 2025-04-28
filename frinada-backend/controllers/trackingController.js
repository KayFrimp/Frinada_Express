const OrderTracking = require('../models/OrderTracking');
const RiderLocation = require('../models/RiderLocation');
const Order = require('../models/Order');
const Rider = require('../models/Rider');

// @desc    Update order tracking
// @route   PUT /api/tracking/orders/:orderId
// @access  Private (Rider)
exports.updateOrderTracking = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { location, status, estimated_arrival, notes } = req.body;
    const riderId = req.user.id;

    // Check if order exists and is assigned to this rider
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.assigned_rider_id !== riderId) {
      return res.status(403).json({ message: 'Not authorized to track this order' });
    }

    // Update or create tracking record
    let tracking = await OrderTracking.findOne({ order_id: orderId });
    
    if (!tracking) {
      tracking = new OrderTracking({
        order_id: orderId,
        rider_id: riderId,
        location,
        status: status || order.status,
        estimated_arrival,
        notes
      });
    } else {
      tracking.location = location;
      if (status) tracking.status = status;
      if (estimated_arrival) tracking.estimated_arrival = estimated_arrival;
      if (notes) tracking.notes = notes;
    }

    await tracking.save();

    // Update order status in MySQL if provided
    if (status && status !== order.status) {
      await order.updateStatus(status);
    }

    res.status(200).json({
      success: true,
      tracking
    });
  } catch (error) {
    console.error('Update order tracking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get order tracking
// @route   GET /api/tracking/orders/:orderId
// @access  Private
exports.getOrderTracking = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Check if order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Get tracking data
    const tracking = await OrderTracking.findOne({ order_id: orderId });
    
    if (!tracking) {
      return res.status(404).json({ message: 'Tracking data not found' });
    }

    res.status(200).json({
      success: true,
      tracking
    });
  } catch (error) {
    console.error('Get order tracking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update rider location
// @route   PUT /api/tracking/riders/location
// @access  Private (Rider)
exports.updateRiderLocation = async (req, res) => {
  try {
    const { location, is_online, current_order_id, battery_level, speed, heading, accuracy } = req.body;
    const riderId = req.user.id;

    // Check if rider exists
    const rider = await Rider.findByUserId(riderId);
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    // Update or create location record
    let riderLocation = await RiderLocation.findOne({ rider_id: riderId });
    
    if (!riderLocation) {
      riderLocation = new RiderLocation({
        rider_id: riderId,
        location,
        is_online,
        current_order_id,
        battery_level,
        speed,
        heading,
        accuracy
      });
    } else {
      riderLocation.location = location;
      if (is_online !== undefined) riderLocation.is_online = is_online;
      if (current_order_id !== undefined) riderLocation.current_order_id = current_order_id;
      if (battery_level !== undefined) riderLocation.battery_level = battery_level;
      if (speed !== undefined) riderLocation.speed = speed;
      if (heading !== undefined) riderLocation.heading = heading;
      if (accuracy !== undefined) riderLocation.accuracy = accuracy;
    }

    await riderLocation.save();

    // Update rider availability in MySQL if online status changed
    if (is_online !== undefined && is_online !== rider.is_available) {
      await rider.updateAvailability(is_online);
    }

    res.status(200).json({
      success: true,
      location: riderLocation
    });
  } catch (error) {
    console.error('Update rider location error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get rider location
// @route   GET /api/tracking/riders/:riderId/location
// @access  Private
exports.getRiderLocation = async (req, res) => {
  try {
    const { riderId } = req.params;
    
    // Check if rider exists
    const rider = await Rider.findById(riderId);
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    // Get location data
    const location = await RiderLocation.findOne({ rider_id: riderId });
    
    if (!location) {
      return res.status(404).json({ message: 'Location data not found' });
    }

    res.status(200).json({
      success: true,
      location
    });
  } catch (error) {
    console.error('Get rider location error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all online riders
// @route   GET /api/tracking/riders/online
// @access  Private
exports.getOnlineRiders = async (req, res) => {
  try {
    const locations = await RiderLocation.find({ is_online: true });
    
    // Get rider details from MySQL
    const riders = [];
    for (const location of locations) {
      const rider = await Rider.findById(location.rider_id);
      if (rider) {
        riders.push({
          ...location.toObject(),
          rider: {
            id: rider.id,
            user_id: rider.user_id,
            is_available: rider.is_available,
            user: rider.user
          }
        });
      }
    }

    res.status(200).json({
      success: true,
      count: riders.length,
      riders
    });
  } catch (error) {
    console.error('Get online riders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Find nearby riders
// @route   GET /api/tracking/riders/nearby
// @access  Private
exports.findNearbyRiders = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 5000 } = req.query; // maxDistance in meters
    
    if (!longitude || !latitude) {
      return res.status(400).json({ message: 'Longitude and latitude are required' });
    }

    const locations = await RiderLocation.find({
      is_online: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    });
    
    // Get rider details from MySQL
    const riders = [];
    for (const location of locations) {
      const rider = await Rider.findById(location.rider_id);
      if (rider) {
        riders.push({
          ...location.toObject(),
          rider: {
            id: rider.id,
            user_id: rider.user_id,
            is_available: rider.is_available,
            user: rider.user
          }
        });
      }
    }

    res.status(200).json({
      success: true,
      count: riders.length,
      riders
    });
  } catch (error) {
    console.error('Find nearby riders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 