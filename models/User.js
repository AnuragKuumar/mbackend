const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Name is required' },
      len: { args: [1, 50], msg: 'Name cannot exceed 50 characters' },
      is: { args: /^[a-zA-Z\s]+$/, msg: 'Name can only contain letters and spaces' }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: 'Please enter a valid email address' },
      notEmpty: { msg: 'Email is required' }
    },
    set(value) {
      this.setDataValue('email', value.toLowerCase().trim());
    }
  },
  phone: {
    type: DataTypes.STRING(15),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Phone number is required' },
      is: { args: /^[6-9]\d{9}$/, msg: 'Please enter a valid 10-digit phone number' }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: { args: [6, 255], msg: 'Password must be at least 6 characters' },
      is: { args: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/, msg: 'Password must contain at least one letter and one number' }
    }
  },
  address: {
    type: DataTypes.JSONB,
    defaultValue: {},
    validate: {
      isValidAddress(value) {
        if (value && typeof value === 'object') {
          const { street, city, state, pincode } = value;
          if (street && street.length > 100) throw new Error('Street address cannot exceed 100 characters');
          if (city && city.length > 50) throw new Error('City name cannot exceed 50 characters');
          if (state && state.length > 50) throw new Error('State name cannot exceed 50 characters');
          if (pincode && !/^\d{6}$/.test(pincode)) throw new Error('Pincode must be 6 digits');
        }
      }
    }
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  loginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lockUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  phoneVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    { fields: ['email'] },
    { fields: ['phone'] },
    { fields: ['isActive'] }
  ],
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
  // Check if account is locked
  if (this.lockUntil && this.lockUntil > new Date()) {
    throw new Error('Account is temporarily locked due to too many failed login attempts');
  }

  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  
  if (!isMatch) {
    // Increment login attempts
    this.loginAttempts += 1;
    
    // Lock account after 5 failed attempts for 30 minutes
    if (this.loginAttempts >= 5) {
      this.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }
    
    await this.save();
    return false;
  }
  
  // Reset login attempts on successful login
  if (this.loginAttempts > 0) {
    this.loginAttempts = 0;
    this.lockUntil = null;
  }
  
  this.lastLogin = new Date();
  await this.save();
  
  return true;
};

User.prototype.unlockAccount = function() {
  this.loginAttempts = 0;
  this.lockUntil = null;
  return this.save();
};

User.prototype.deactivate = function() {
  this.isActive = false;
  return this.save();
};

User.prototype.toSafeObject = function() {
  const userObject = this.toJSON();
  delete userObject.password;
  delete userObject.loginAttempts;
  delete userObject.lockUntil;
  return userObject;
};

// Virtual for account lock status
User.prototype.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

module.exports = User;