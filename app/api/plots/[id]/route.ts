import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for plot update
const plotSchema = z.object({
  title: z.string().min(1, "Title is required"),
  dimension: z.string().min(1, "Dimension is required"),
  price: z.number().min(0, "Price must be positive"),
  priceLabel: z.string().min(1, "Price label is required"),
  status: z.enum(["AVAILABLE", "ADVANCE", "SOLD"]),
  imageUrls: z.array(z.string().url("Invalid image URL")),
  location: z.string().min(1, "Location is required"),
  latitude: z.number(),
  longitude: z.number(),
  facing: z.string().min(1, "Facing is required"),
  amenities: z.array(z.string()),
  mapEmbedUrl: z.string().url("Invalid map embed URL").optional(),
});

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const plot = await prisma.plot.findUnique({
      where: { id: context.params.id },
      include: { project: true },
    });

    if (!plot) {
      return NextResponse.json({ error: "Plot not found" }, { status: 404 });
    }

    return NextResponse.json(plot);
  } catch (error) {
    console.error("Error fetching plot:", error);
    return NextResponse.json({ error: "Error fetching plot" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const plotId = context.params.id;

    // Validate the request body
    const validatedData = plotSchema.parse({
      ...body,
      price: parseInt(body.price),
      latitude: parseFloat(body.latitude),
      longitude: parseFloat(body.longitude),
    });

    // Check if plot exists
    const existingPlot = await prisma.plot.findUnique({
      where: { id: plotId },
    });

    if (!existingPlot) {
      return NextResponse.json({ error: "Plot not found" }, { status: 404 });
    }

    const plot = await prisma.plot.update({
      where: { id: plotId },
      data: validatedData,
    });

    return NextResponse.json(plot);
  } catch (error) {
    console.error("Error updating plot:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Error updating plot" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const plotId = context.params.id;

    // Check if plot exists
    const existingPlot = await prisma.plot.findUnique({
      where: { id: plotId },
    });

    if (!existingPlot) {
      return NextResponse.json({ error: "Plot not found" }, { status: 404 });
    }

    await prisma.plot.delete({
      where: { id: plotId },
    });

    return NextResponse.json({ message: "Plot deleted successfully" });
  } catch (error) {
    console.error("Error deleting plot:", error);
    return NextResponse.json({ error: "Error deleting plot" }, { status: 500 });
  }
}
