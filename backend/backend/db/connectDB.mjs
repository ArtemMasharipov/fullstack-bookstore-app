import mongoose from 'mongoose';
import config from '../config/default.mjs';

const connectDB = async () => {
  try {
    await mongoose.connect(config.database.uri);
    console.log('Successfully connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;