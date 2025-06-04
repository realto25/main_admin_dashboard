// File: app/api/owned-lands/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clerkId = searchParams.get("clerkId");

  if (!clerkId) {
    return NextResponse.json({ error: "Missing clerkId" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { clerkId } });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const lands = await prisma.land.findMany({
    where: { ownerId: user.id },
    include: {
      plot: {
        include: {
          project: true,
        },
      },
    },
  });

  return NextResponse.json(lands);
}
