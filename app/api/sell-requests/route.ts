import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const sellRequests = await prisma.sellRequest.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        plot: {
          select: {
            title: true,
            location: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(sellRequests);
  } catch (error) {
    console.error("Error fetching sell requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch sell requests" },
      { status: 500 }
    );
  }
}
