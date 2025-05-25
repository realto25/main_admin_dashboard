// app/plots/PlotList.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, IndianRupee, MapPin, Ruler, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import EditPlotForm from "./EditPlotForm";

interface Plot {
  id: string;
  title: string;
  dimension: string;
  price: number;
  priceLabel: string;
  status: "AVAILABLE" | "ADVANCE" | "SOLD";
  imageUrls: string[];
  location: string;
  latitude: number;
  longitude: number;
  facing: string;
  amenities: string[];
  mapEmbedUrl: string;
  createdAt: string;
}

interface PlotListProps {
  projectId: string;
}

const PlotList = ({ projectId }: PlotListProps) => {
  const router = useRouter();
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlotId, setEditingPlotId] = useState<string | null>(null);

  const fetchPlots = async () => {
    try {
      const response = await fetch(`/api/plots?projectId=${projectId}`);
      if (!response.ok) throw new Error("Failed to fetch plots");
      const data = await response.json();
      setPlots(data);
    } catch (error) {
      console.error("Error fetching plots:", error);
      toast.error("Failed to fetch plots");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlots();
  }, [projectId]);

  const handleDelete = async (plotId: string) => {
    if (!confirm("Are you sure you want to delete this plot?")) return;

    try {
      const res = await fetch(`/api/plots/${plotId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete plot");
      toast.success("Plot deleted successfully");
      fetchPlots();
    } catch (error) {
      console.error("Error deleting plot:", error);
      toast.error("Failed to delete plot");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "ADVANCE":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "SOLD":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p>Loading plots...</p>
        </div>
      </div>
    );
  }

  if (plots.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">
          No plots found for this project.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {plots.map((plot) => (
          <Card
            key={plot.id}
            className="overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="relative">
              {/* Image */}
              {plot.imageUrls.length > 0 && plot.imageUrls[0] && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={plot.imageUrls[0]}
                    alt={plot.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%239ca3af' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                    }}
                  />
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute top-2 right-2">
                <Badge className={getStatusColor(plot.status)}>
                  {plot.status}
                </Badge>
              </div>

              {/* Multiple Images Indicator */}
              {plot.imageUrls.length > 1 && (
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  +{plot.imageUrls.length - 1} more
                </div>
              )}
            </div>

            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Title */}
                <h3 className="font-semibold text-lg line-clamp-1">
                  {plot.title}
                </h3>

                {/* Location */}
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="line-clamp-1">{plot.location}</span>
                </div>

                {/* Price */}
                <div className="flex items-center text-lg font-bold text-green-600">
                  <IndianRupee className="h-4 w-4 mr-1" />
                  {plot.price.toLocaleString()}
                </div>

                {/* Dimension */}
                <div className="flex items-center text-sm text-muted-foreground">
                  <Ruler className="h-4 w-4 mr-1" />
                  <span>{plot.dimension}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingPlotId(plot.id)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(plot.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      {editingPlotId && (
        <EditPlotForm
          plotId={editingPlotId}
          isOpen={!!editingPlotId}
          onClose={() => setEditingPlotId(null)}
          onSuccess={() => {
            setEditingPlotId(null);
            fetchPlots();
          }}
        />
      )}
    </>
  );
};

export default PlotList;
