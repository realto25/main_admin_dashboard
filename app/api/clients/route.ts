import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Get all clients
export async function GET() {
  try {
    const clients = await prisma.client.findMany();
    return NextResponse.json(clients);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

// POST: Create new client
export async function POST(req: Request) {
  const { name, email, password, phone } = await req.json();
  
  try {
    const newClient = await prisma.client.create({
      data: { name, email, password, phone }
    });
    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}