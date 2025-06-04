"use client";

import AssignCameraDialog from "@/components/AssignCameraDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Land = {
  landId: string;
  landNumber: string;
  plotTitle: string;
  userName: string;
  size: string;
  camera?: {
    ipAddress: string;
    label?: string;
  };
};

const AssignedLandsTable = () => {
  const [lands, setLands] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrLoading, setQrLoading] = useState<string | null>(null);

  const fetchAssignedLands = async () => {
    try {
      const res = await fetch("/api/assigned-land");
      const data = await res.json();
      setLands(data);
    } catch (error) {
      toast.error("Failed to fetch assigned lands");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedLands();
  }, []);

  const generateQrCode = async (landId: string) => {
    try {
      setQrLoading(landId);
      const res = await fetch("/api/qr/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ landId }),
      });

      const data = await res.json();
      if (data.qrCodeUrl) {
        toast.success("QR code generated!");
        fetchAssignedLands();
      } else {
        toast.error("Failed to generate QR code");
      }
    } catch (error) {
      toast.error("QR code generation failed");
    } finally {
      setQrLoading(null);
    }
  };

  if (loading) return <div>Loading assigned lands...</div>;

  if (!lands.length) return <div>No assigned lands found.</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {lands.map((land) => (
        <Card key={land.landNumber}>
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Land #{land.landNumber}</h3>
              <Badge variant="outline" className="capitalize">
                {land.plotTitle || "unknown"}
              </Badge>
            </div>

            <div className="text-sm text-muted-foreground">
              Size: {land.size || "Not specified"}
            </div>

            {land.userName && (
              <>
                <div className="text-sm">
                  <strong>Owner:</strong> {land.userName}
                </div>
              </>
            )}
            <AssignCameraDialog
              landId={land.landId}
              existingIp={land.camera?.ipAddress}
              label={land.camera?.label}
            />

            <Button
              onClick={() => generateQrCode(land.landId)}
              disabled={qrLoading === land.landId}
            >
              {qrLoading === land.landId ? "Generating..." : "Generate QR Code"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AssignedLandsTable;
