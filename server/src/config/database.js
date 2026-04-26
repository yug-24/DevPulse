import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () =>
      console.warn('⚠️  MongoDB disconnected')
    );
    mongoose.connection.on('error', (err) =>
      console.error('❌ MongoDB error:', err.message)
    );
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.warn('⚠️  Server started without database - attempting reconnection...');
    // Don't exit - allow server to continue running
    // Mongoose will auto-retry connection attempts
  }
};

export default connectDB;
