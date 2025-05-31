import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clerkId = searchParams.get("clerkId");
    const userId = searchParams.get("userId");

    // If no user identifier is provided, return all visit requests (admin/manager view)
    if (!clerkId && !userId) {
      const data = await prisma.visitRequest.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              clerkId: true,
            },
          },
          plot: {
            select: {
              id: true,
              title: true,
              location: true,
              projectId: true,
              project: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
      return NextResponse.json(data);
    }

    // Find user by clerkId or userId
    let user;
    if (clerkId) {
      user = await prisma.user.findUnique({
        where: { clerkId },
      });
    } else if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get visit requests for the specific user
    const visitRequests = await prisma.visitRequest.findMany({
      where: {
        OR: [
          { userId: user.id },
          // Also include requests made with same email (for guest bookings)
          { email: user.email },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            clerkId: true,
          },
        },
        plot: {
          select: {
            id: true,
            title: true,
            location: true,
            projectId: true,
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Transform the data to match your frontend expectations
    const transformedData = visitRequests.map((request) => ({
      id: request.id,
      status: request.status,
      date: request.date.toISOString(),
      time: request.time,
      name: request.name,
      email: request.email,
      phone: request.phone,
      // Generate QR code data if approved
      qrCode: request.status === "APPROVED" 
        ? `data:image/svg+xml;base64,${Buffer.from(generateQRCodeSVG(request.id)).toString('base64')}`
        : null,
      // Set expiration to 24 hours from creation for approved requests
      expiresAt: request.status === "APPROVED" 
        ? new Date(request.createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString()
        : null,
      title: request.plot?.title || "Plot Visit",
      projectName: request.plot?.project?.name || "Unknown Project",
      plotNumber: request.plot?.title || "N/A",
      plotId: request.plotId,
      userId: request.userId,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
      plot: request.plot,
      user: request.user,
    }));

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("Error fetching visit requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch visit requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, date, time, plotId, clerkId } = body;

    // Validate required fields
    if (!name || !email || !phone || !date || !time || !plotId) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate date format and ensure it's not in the past
    const visitDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (visitDate < today) {
      return NextResponse.json(
        { error: "Visit date cannot be in the past" },
        { status: 400 }
      );
    }

    // Verify plot exists
    const plotExists = await prisma.plot.findUnique({
      where: { id: plotId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!plotExists) {
      return NextResponse.json({ error: "Plot not found" }, { status: 404 });
    }

    let userId: string | undefined;

    // If clerkId is provided, find or create user
    if (clerkId) {
      let user = await prisma.user.findUnique({
        where: { clerkId },
      });

      if (!user) {
        // Create user if doesn't exist
        user = await prisma.user.create({
          data: {
            clerkId,
            name,
            email,
            phone,
            role: "GUEST",
          },
        });
      } else {
        // Update user info if it has changed
        if (
          user.name !== name ||
          user.email !== email ||
          user.phone !== phone
        ) {
          user = await prisma.user.update({
            where: { clerkId },
            data: {
              name,
              email,
              phone: phone || user.phone,
            },
          });
        }
      }

      userId = user.id;

      // Check if user already has a pending visit request for this plot
      const existingRequest = await prisma.visitRequest.findFirst({
        where: {
          userId: user.id,
          plotId,
          status: "PENDING",
        },
      });

      if (existingRequest) {
        return NextResponse.json(
          { error: "You already have a pending visit request for this plot" },
          { status: 409 }
        );
      }
    } else {
      // For guest users, check by email and plotId
      const existingRequest = await prisma.visitRequest.findFirst({
        where: {
          email,
          plotId,
          status: "PENDING",
        },
      });

      if (existingRequest) {
        return NextResponse.json(
          { error: "A pending visit request already exists for this email and plot" },
          { status: 409 }
        );
      }
    }

    // Create visit request
    const visitRequest = await prisma.visitRequest.create({
      data: {
        name,
        email,
        phone,
        date: visitDate,
        time,
        plotId,
        userId,
        status: "PENDING",
      },
      include: {
        user: userId
          ? {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                clerkId: true,
              },
            }
          : undefined,
        plot: {
          select: {
            id: true,
            title: true,
            location: true,
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      message: "Visit request submitted successfully",
      data: visitRequest,
    });
  } catch (error) {
    console.error("Error creating visit request:", error);

    // Type guard for Prisma errors
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };
      if (prismaError.code === "P2002") {
        return NextResponse.json(
          { error: "A visit request with this information already exists" },
          { status: 409 }
        );
      }

      if (prismaError.code === "P2025") {
        return NextResponse.json(
          { error: "Referenced record not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to create visit request" },
      { status: 500 }
    );
  }
}

// Simple QR Code SVG generator function
function generateQRCodeSVG(data: string): string {
  // This is a simplified QR code generator
  // In production, you should use a proper QR code library like 'qrcode' or 'qr-image'
  const size = 200;
  const cellSize = size / 25; // 25x25 grid for simplicity
  
  // Generate a simple pattern based on the data hash
  const hash = Array.from(data).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  let svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${size}" height="${size}" fill="white"/>`;
  
  // Create a simple pattern
  for (let i = 0; i < 25; i++) {
    for (let j = 0; j < 25; j++) {
      const shouldFill = (i + j + hash) % 3 === 0;
      if (shouldFill) {
        svg += `<rect x="${i * cellSize}" y="${j * cellSize}" width="${cellSize}" height="${cellSize}" fill="black"/>`;
      }
    }
  }
  
  // Add corner markers
  const cornerSize = cellSize * 3;
  [
    [0, 0],
    [size - cornerSize, 0],
    [0, size - cornerSize]
  ].forEach(([x, y]) => {
    svg += `<rect x="${x}" y="${y}" width="${cornerSize}" height="${cornerSize}" fill="black"/>`;
    svg += `<rect x="${x + cellSize}" y="${y + cellSize}" width="${cellSize}" height="${cellSize}" fill="white"/>`;
  });
  
  svg += `<text x="${size/2}" y="${size - 10}" text-anchor="middle" font-size="8" fill="black">${data.slice(0, 8)}</text>`;
  svg += '</svg>';
  
  return svg;
}