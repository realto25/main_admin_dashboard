// lib/api.ts (createOrUpdateUser)
import { prisma } from "@/lib/prisma";

export const createOrUpdateUser = async (data: {
  clerkId: string;
  email: string;
  name: string;
  phone?: string;
  role: "guest" | "client" | "manager";
}) => {
  try {
    // Upsert user data
    return await prisma.user.upsert({
      where: { clerkId: data.clerkId },
      update: {
        email: data.email,
        name: data.name,
        phone: data.phone,
        role: data.role
      },
      create: {
        clerkId: data.clerkId,
        email: data.email,
        name: data.name,
        phone: data.phone,
        role: data.role
      }
    });
  } catch (error) {
    console.error("DB operation failed:", error);
    throw error;
  }
};
