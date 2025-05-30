import { ClientDetails } from "@/components/ClientDetails";
import { ClientPlotList } from "@/components/ClientPlotList";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

interface ClientPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientPage({ params }: ClientPageProps) {
  const { id } = await params;
  const client = await prisma.user.findUnique({
    where: {
      id,
      role: "CLIENT",
    },
    include: {
      clientPlots: {
        include: {
          plot: {
            include: {
              camera: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!client) {
    notFound();
  }

  // Transform the data to match the expected props
  const transformedClient = {
    ...client,
    plots: client.clientPlots.map((cp) => cp.plot),
  };

  return (
    <div className="container mx-auto py-10">
      <div className="grid gap-8">
        <ClientDetails client={transformedClient} />
        <ClientPlotList
          client={transformedClient}
          plots={transformedClient.plots}
        />
      </div>
    </div>
  );
}
