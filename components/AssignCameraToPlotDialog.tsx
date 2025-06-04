"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plot } from "@prisma/client";
import { CameraIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Props = {
  plots: (Plot & {
    camera: {
      id: string;
      ipAddress: string;
      label: string | null;
    } | null;
  })[];
};

export default function AssignCameraToPlotDialog({ plots }: Props) {
  const [selectedPlot, setSelectedPlot] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [cameraLabel, setCameraLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const selectedPlotData = plots.find((p) => p.id === selectedPlot);
  const existingCamera = selectedPlotData?.camera;

  useEffect(() => {
    if (existingCamera) {
      setIpAddress(existingCamera.ipAddress);
      setCameraLabel(existingCamera.label || "");
    } else {
      setIpAddress("");
      setCameraLabel("");
    }
  }, [selectedPlot, existingCamera]);

  const handleSave = async () => {
    if (!selectedPlot) {
      toast.error("Please select a plot");
      return;
    }

    setLoading(true);
    try {
      // Find a land in the selected plot
      const res = await fetch(`/api/lands?plotId=${selectedPlot}`);
      const lands = await res.json();
      const land = lands[0]; // Get the first land in the plot

      if (!land) {
        throw new Error("No land found in this plot");
      }

      // Assign camera to the land
      const cameraRes = await fetch("/api/cameras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          landId: land.id,
          ipAddress,
          label: cameraLabel,
        }),
      });

      if (!cameraRes.ok) throw new Error("Failed to assign camera");

      toast.success("Camera assigned successfully");
      setOpen(false);
    } catch (error) {
      console.error("Error assigning camera:", error);
      toast.error("Failed to assign camera");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-blue-600">
          <CameraIcon className="h-4 w-4 mr-2" />
          Assign Camera
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Camera to Plot</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Select Plot</label>
            <Select value={selectedPlot} onValueChange={setSelectedPlot}>
              <SelectTrigger>
                <SelectValue placeholder="Select a plot" />
              </SelectTrigger>
              <SelectContent>
                {plots.map((plot) => (
                  <SelectItem key={plot.id} value={plot.id}>
                    {plot.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Input
            placeholder="Camera IP address (rtsp/http)"
            value={ipAddress}
            onChange={(e) => setIpAddress(e.target.value)}
          />
          <Input
            placeholder="Label (optional)"
            value={cameraLabel}
            onChange={(e) => setCameraLabel(e.target.value)}
          />
          <Button onClick={handleSave} disabled={loading || !selectedPlot}>
            {loading ? "Saving..." : "Save Camera"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
