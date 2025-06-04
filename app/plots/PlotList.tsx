"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit, IndianRupee, MapPin, Ruler, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import AssignLandDialog from "@/components/AssignLandDialog";

import LandLayoutEditor from "@/components/LandLayoutEditor";
import EditPlotForm from "./EditPlotForm";

interface Plot {
  id: string;
  title: string;
  dimension: string;
  price: number;
  priceLabel: string;
  status: "AVAILABLE" | "ADVANCE" | " SOLD";
  imageUrls: string[];
  location: string;
  latitude: number;
  longitude: number;
  facing: string;
  amenities: string[];
  mapEmbedUrl: string;
  createdAt: string;
  ownerId: string;
}

interface PlotListProps {
  projectId: string;
}

const PlotList = ({ projectId }: PlotListProps) => {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlotId, setEditingPlotId] = useState<string | null>(null);
  const [landLayoutPlotId, setLandLayoutPlotId] = useState<string | null>(null);

  const fetchPlots = async () => {
    try {
      const res = await fetch(`/api/plots?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch plots");
      const data = await res.json();
      setPlots(data);
    } catch (err) {
      toast.error("Error fetching plots");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlots();
  }, [projectId]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this plot?")) return;

    try {
      const res = await fetch(`/api/plots/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Plot deleted");
      fetchPlots();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-100 text-green-800";
      case "ADVANCE":
        return "bg-yellow-100 text-yellow-800";
      case "SOLD":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return <p className="p-4">Loading plots...</p>;
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {plots.map((plot) => (
          <Card
            key={plot.id}
            onClick={() => {
              if (!editingPlotId) setLandLayoutPlotId(plot.id);
            }}
            className="hover:shadow-md cursor-pointer transition-shadow"
          >
            <div className="relative">
              {plot.imageUrls?.[0] && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={plot.imageUrls[0]}
                    alt={plot.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder.svg";
                    }}
                  />
                </div>
              )}

              <div className="absolute top-2 right-2">
                <Badge className={getStatusColor(plot.status)}>
                  {plot.status}
                </Badge>
              </div>
            </div>

            <CardContent className="p-4">
              <h3 className="font-semibold text-lg">{plot.title}</h3>

              <div className="text-sm text-muted-foreground flex items-center mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                {plot.location}
              </div>

              <div className="text-green-600 font-bold mt-2 text-lg flex items-center">
                <IndianRupee className="h-4 w-4 mr-1" />
                {plot.price.toLocaleString()}
              </div>

              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Ruler className="h-4 w-4 mr-1" />
                {plot.dimension}
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="default"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingPlotId(plot.id);
                  }}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(plot.id);
                  }}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3">
                <AssignLandDialog plotId={plot.id} />
              </div>

             
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plot Edit Dialog */}
      {editingPlotId && !landLayoutPlotId && (
        <EditPlotForm
          plotId={editingPlotId}
          isOpen={true}
          onClose={() => setEditingPlotId(null)}
          onSuccess={() => {
            fetchPlots();
            setEditingPlotId(null);
          }}
        />
      )}

      {/* Land Layout Editor Dialog */}
      {landLayoutPlotId && !editingPlotId && (
        <Dialog open={true} onOpenChange={() => setLandLayoutPlotId(null)}>
          <DialogContent className="max-w-6xl w-full">
            <DialogHeader>
              <DialogTitle>Manage Lands for Plot</DialogTitle>
            </DialogHeader>
            <LandLayoutEditor plotId={landLayoutPlotId} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default PlotList;
