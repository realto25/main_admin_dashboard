import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma"; // update the path based on your project

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  try {
    const { clerkId, email, name, phone, role } = req.body;

    const user = await prisma.user.upsert({
      where: { clerkId },
      update: { email, name, phone, role },
      create: { clerkId, email, name, phone, role },
    });

    res.status(200).json(user);
  } catch (error) {
    console.error("User upsert failed:", error);
    res.status(500).json({ error: "User creation failed" });
  }
}
