// components/GenerateQrDialog.tsx
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
import { toast } from "sonner";

type Land = {
  id: string;
  number: string;
  status: string;
  userName: string;
};

export default function GenerateQrDialog() {
  const [lands, setLands] = useState<Land[]>([]);
  const [selectedLand, setSelectedLand] = useState<string>("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAssignedLands = async () => {
    try {
      const res = await fetch("/api/assigned-lands");
      const data = await res.json();
      if (Array.isArray(data)) {
        setLands(data);
      } else {
        console.warn("No assigned lands found", data);
      }
    } catch (err) {
      console.error("Failed to fetch assigned lands", err);
    }
  };
  

  const handleGenerate = async () => {
    if (!selectedLand) return;
    setLoading(true);
    try {
      const res = await fetch("/api/qr/generate", {
        method: "POST",
        body: JSON.stringify({ landId: selectedLand }),
      });
      const data = await res.json();
      if (data.qrCode) {
        setQrCode(data.qrCode);
        toast.success("QR code generated");
      } else {
        toast.error("Failed to generate QR");
      }
    } catch (e) {
      toast.error("Error generating QR");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedLands();
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Generate Land QR</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Assigned Land</DialogTitle>
        </DialogHeader>

        <select
          className="w-full border p-2 mb-4"
          value={selectedLand}
          onChange={(e) => setSelectedLand(e.target.value)}
        >
          <option value="">-- Select Land --</option>
          {lands.map((land) => (
            <option key={land.landId} value={land.landId}>
              {land.plotTitle} / {land.landNumber} - {land.userName}
            </option>
          ))}
        </select>

        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating..." : "Generate QR"}
        </Button>

        {qrCode && (
          <div className="mt-4">
            <p className="font-medium">Generated QR Code:</p>
            <img src={qrCode} alt="QR Code" className="mt-2 border" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
