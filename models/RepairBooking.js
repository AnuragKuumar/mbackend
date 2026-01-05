const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RepairBooking = sequelize.define('RepairBooking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true, // Allow guest bookings
    references: {
      model: 'users',
      key: 'id'
    }
  },
  deviceBrand: {
    type: DataTypes.STRING,
    allowNull: false
  },
  deviceModel: {
    type: DataTypes.STRING,
    allowNull: true
  },
  serviceType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  deliveryOption: {
    type: DataTypes.STRING,
    defaultValue: 'doorstep-service'
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  customerPhone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  customerEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  customerAddress: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  issueDescription: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  estimatedCost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  serviceFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  totalCost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'in-progress', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  bookingDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  preferredDate: {
    type: DataTypes.STRING,
    allowNull: true
  },
  preferredTime: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isGuestBooking: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'repair_bookings',
  timestamps: true
});

module.exports = RepairBooking;