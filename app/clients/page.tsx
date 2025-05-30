import { ClientTable } from "@/components/ClientTable";
import { prisma } from "@/lib/prisma";

export default async function ClientsPage() {
  const clients = await prisma.user.findMany({
    where: {
      role: "CLIENT",
    },
    include: {
      _count: {
        select: {
          clientPlots: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Clients</h1>
      </div>
      <ClientTable clients={clients} />
    </div>
  );
}
