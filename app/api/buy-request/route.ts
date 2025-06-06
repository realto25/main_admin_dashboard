import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const getManagers = searchParams.get("getManagers");

    if (getManagers === "true") {
      const managers = await prisma.user.findMany({
        where: {
          role: "MANAGER",
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          _count: {
            select: {
              assignedVisitRequests: true,
              assignedBuyRequests: true,
            },
          },
        },
      });

      return NextResponse.json(
        managers.map((manager) => ({
          ...manager,
          stats: {
            totalAssignments:
              manager._count.assignedVisitRequests +
              manager._count.assignedBuyRequests,
            visitRequests: manager._count.assignedVisitRequests,
            buyRequests: manager._count.assignedBuyRequests,
          },
        }))
      );
    }

    // Get buy requests based on user role
    const requests = await prisma.buyRequest.findMany({
      where: userId
        ? {
            land: {
              ownerId: userId,
            },
          }
        : undefined,
      include: {
        land: {
          include: {
            plot: true,
          },
        },
        assignedManager: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching buy requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch buy requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, phone, message, selectedLandId } = await request.json();

    if (!name || !phone || !selectedLandId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const land = await prisma.land.findUnique({
      where: { id: selectedLandId },
      include: {
        plot: true,
      },
    });

    if (!land) {
      return NextResponse.json({ error: "Land not found" }, { status: 404 });
    }

    const newRequest = await prisma.buyRequest.create({
      data: {
        name,
        phone,
        message,
        landId: selectedLandId,
        status: "PENDING",
      },
      include: {
        land: {
          include: {
            plot: true,
          },
        },
      },
    });

    // Create notification for plot owner if exists
    if (land.ownerId) {
      await prisma.notification.create({
        data: {
          type: "BUY_REQUEST_UPDATED",
          title: "New Buy Request",
          message: `New buy request for ${land.plot.title} - Plot ${land.number}`,
          userId: land.ownerId,
        },
      });
    }

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error("Error submitting buy request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, assignedManagerId, status } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (assignedManagerId) {
      // Verify manager exists and has MANAGER role
      const manager = await prisma.user.findFirst({
        where: {
          id: assignedManagerId,
          role: "MANAGER",
        },
      });

      if (!manager) {
        return NextResponse.json(
          { error: "Invalid manager ID or user is not a manager" },
          { status: 400 }
        );
      }

      updateData.assignedManagerId = assignedManagerId;
      updateData.status = "ASSIGNED";
    }

    if (status) {
      updateData.status = status;
    }

    const updatedRequest = await prisma.buyRequest.update({
      where: { id },
      data: updateData,
      include: {
        land: {
          include: {
            plot: true,
            owner: true,
          },
        },
        assignedManager: true,
      },
    });

    // Create notifications
    if (assignedManagerId) {
      await prisma.notification.create({
        data: {
          type: "BUY_REQUEST_ASSIGNED",
          title: "New Buy Request Assignment",
          message: `You have been assigned to handle a buy request for ${updatedRequest.land.plot.title} - Plot ${updatedRequest.land.number}`,
          userId: assignedManagerId,
        },
      });

      if (updatedRequest.land.ownerId) {
        await prisma.notification.create({
          data: {
            type: "BUY_REQUEST_UPDATED",
            title: "Buy Request Updated",
            message: `Your buy request has been assigned to manager ${updatedRequest.assignedManager?.name}`,
            userId: updatedRequest.land.ownerId,
          },
        });
      }
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Error updating buy request:", error);
    return NextResponse.json(
      { error: "Failed to update buy request" },
      { status: 500 }
    );
  }
}
