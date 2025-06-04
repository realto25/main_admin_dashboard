"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CameraIcon } from "lucide-react";

type Props = {
  landId: string;
  existingIp?: string;
  label?: string;
};

const AssignCameraDialog = ({ landId, existingIp, label }: Props) => {
  const [ipAddress, setIpAddress] = useState(existingIp || "");
  const [cameraLabel, setCameraLabel] = useState(label || "");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cameras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ landId, ipAddress, label: cameraLabel }),
      });

      if (!res.ok) throw new Error("Failed");

      toast.success("Camera IP assigned");
      setOpen(false);
    } catch {
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
          <DialogTitle>Assign Camera to Land</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
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
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Camera"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignCameraDialog;
