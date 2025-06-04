// File: components/AssignQrCameraForm.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AssignQrCameraForm({ landId }: { landId: string }) {
  const [cameraIp, setCameraIp] = useState("");

  const handleAssign = async () => {
    try {
      const res = await fetch("/api/lands/assign-qrcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ landId, cameraIp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error assigning");

      toast.success("QR Code and Camera IP assigned.");
    } catch (err) {
      toast.error("Failed to assign");
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Camera IP Address (optional)</label>
      <Input
        placeholder="e.g., http://192.168.1.10:8080"
        value={cameraIp}
        onChange={(e) => setCameraIp(e.target.value)}
      />
      <Button onClick={handleAssign}>Assign QR Code</Button>
    </div>
  );
}
