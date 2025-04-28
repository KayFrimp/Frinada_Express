const mongoose = require('mongoose');

const RiderLocationSchema = new mongoose.Schema({
  rider_id: {
    type: Number,
    required: true,
    ref: 'users'
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
  is_online: {
    type: Boolean,
    default: true
  },
  current_order_id: {
    type: Number,
    ref: 'orders'
  },
  battery_level: {
    type: Number,
    min: 0,
    max: 100
  },
  speed: {
    type: Number, // in km/h
    default: 0
  },
  heading: {
    type: Number, // in degrees (0-360)
    default: 0
  },
  accuracy: {
    type: Number, // in meters
    default: 10
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
RiderLocationSchema.index({ location: '2dsphere' });

// Create an index for rider_id for faster lookups
RiderLocationSchema.index({ rider_id: 1 });

const RiderLocation = mongoose.model('rider_locations', RiderLocationSchema);

module.exports = RiderLocation; 