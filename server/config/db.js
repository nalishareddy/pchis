const mongoose = require('mongoose');

let cached = null;

const connectDB = async () => {
  if (cached && mongoose.connection.readyState === 1) return cached;

  try {
    let uri = process.env.MONGODB_URI;

    // Use embedded MongoDB only for local dev without a real URI
    if (!uri || uri.includes('127.0.0.1') || uri.includes('localhost')) {
      const path = require('path');
      const fs = require('fs');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const dbPath = path.join(__dirname, '..', 'data', 'db');
      fs.mkdirSync(dbPath, { recursive: true });
      const mongod = await MongoMemoryServer.create({
        instance: { dbPath, storageEngine: 'wiredTiger' }
      });
      uri = mongod.getUri() + 'pchis';
      console.log('Using embedded MongoDB — data stored in server/data/db');
    }

    cached = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    return cached;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
