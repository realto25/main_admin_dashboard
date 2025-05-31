import { DataTable } from "@/components/ui/data-table";
import { prisma } from "@/lib/prisma";
import { columns } from "./columns";

export default async function FeedbackPage() {
  const feedbacks = await prisma.feedback.findMany({
    include: {
      visitRequest: {
        include: {
          plot: true,
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
    bookingId: fb.bookingId,
    rating: fb.rating,
    experience: fb.experience,
    suggestions: fb.suggestions,
    purchaseInterest: fb.purchaseInterest ? "Yes" : "No",
    plot: fb.booking.plot.title,
    date: fb.createdAt.toLocaleDateString(),
  }));

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight">Feedbacks</h2>
      <DataTable columns={columns} data={formatted} />
    </div>
  );
}
