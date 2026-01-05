const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create Sequelize instance for Railway PostgreSQL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Railway PostgreSQL connection established successfully');
  } catch (error) {
    console.error('❌ Unable to connect to Railway PostgreSQL:', error.message);
  }
};

module.exports = { sequelize, testConnection };