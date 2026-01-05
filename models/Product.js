const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Product name is required' }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Product description is required' }
    }
  },
  category: {
    type: DataTypes.ENUM('Mobile Phones', 'Chargers', 'Earphones', 'Covers', 'Screen Protectors', 'Power Banks', 'Accessories'),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Category is required' }
    }
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Brand is required' }
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: 0, msg: 'Price must be positive' },
      notEmpty: { msg: 'Price is required' }
    }
  },
  originalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: { args: 0, msg: 'Original price must be positive' }
    }
  },
  discount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: { args: 0, msg: 'Discount cannot be negative' },
      max: { args: 100, msg: 'Discount cannot exceed 100%' }
    }
  },
  images: {
    type: DataTypes.JSONB,
    defaultValue: [],
    validate: {
      isArray(value) {
        if (!Array.isArray(value)) {
          throw new Error('Images must be an array');
        }
      }
    }
  },
  specifications: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: { args: 0, msg: 'Stock cannot be negative' },
      notEmpty: { msg: 'Stock quantity is required' }
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  rating: {
    type: DataTypes.JSONB,
    defaultValue: {
      average: 0,
      count: 0
    },
    validate: {
      isValidRating(value) {
        if (value && typeof value === 'object') {
          const { average, count } = value;
          if (average < 0 || average > 5) throw new Error('Rating average must be between 0 and 5');
          if (count < 0) throw new Error('Rating count cannot be negative');
        }
      }
    }
  },
  tags: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  seo: {
    type: DataTypes.JSONB,
    defaultValue: {},
    validate: {
      isValidSeo(value) {
        if (value && typeof value === 'object') {
          const { title, description, keywords } = value;
          if (keywords && !Array.isArray(keywords)) {
            throw new Error('SEO keywords must be an array');
          }
        }
      }
    }
  }
}, {
  tableName: 'products',
  timestamps: true,
  indexes: [
    { fields: ['name'] },
    { fields: ['category'] },
    { fields: ['brand'] },
    { fields: ['isActive'] },
    { fields: ['isFeatured'] }
  ]
});

module.exports = Product;