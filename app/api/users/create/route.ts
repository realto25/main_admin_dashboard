import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client"; // Import UserRole enum from Prisma
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().min(1, "Phone number is required"),
  role: z.enum([UserRole.CLIENT, UserRole.MANAGER], {
    // Allow only CLIENT or MANAGER roles
    errorMap: () => ({ message: "Role must be either CLIENT or MANAGER" }),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = createUserSchema.parse(body);

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Create the new user
    const newUser = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        role: validatedData.role,
        clerkId: "manual_" + validatedData.email.replace(/[^a-zA-Z0-9]/g, ""), // Generate a dummy clerkId for manual users
        // createdAt and updatedAt are handled by @default and @updatedAt
      },
      select: {
        // Select fields to return
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(newUser, { status: 201 }); // Return created user with 201 status
  } catch (error) {
    console.error("Error creating user:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    // Handle Prisma errors, e.g., unique constraint violation (though we checked email manually)
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; message: string };
      if (prismaError.code === "P2002") {
        // Unique constraint violation
        return NextResponse.json(
          { error: "User with this email already exists." },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
