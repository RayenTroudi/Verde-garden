import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Plant from "@/models/Plant";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const plant = await Plant.findById(id).lean();
    if (!plant) {
      return NextResponse.json({ error: "Plant not found" }, { status: 404 });
    }
    return NextResponse.json(plant);
  } catch {
    return NextResponse.json({ error: "Failed to fetch plant" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
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
    const body = await request.json();
    const { price, imageUrl, category, stock, careInstructions } = body;
    const name = { fr: body.name?.fr ?? "", en: body.name?.en ?? "" };
    const description = { fr: body.description?.fr ?? "", en: body.description?.en ?? "" };

    const plant = await Plant.findByIdAndUpdate(
      id,
      { $set: { name, description, price, imageUrl, category, stock, careInstructions } },
      { new: true, runValidators: true }
    );

    if (!plant) {
      return NextResponse.json({ error: "Plant not found" }, { status: 404 });
    }

    return NextResponse.json(plant);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update plant";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
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

    const plant = await Plant.findByIdAndDelete(id);

    if (!plant) {
      return NextResponse.json({ error: "Plant not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Plant deleted successfully" });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete plant" },
      { status: 500 }
    );
  }
}
