import { SellRequestTable } from "@/components/SellRequestTable";
import { prisma } from "@/lib/prisma";

export default async function SellRequestsPage() {
  const sellRequests = await prisma.sellRequest.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
      Plot: {
        select: {
          title: true,
          location: true,
          lands: {
            select: {
              number: true,
              size: true,
              price: true,
            },
            take: 1,
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const transformedRequests = sellRequests.map((request) => ({
    ...request,
    land: request.Plot?.lands[0] || {
      number: "N/A",
      size: "N/A",
      price: 0,
    },
  }));

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    "use server";

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/sell-requests/${requestId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
    } catch (error) {
      console.error("Error updating sell request:", error);
      throw new Error("Failed to update sell request status");
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Sell Requests</h1>
      </div>

      <div className="bg-white rounded-lg shadow">
        <SellRequestTable
          requests={transformedRequests}
          onStatusChange={handleStatusChange}
        />
      </div>
    </div>
  );
}
