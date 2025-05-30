"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Camera, Plot, User } from "@prisma/client";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EditCameraDialog } from "./EditCameraDialog";

interface CameraListProps {
  cameras: (Camera & {
    plot: Pick<Plot, "title" | "location"> & {
      owner: Pick<User, "name" | "email"> | null;
    };
  })[];
  onDelete: (cameraId: string) => Promise<void>;
}

export function CameraList({ cameras, onDelete }: CameraListProps) {
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDelete = async (cameraId: string) => {
    if (!confirm("Are you sure you want to delete this camera?")) {
      return;
    }

    try {
      setLoading(true);
      await onDelete(cameraId);
      toast.success("Camera deleted successfully");
    } catch (error) {
      console.error("Error deleting camera:", error);
      toast.error("Failed to delete camera");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Plot</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cameras.map((camera) => (
              <TableRow key={camera.id}>
                <TableCell className="font-medium">
                  {camera.label || "Unlabeled"}
                </TableCell>
                <TableCell>{camera.plot.title}</TableCell>
                <TableCell>{camera.plot.location}</TableCell>
                <TableCell>{camera.ipAddress}</TableCell>
                <TableCell>
                  {camera.plot.owner ? (
                    <div>
                      <p className="font-medium">{camera.plot.owner.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {camera.plot.owner.email}
                      </p>
                    </div>
                  ) : (
                    "No owner"
                  )}
                </TableCell>
                <TableCell>
                  {new Date(camera.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        disabled={loading}
                      >
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setEditingCamera(camera)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(camera.id)}
                        className="text-destructive"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editingCamera && (
        <EditCameraDialog
          camera={editingCamera}
          open={!!editingCamera}
          onOpenChange={(open) => !open && setEditingCamera(null)}
        />
      )}
    </>
  );
}
