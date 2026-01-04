const mongoose = require('mongoose');

const repairBookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow guest bookings
  },
  deviceBrand: {
    type: String,
    required: [true, 'Device brand is required']
  },
  deviceModel: {
    type: String,
    required: false
  },
  serviceType: {
    type: String,
    required: [true, 'Service type is required']
  },
  deliveryOption: {
    type: String,
    default: 'doorstep-service'
  },
  customerDetails: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    address: String
  },
  issueDescription: {
    type: String,
    required: [true, 'Issue description is required']
  },
  estimatedCost: {
    type: Number,
    default: 0
  },
  serviceFee: {
    type: Number,
    default: 0
  },
  totalCost: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  bookingDate: {
    type: Date,
    default: Date.now
  },
  preferredDate: {
    type: String,
    required: false
  },
  preferredTime: {
    type: String,
    required: false
  },
  notes: String,
  adminNotes: String,
  isGuestBooking: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RepairBooking', repairBookingSchema);