const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RepairBooking = sequelize.define('RepairBooking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
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
    allowNull: true, // Allow null for optional email
    validate: {
      isEmail: {
        msg: 'Please enter a valid email address'
      },
      customValidator(value) {
        // Only validate email format if value is provided
        if (value !== null && value !== undefined && value !== '') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            throw new Error('Please enter a valid email address');
          }
        }
      }
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
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['status'] },
    { fields: ['customerPhone'] },
    { fields: ['bookingDate'] }
  ]
});

module.exports = RepairBooking;