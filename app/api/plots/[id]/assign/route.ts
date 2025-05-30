import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const assignPlotSchema = z.object({
  userId: z.string(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const { userId: clientId } = assignPlotSchema.parse(body);

    // Check if plot exists and is available
    const plot = await prisma.plot.findUnique({
      where: { id },
    });

    if (!plot) {
      return NextResponse.json({ error: "Plot not found" }, { status: 404 });
    }

    if (plot.status !== "AVAILABLE") {
      return NextResponse.json(
        { error: "Plot is not available" },
        { status: 400 }
      );
    }

    // Check if plot is already assigned
    const existingAssignment = await prisma.clientPlot.findUnique({
      where: { plotId: id },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: "Plot is already assigned" },
        { status: 400 }
      );
    }

    // Create the assignment
    const [assignment] = await prisma.$transaction([
      prisma.clientPlot.create({
        data: {
          userId: clientId,
          plotId: id,
        },
      }),
      prisma.plot.update({
        where: { id },
        data: { status: "SOLD" },
      }),
    ]);

    return NextResponse.json(assignment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error assigning plot:", error);
    return NextResponse.json(
      { error: "Failed to assign plot" },
      { status: 500 }
    );
  }
}
