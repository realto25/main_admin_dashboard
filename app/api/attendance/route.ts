import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clerkId, latitude, longitude } = body;

    if (!clerkId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: "Missing clerkId or location coordinates" },
        { status: 400 }
      );
    }

    // Find the manager with their assigned offices
    const manager = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        managerOffices: true,
      },
    });

    if (!manager) {
      return NextResponse.json({ error: "Manager not found" }, { status: 404 });
    }

    if (manager.managerOffices.length === 0) {
      return NextResponse.json(
        { error: "No office assigned to this manager" },
        { status: 404 }
      );
    }

    const allowedRadius = 2000; // 2 kilometers (2000 meters)
    const now = new Date();
    const todayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    const todayEnd = new Date(todayStart);
    todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

    let nearestOffice = null;
    let minDistance = Infinity;

    // Check distance to each assigned office
    for (const office of manager.managerOffices) {
      const distance = calculateDistance(
        Number(latitude),
        Number(longitude),
        Number(office.latitude),
        Number(office.longitude)
      );

      // Track nearest office for debugging
      if (distance < minDistance) {
        minDistance = distance;
        nearestOffice = office;
      }

      // Check if within allowed radius
      if (distance <= allowedRadius) {
        // Check if attendance already marked today for this office
        const existingAttendance = await prisma.attendance.findFirst({
          where: {
            managerId: manager.id,
            officeId: office.id,
            createdAt: {
              gte: todayStart,
              lt: todayEnd,
            },
          },
        });

        if (existingAttendance) {
          return NextResponse.json({
            message: "Attendance already marked for today",
            office: office.name,
            date: existingAttendance.createdAt.toDateString(),
          });
        }

        // Create attendance record
        const attendance = await prisma.attendance.create({
          data: {
            managerId: manager.id,
            officeId: office.id,
            status: "PRESENT",
          },
          include: {
            office: {
              select: {
                name: true,
              },
            },
          },
        });

        return NextResponse.json({
          message: "Attendance marked successfully",
          attendance: {
            id: attendance.id,
            status: attendance.status,
            createdAt: attendance.createdAt,
            office: attendance.office.name,
          },
          distance: Math.round(distance),
        });
      }
    }

    // No office within radius
    return NextResponse.json(
      {
        error: "You are too far from any assigned office location",
        nearestOffice: nearestOffice?.name,
        distance: Math.round(minDistance),
        requiredDistance: allowedRadius,
        coordinates: {
          yourLocation: { latitude, longitude },
          nearestOffice: nearestOffice
            ? {
                latitude: nearestOffice.latitude,
                longitude: nearestOffice.longitude,
              }
            : null,
        },
      },
      { status: 403 }
    );
  } catch (error) {
    console.error("Error marking attendance:", error);

    return NextResponse.json(
      {
        error: "Server error occurred while marking attendance",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clerkId = searchParams.get("clerkId");
    const date = searchParams.get("date");

    if (!clerkId) {
      return NextResponse.json({ error: "Missing clerkId" }, { status: 400 });
    }

    const manager = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!manager) {
      return NextResponse.json({ error: "Manager not found" }, { status: 404 });
    }

    let whereClause: any = {
      managerId: manager.id,
    };

    // If date is provided, filter by that date
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(
        Date.UTC(
          targetDate.getUTCFullYear(),
          targetDate.getUTCMonth(),
          targetDate.getUTCDate()
        )
      );
      const endOfDay = new Date(startOfDay);
      endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

      whereClause.createdAt = {
        gte: startOfDay,
        lt: endOfDay,
      };
    }

    const attendances = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        office: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(attendances);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
