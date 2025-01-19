import mongoose from 'mongoose';

export const setupDB = async () => {
    if (!process.env.MONGO_DB_URI) throw new Error('Missing environment variable MONGO_DB_URI');

    mongoose.connection.on('connected', () => console.log('🟢 MongoDB is online'));
    mongoose.connection.on('error', err => console.warn(`⚠️ MongoDB encountered an error:\n${err}`));
    mongoose.connection.on('disconnected', () => console.warn('🔴 MongoDB is offline'));
    await mongoose.connect(process.env.MONGO_DB_URI);
};

const markerSchema = new mongoose.Schema({
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    prompt: { type: String, required: true },
    submissions: { type: [String], default: [] } // array of photo IDs
});

const submissionsSchema = new mongoose.Schema({
    userID: { type: String, required: true },
    username: { type: String, required: true },
    markerID: { type: String, required: true },
    photoID: { type: String, required: true },
    likes: { type: Number, default: 0 }
});

export const Marker = mongoose.model('Marker', markerSchema);
export const Submission = mongoose.model('Submission', submissionsSchema);