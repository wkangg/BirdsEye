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
    likes: { type: Number, default: 0 }
});

const userSchema = new mongoose.Schema({
    userID: { type: String, required: true }, // sub from auth0
    submissions: {
        type: Map, // object of markerID: photo uuid
        of: String
    }
});

export const Marker = mongoose.model('Marker', markerSchema);
export const User = mongoose.model('User', userSchema);

// TODO: make it so that when you move the map, it loads schemas without x amount of long and lat from the marker