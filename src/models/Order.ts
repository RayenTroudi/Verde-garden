import mongoose, { Schema, Document } from "mongoose";

export interface IOrderItem {
  plantId: string;
  name: { fr: string; en: string };
  imageUrl: string;
  price: number;
  quantity: number;
}

export interface IShippingInfo {
  fullName: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  streetAddress: string;
  zipCode: string;
  notes?: string;
}

export interface IStatusHistoryEntry {
  status: string;
  timestamp: Date;
  note?: string;
}

export interface IOrderDocument extends Document {
  orderNumber: string;
  items: IOrderItem[];
  shipping: IShippingInfo;
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentMethod: "online" | "cash_on_delivery";
  paymentStatus: "pending" | "paid" | "failed" | "cash_on_delivery";
  shippingStatus:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "out_for_delivery"
    | "delivered"
    | "cancelled";
  statusHistory: IStatusHistoryEntry[];
  adminNotes: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  plantId: { type: String, required: true },
  name: {
    fr: { type: String, required: true },
    en: { type: String, required: true },
  },
  imageUrl: { type: String, default: "" },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
});

const ShippingInfoSchema = new Schema<IShippingInfo>({
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  country: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  streetAddress: { type: String, required: true, trim: true },
  zipCode: { type: String, required: true, trim: true },
  notes: { type: String, trim: true, default: "" },
});

const StatusHistorySchema = new Schema<IStatusHistoryEntry>(
  {
    status: { type: String, required: true },
    note: { type: String, default: "" },
  },
  { timestamps: { createdAt: "timestamp", updatedAt: false } }
);

const OrderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: { type: String, required: true, unique: true },
    items: { type: [OrderItemSchema], required: true },
    shipping: { type: ShippingInfoSchema, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ["online", "cash_on_delivery"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "cash_on_delivery"],
      default: "pending",
    },
    shippingStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    statusHistory: { type: [StatusHistorySchema], default: [] },
    adminNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

// Indexes for dashboard analytics and orders list queries
OrderSchema.index({ shippingStatus: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ paymentMethod: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ "shipping.email": 1 });

OrderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderNumber = `VG-${timestamp}-${random}`;
  }
  next();
});

export default mongoose.models.Order ??
  mongoose.model<IOrderDocument>("Order", OrderSchema);
