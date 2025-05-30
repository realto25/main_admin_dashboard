"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, MapPin } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface Plot {
  id: string;
  title: string;
  location: string;
  status: string;
  camera?: {
    id: string;
    ipAddress: string;
    label?: string | null;
  } | null;
}

interface Client {
  id: string;
  name: string;
  email: string;
}

interface ClientPlotListProps {
  client: Client;
  plots: Plot[];
}

export function ClientPlotList({ client, plots }: ClientPlotListProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Assigned Plots</h2>
      {plots.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plots.map((plot) => (
            <Card key={plot.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{plot.title}</span>
                  <Badge
                    variant={
                      plot.status === "SOLD"
                        ? "default"
                        : plot.status === "AVAILABLE"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {plot.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="mr-2 h-4 w-4" />
                  {plot.location}
                </div>

                {plot.camera && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Camera className="mr-2 h-4 w-4" />
                    <span>
                      {plot.camera.label || "Camera"}: {plot.camera.ipAddress}
                    </span>
                  </div>
                )}

                <div className="flex justify-center p-4 bg-muted rounded-lg">
                  <QRCodeSVG
                    value={`${window.location.origin}/plots/${plot.id}`}
                    size={128}
                    level="H"
                    includeMargin
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No plots assigned yet.</p>
      )}
    </div>
  );
}
