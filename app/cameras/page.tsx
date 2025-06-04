import AssignCameraToPlotDialog from "@/components/AssignCameraToPlotDialog";
import { CameraList } from "@/components/CameraList";
import { prisma } from "@/lib/prisma";

export default async function CamerasPage() {
  const cameras = await prisma.camera.findMany({
    include: {
      land: {
        include: {
          plot: {
            select: {
              title: true,
              location: true,
              owner: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const plots = await prisma.plot.findMany({
    include: {
      camera: true,
    },
  });

  const handleDelete = async (cameraId: string) => {
    "use server";
    await prisma.camera.delete({
      where: { id: cameraId },
    });
  };

  // Transform cameras data to match CameraList props
  const transformedCameras = cameras.map((camera) => ({
    ...camera,
    plot: camera.land.plot,
  }));

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Camera Management</h1>
        <AssignCameraToPlotDialog plots={plots} />
      </div>

      <div className="bg-white rounded-lg shadow">
        <CameraList cameras={transformedCameras} onDelete={handleDelete} />
      </div>
    </div>
  );
}
