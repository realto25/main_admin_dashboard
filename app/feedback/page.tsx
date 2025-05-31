import { prisma } from "@/lib/prisma";
import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";

export default async function FeedbackPage() {
  const feedbacks = await prisma.feedback.findMany({
    include: {
      visitRequest: {
        include: {
          plot: {
            include: {
              project: true, // Include project for additional context if needed
            },
          },
        },
      },
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formatted = feedbacks.map((fb) => ({
    id: fb.id,
    visitRequestId: fb.visitRequestId, // Fixed: Changed from bookingId to visitRequestId
    rating: fb.rating,
    experience: fb.experience,
    suggestions: fb.suggestions,
    purchaseInterest: fb.purchaseInterest === null ? "Not specified" : fb.purchaseInterest ? "Yes" : "No",
    plot: fb.visitRequest.plot.title, // Fixed: Changed from fb.booking to fb.visitRequest
    date: fb.createdAt.toLocaleDateString(),
  }));

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight">Feedbacks</h2>
      <DataTable columns={columns} data={formatted} />
    </div>
  );
}