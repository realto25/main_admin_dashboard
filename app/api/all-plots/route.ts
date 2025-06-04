import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const plots = await prisma.plot.findMany({
      where: {
        clientPlot: null, // Only unassigned plots
        status: "AVAILABLE", // Optional: filter only available plots
      },
      select: {
        id: true,
        title: true,
        location: true,
      },
    });

    return NextResponse.json(plots);
  } catch (error) {
    console.error("Error fetching all plots:", error);
    return NextResponse.json(
      { error: "Failed to fetch plots" },
      { status: 500 }
    );
  }
}
