"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

type OfficeAssignment = {
  id: string;
  officeName: string;
  latitude: number;
  longitude: number;
  manager: {
    name: string;
    email: string;
  };
};

export default function AssignedOfficesPage() {
  const [assignments, setAssignments] = useState<OfficeAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = async () => {
    const res = await fetch("/api/manager/assigned-offices");
    const data = await res.json();
    setAssignments(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this office assignment?")) return;

    const res = await fetch(`/api/manager/assigned-offices/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success("Deleted");
      fetchAssignments();
    } else {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold">Assigned Offices</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {assignments.map((office) => (
            <Card key={office.id} className="p-4 space-y-2">
              <div>
                <strong>Office:</strong> {office.officeName}
              </div>
              <div>
                <strong>Location:</strong> {office.latitude.toFixed(4)}, {office.longitude.toFixed(4)}
              </div>
              <div>
                <strong>Manager:</strong> {office.manager.name} ({office.manager.email})
              </div>
              <Button
                className="mt-2"
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(office.id)}
              >
                Delete
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
