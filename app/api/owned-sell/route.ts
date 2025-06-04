"use client";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clerkId = searchParams.get("clerkId");

  if (!clerkId) {
    return NextResponse.json({ error: "Missing clerkId" }, { status: 400 });
  }

  const lands = await prisma.land.findMany({
    where: {
      owner: {
        clerkId,
      },
    },
    include: {
      plot: true,
    },
  });

  return NextResponse.json(lands);
}
