const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbPort = process.env.DB_PORT || 3306;
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'store_rating_db';
const useSqliteFallback = process.env.USE_SQLITE_FALLBACK === 'true';

// Helper function to create database if it doesn't exist in MySQL
async function ensureMySqlDatabaseExists() {
  const mysql = require('mysql2/promise');
  const connection = await mysql.createConnection({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword
  });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
  await connection.end();
}

async function initializeDatabase() {
  if (sequelize) return sequelize;

  console.log('🔄 Connecting to Database...');
  
  try {
    // Attempt to connect to MySQL
    console.log(`📡 Attempting connection to MySQL: ${dbUser}@${dbHost}:${dbPort}/${dbName}...`);
    
    // First, let's try to ensure the MySQL database itself exists
    try {
      await ensureMySqlDatabaseExists();
    } catch (dbErr) {
      console.warn('⚠️ Could not automatically create MySQL database. Attempting raw connection anyway...');
    }

    sequelize = new Sequelize(dbName, dbUser, dbPassword, {
      host: dbHost,
      port: dbPort,
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });

    // Authenticate MySQL connection
    await sequelize.authenticate();
    console.log('✅ Connected successfully to MySQL database!');
    return sequelize;
  } catch (error) {
    console.error('❌ Failed to connect to MySQL database:', error.message);
    
    if (useSqliteFallback) {
      console.log('🛡️ SQLite Fallback is enabled. Initializing local SQLite database as fallback...');
      sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: './store_rating.sqlite',
        logging: false
      });
      await sequelize.authenticate();
      console.log('✅ Connected successfully to fallback SQLite database! (File: ./store_rating.sqlite)');
      return sequelize;
    } else {
      throw new Error('Database connection failed. Please ensure MySQL is running or enable USE_SQLITE_FALLBACK in .env');
    }
  }
}

module.exports = {
  initializeDatabase,
  getSequelize: () => {
    if (!sequelize) {
      throw new Error('Database not initialized! Call initializeDatabase() first.');
    }
    return sequelize;
  }
};
