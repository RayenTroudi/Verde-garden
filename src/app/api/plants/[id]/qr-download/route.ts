import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Plant, { IPlantDocument } from "@/models/Plant";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const plant = await Plant.findById(id).lean<IPlantDocument>();
    if (!plant) {
      return NextResponse.json({ error: "Plant not found" }, { status: 404 });
    }
    if (!plant.qrCode?.imageUrl) {
      return NextResponse.json({ error: "QR code not found for this plant" }, { status: 404 });
    }

    const response = await fetch(plant.qrCode.imageUrl);
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch QR code image" }, { status: 502 });
    }

    const buffer = await response.arrayBuffer();
    const plantName = plant.name?.en || plant.name?.fr || "plant";
    const safeName = plantName.replace(/[^a-zA-Z0-9-_]/g, "-");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="QR-${safeName}.png"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to download QR code";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
