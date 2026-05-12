import mongoose from 'mongoose';

const photoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    note: { type: String, default: '' }
  },
  { _id: false }
);

const ratingSchema = new mongoose.Schema(
  {
    overall: { type: Number, min: 1, max: 10, default: 5 },
    access: { type: Number, min: 1, max: 10, default: 5 },
    integrity: { type: Number, min: 1, max: 10, default: 5 },
    notoriety: { type: Number, min: 1, max: 10, default: 5 }
  },
  { _id: false }
);

const placeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    notes: { type: String, default: '' },
    googleMapsUrl: { type: String, default: '' },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    ratings: { type: ratingSchema, default: () => ({}) },
    explored: { type: Boolean, default: false },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    photos: { type: [photoSchema], default: [] }
  },
  { timestamps: true }
);

placeSchema.index({ name: 'text', notes: 'text' });

export default mongoose.model('Place', placeSchema);
