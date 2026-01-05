const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  orderNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  items: {
    type: DataTypes.JSONB,
    allowNull: false,
    validate: {
      isArray(value) {
        if (!Array.isArray(value)) {
          throw new Error('Items must be an array');
        }
        if (value.length === 0) {
          throw new Error('Order must have at least one item');
        }
      }
    }
  },
  shippingAddress: {
    type: DataTypes.JSONB,
    allowNull: false,
    validate: {
      isValidAddress(value) {
        if (!value || typeof value !== 'object') {
          throw new Error('Shipping address is required');
        }
        const required = ['name', 'phone', 'street', 'city', 'state', 'pincode'];
        for (const field of required) {
          if (!value[field]) {
            throw new Error(`${field} is required in shipping address`);
          }
        }
      }
    }
  },
  paymentMethod: {
    type: DataTypes.ENUM('COD', 'Online', 'UPI'),
    defaultValue: 'COD'
  },
  paymentStatus: {
    type: DataTypes.ENUM('Pending', 'Paid', 'Failed', 'Refunded'),
    defaultValue: 'Pending'
  },
  orderStatus: {
    type: DataTypes.ENUM('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'),
    defaultValue: 'Pending'
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: 0, msg: 'Subtotal must be positive' }
    }
  },
  shippingFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: { args: 0, msg: 'Shipping fee cannot be negative' }
    }
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: { args: 0, msg: 'Tax cannot be negative' }
    }
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: 0, msg: 'Total must be positive' }
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  trackingNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  estimatedDelivery: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancellationReason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'orders',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['orderNumber'] },
    { fields: ['orderStatus'] },
    { fields: ['paymentStatus'] }
  ],
  hooks: {
    beforeCreate: async (order) => {
      if (!order.orderNumber) {
        const count = await Order.count();
        order.orderNumber = `GF${Date.now()}${(count + 1).toString().padStart(4, '0')}`;
      }
    }
  }
});

module.exports = Order;