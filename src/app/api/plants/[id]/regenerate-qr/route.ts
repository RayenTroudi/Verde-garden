import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Plant from "@/models/Plant";
import { generateAndUploadQRCode, deleteQRCodeFromCloudinary } from "@/lib/qrcode-generator";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await headers();
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await connectToDatabase();

    const plant = await Plant.findById(id);
    if (!plant) {
      return NextResponse.json({ error: "Plant not found" }, { status: 404 });
    }

    // Delete old QR from Cloudinary (best effort)
    await deleteQRCodeFromCloudinary(id);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const qrData = await generateAndUploadQRCode(id, appUrl);

    const updated = await Plant.findByIdAndUpdate(
      id,
      { $set: { qrCode: qrData } },
      { new: true }
    );

    return NextResponse.json({ qrCode: updated?.qrCode });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to regenerate QR code";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
