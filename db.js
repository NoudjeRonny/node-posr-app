import mongoose from "mongoose";

//onst mongoUrl = process.env.MONGO_DB_URL; // Ensure this matches your .env variable

export default async function connectMongoDB() {
    try {
        await mongoose.connect(process.env.MONGO_DB_URL);
        console.log('Successfully connected to MongoDB');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        // Optionally, exit if the connection fails
        process.exit(1);
    }
}

