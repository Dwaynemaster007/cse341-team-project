
import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true
        },
        region: {
            type: String,
            required: true
        },
        startStation: {
            type: String,
            required: true
        },
        endStation: {
            type: String,
            required: true
        },
        duration: {
            type: String,
            required: true
        },
        distance: {
            type: Number,
            required: true,
            min: 0
        },
        highlights: {
            type: [String],
            required: true
        },
        bestSeason: {
            type: String,
            required: true
        },
        operatingMonths: {
            type: [Number],
            required: true
        },
        imageUrl: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model('Trip', tripSchema);
