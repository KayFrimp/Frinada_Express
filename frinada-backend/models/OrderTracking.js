const mongoose = require('mongoose');

const OrderTrackingSchema = new mongoose.Schema({
  order_id: {
    type: Number,
    required: true,
    ref: 'orders'
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'picked_up', 'delivered', 'cancelled'],
    default: 'pending'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  rider_id: {
    type: Number,
    ref: 'users'
  },
  estimated_arrival: {
    type: Date
  },
  actual_arrival: {
    type: Date
  },
  notes: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Create a geospatial index for location queries
OrderTrackingSchema.index({ location: '2dsphere' });

// Create a compound index for order_id and status
OrderTrackingSchema.index({ order_id: 1, status: 1 });

const OrderTracking = mongoose.model('order_tracking', OrderTrackingSchema);

module.exports = OrderTracking; 