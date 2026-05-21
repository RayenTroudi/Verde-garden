import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Plant from "@/models/Plant";
import { generateAndUploadQRCode } from "@/lib/qrcode-generator";

export async function GET() {
  try {
    await connectToDatabase();
    const plants = await Plant.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(plants);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch plants" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  await headers();
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const body = await request.json();

    const plant = new Plant({
      name: { fr: body.name?.fr ?? "", en: body.name?.en ?? "" },
      description: { fr: body.description?.fr ?? "", en: body.description?.en ?? "" },
      price: Number(body.price),
      imageUrl: body.imageUrl ?? "",
      gallery: Array.isArray(body.gallery) ? body.gallery : [],
      category: body.category ?? "General",
      careInstructions: {
        wateringFrequency: body.careInstructions?.wateringFrequency ?? "",
        lightRequirements: body.careInstructions?.lightRequirements ?? "",
        difficulty: body.careInstructions?.difficulty ?? "Easy",
      },
      stock: Number(body.stock) || 0,
    });

    await plant.save();

    // Generate QR code pointing to the plant's public details page
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const qrData = await generateAndUploadQRCode(String(plant._id), appUrl);
      await Plant.findByIdAndUpdate(plant._id, { $set: { qrCode: qrData } });
      plant.qrCode = qrData; // reflect in response
    } catch (qrError) {
      console.error("QR code generation failed:", qrError);
    }

    return NextResponse.json(plant, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create plant";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
