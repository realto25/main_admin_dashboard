"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plot } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface AssignPlotDialogProps {
  clientId: string;
}

export function AssignPlotDialog({ clientId }: AssignPlotDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState<string>("");
  const router = useRouter();

  const fetchAvailablePlots = async () => {
    try {
      const response = await fetch("/api/plots?status=AVAILABLE");
      if (!response.ok) throw new Error("Failed to fetch plots");
      const data = await response.json();
      setPlots(data);
    } catch (error) {
      console.error("Error fetching plots:", error);
      toast.error("Failed to load available plots");
    }
  };

  const handleOpen = (open: boolean) => {
    setOpen(open);
    if (open) {
      fetchAvailablePlots();
    }
  };

  const handleAssign = async () => {
    if (!selectedPlotId) {
      toast.error("Please select a plot");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/plots/${selectedPlotId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: clientId }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      toast.success("Plot assigned successfully");
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error assigning plot:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to assign plot"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Assign Plot</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Plot to Client</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Plot</label>
            <Select
              value={selectedPlotId}
              onValueChange={setSelectedPlotId}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a plot" />
              </SelectTrigger>
              <SelectContent>
                {plots.map((plot) => (
                  <SelectItem key={plot.id} value={plot.id}>
                    {plot.title} - {plot.priceLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={loading}>
              {loading ? "Assigning..." : "Assign Plot"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
