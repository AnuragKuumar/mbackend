const { sequelize, testConnection } = require('./config/database');
require('dotenv').config();

const testDatabaseConnection = async () => {
  console.log('🔍 Testing Supabase PostgreSQL Connection...\n');
  
  try {
    // Test basic connection
    console.log('1. Testing basic connection...');
    await testConnection();
    
    // Test authentication
    console.log('2. Testing authentication...');
    await sequelize.authenticate();
    console.log('✅ Authentication successful');
    
    // Get database info
    console.log('3. Getting database information...');
    const [results] = await sequelize.query('SELECT version() as version, current_database() as database, current_user as user');
    console.log('📊 Database Info:');
    console.log(`   - Database: ${results[0].database}`);
    console.log(`   - User: ${results[0].user}`);
    console.log(`   - Version: ${results[0].version.split(' ')[0]} ${results[0].version.split(' ')[1]}`);
    
    // Test table creation
    console.log('4. Testing table operations...');
    await sequelize.sync({ force: false });
    console.log('✅ Table sync successful');
    
    console.log('\n🎉 All tests passed! Supabase connection is working perfectly.');
    
  } catch (error) {
    console.error('\n❌ Connection test failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.error('\n💡 Fix: Check your DATABASE_URL password');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('\n💡 Fix: Check your DATABASE_URL hostname');
    } else if (error.message.includes('timeout')) {
      console.error('\n💡 Fix: Check your internet connection or Supabase status');
    }
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

testDatabaseConnection();