const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;

    // If no external URI configured, use embedded MongoDB (no installation needed)
    if (!uri || uri.includes('127.0.0.1') || uri.includes('localhost')) {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const dbPath = path.join(__dirname, '..', 'data', 'db');
      fs.mkdirSync(dbPath, { recursive: true });

      const mongod = await MongoMemoryServer.create({
        instance: {
          dbPath,
          storageEngine: 'wiredTiger'
        }
      });

      uri = mongod.getUri() + 'pchis';
      console.log('Using embedded MongoDB — data stored in server/data/db');
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
