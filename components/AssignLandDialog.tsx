"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AssignLandDialog({ plotId }: { plotId: string }) {
  const [lands, setLands] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedLand, setSelectedLand] = useState("");
  const [selectedClient, setSelectedClient] = useState("");

  const fetchLands = async () => {
    const res = await fetch(`/api/lands?plotId=${plotId}`);
    const data = await res.json();
    setLands(data.filter((l: any) => !l.ownerId));
  };

  const fetchClients = async () => {
    const res = await fetch("/api/users?role=CLIENT");
    const data = await res.json();
    setClients(data);
  };

  const handleAssign = async () => {
    if (!selectedLand || !selectedClient) return;

    const res = await fetch("/api/assign-land", {
      method: "POST",
      body: JSON.stringify({ landId: selectedLand, clientId: selectedClient }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      toast.success("Land assigned successfully!");
      setSelectedLand("");
      setSelectedClient("");
      fetchLands(); // refresh
    } else {
      toast.error("Failed to assign land");
    }
  };

  useEffect(() => {
    fetchLands();
    fetchClients();
  }, [plotId]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default">Assign Land</Button>
      </DialogTrigger>
      <DialogContent className="space-y-4">
        <div>
          <label>Available Lands</label>
          <Select value={selectedLand} onValueChange={setSelectedLand}>
            <SelectTrigger>
              <SelectValue placeholder="Select a land" />
            </SelectTrigger>
            <SelectContent>
              {lands.map((land) => (
                <SelectItem key={land.id} value={land.id}>
                  {land.number} - ₹{land.price}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label>Clients</label>
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger>
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name} ({client.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleAssign}
          disabled={!selectedLand || !selectedClient}
        >
          Assign
        </Button>
      </DialogContent>
    </Dialog>
  );
}
