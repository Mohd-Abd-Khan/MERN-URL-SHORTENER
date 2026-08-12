import mongoose from "mongoose";

/**
 * Establishes a connection to MongoDB using the URI from environment variables.
 * Exits the process on connection failure to prevent the server from running
 * in a broken state.
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

export default connectDB;
