export interface IPlant {
  _id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  careInstructions: {
    wateringFrequency: string;
    lightRequirements: string;
    difficulty: "Easy" | "Medium" | "Hard";
  };
  stock: number;
  createdAt: string;
}

export type PlantFormData = Omit<IPlant, "_id" | "createdAt">;

export const PLANT_CATEGORIES = [
  "Indoor",
  "Outdoor",
  "Succulent",
  "Tropical",
  "Herb",
  "Fern",
  "Flowering",
  "Cactus",
  "Other",
] as const;
