"use client";

import AddPlotForm from "@/app/plots/AddPlotForm";
import PlotList from "@/app/plots/PlotList";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ProjectDetailClientProps {
  projectId: string;
}

export default function ProjectDetailClient({
  projectId,
}: ProjectDetailClientProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Project Details</h1>

      <div className="mb-6">
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-orange-400 text-white border-2 border-black px-4 py-2 rounded-md hover:bg-orange-500"
        >
          {showForm ? "Cancel" : "Add New Plot"}
        </Button>
      </div>

      {/* Form only appears when button is clicked */}
      {showForm && (
        <AddPlotForm
          projectId={projectId}
          onSuccess={() => {
            setShowForm(false);
          }}
        />
      )}

      {/* Show existing plots */}
      <PlotList projectId={projectId} />
    </div>
  );
}
