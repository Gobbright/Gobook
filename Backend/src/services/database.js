import mongoose from 'mongoose';

import { env } from '../config/env.js';

export async function connectDatabase() {
  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
  });

  mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error.message);
  });

  await mongoose.connect(env.mongodbUri, {
    dbName: env.mongodbDbName,
  });
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
