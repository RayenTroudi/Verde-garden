import mongoose, { Schema, Document } from "mongoose";

export interface IPlantDocument extends Document {
  name: { fr: string; en: string };
  description: { fr: string; en: string };
  price: number;
  imageUrl: string;
  category: string;
  careInstructions: {
    wateringFrequency: string;
    lightRequirements: string;
    difficulty: "Easy" | "Medium" | "Hard";
  };
  stock: number;
  createdAt: Date;
  qrCode?: {
    imageUrl: string;
    encodedUrl: string;
    generatedAt: Date;
  };
}

const PlantSchema = new Schema<IPlantDocument>({
  name: {
    fr: { type: String, required: true, trim: true },
    en: { type: String, required: true, trim: true },
  },
  description: {
    fr: { type: String, required: true, trim: true },
    en: { type: String, required: true, trim: true },
  },
  price: { type: Number, required: true, min: 0 },
  imageUrl: { type: String, default: "" },
  category: { type: String, default: "General", trim: true },
  careInstructions: {
    wateringFrequency: { type: String, default: "" },
    lightRequirements: { type: String, default: "" },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Easy",
    },
  },
  stock: { type: Number, default: 0, min: 0 },
  createdAt: { type: Date, default: Date.now },
  qrCode: {
    imageUrl: { type: String },
    encodedUrl: { type: String },
    generatedAt: { type: Date },
  },
});

export default mongoose.models.Plant ??
  mongoose.model<IPlantDocument>("Plant", PlantSchema);
