import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { clientId } = await req.json();

  await prisma.clientPlot.create({
    data: { userId: clientId, plotId: params.id },
  });

  return NextResponse.json({ success: true });
}
