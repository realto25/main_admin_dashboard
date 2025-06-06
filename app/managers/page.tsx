"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import { toast } from "sonner";

// Lazy load leaflet map to avoid SSR issues
const DynamicMap = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);

type Manager = {
  id: string;
  clerkId: string;
  name: string;
  email: string;
  role: string;
};

type Office = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  managers: Manager[];
};

export default function AssignManagerToOffice() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [selectedManager, setSelectedManager] = useState("");
  const [selectedOffice, setSelectedOffice] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [latlng, setLatlng] = useState<[number, number]>([12.9716, 77.5946]);
  const [manualLat, setManualLat] = useState(latlng[0].toString());
  const [manualLng, setManualLng] = useState(latlng[1].toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<"create" | "assign">("create");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load managers
      const managersRes = await fetch("/api/users?role=MANAGER");
      if (managersRes.ok) {
        const managersData = await managersRes.json();
        setManagers(managersData);
      }

      // Load offices
      const officesRes = await fetch("/api/offices");
      if (officesRes.ok) {
        const officesData = await officesRes.json();
        setOffices(officesData);
      }
    } catch (error) {
      toast.error("Failed to load data");
      console.error("Error loading data:", error);
    }
  };

  const handleCreateOffice = async () => {
    if (!officeName.trim()) {
      return toast.error("Please enter office name");
    }

    setIsSubmitting(true);
    try {
      const [latitude, longitude] = latlng;
      const res = await fetch("/api/offices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: officeName.trim(),
          latitude,
          longitude,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        return toast.error(errorData.error || "Failed to create office");
      }

      toast.success("Office created successfully!");
      setOfficeName("");
      setLatlng([12.9716, 77.5946]);
      setManualLat("12.9716");
      setManualLng("77.5946");
      
      // Reload offices
      await loadData();
    } catch (error) {
      toast.error("An error occurred while creating office");
      console.error("Error creating office:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignManager = async () => {
    if (!selectedManager || !selectedOffice) {
      return toast.error("Please select both manager and office");
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/manager/assign-office", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: selectedManager,
          officeId: selectedOffice,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        return toast.error(errorData.error || "Failed to assign manager");
      }

      toast.success("Manager assigned to office successfully!");
      setSelectedManager("");
      setSelectedOffice("");
      
      // Reload data to show updated assignments
      await loadData();
    } catch (error) {
      toast.error("An error occurred while assigning manager");
      console.error("Error assigning manager:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualLocationUpdate = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      setLatlng([lat, lng]);
    } else {
      toast.error("Please enter valid coordinates");
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLatlng([latitude, longitude]);
        setManualLat(latitude.toString());
        setManualLng(longitude.toString());
      },
      (error) => {
        toast.error("Failed to get your location: " + error.message);
      }
    );
  };

  const getAvailableManagers = () => {
    return managers.filter(manager => 
      !offices.some(office => 
        office.managers.some(m => m.clerkId === manager.clerkId)
      )
    );
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Office & Manager Management</h2>

      {/* Mode Selection */}
      <div className="flex gap-4 border-b pb-4">
        <Button
          variant={mode === "create" ? "default" : "outline"}
          onClick={() => setMode("create")}
        >
          Create Office
        </Button>
        <Button
          variant={mode === "assign" ? "default" : "outline"}
          onClick={() => setMode("assign")}
        >
          Assign Manager
        </Button>
      </div>

      {mode === "create" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Create New Office</h3>
          
          <div>
            <Label>Office Name</Label>
            <Input
              value={officeName}
              onChange={(e) => setOfficeName(e.target.value)}
              placeholder="Enter office name"
            />
          </div>

          <div className="space-y-2">
            <Label>Office Location</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  placeholder="Enter latitude"
                />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  placeholder="Enter longitude"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleManualLocationUpdate}>
                Update Map Location
              </Button>
              <Button variant="outline" onClick={handleCurrentLocation}>
                Use Current Location
              </Button>
            </div>
            <div className="h-80 rounded-md overflow-hidden border">
              <MapContainer
                center={latlng}
                zoom={15}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <DraggableMarker
                  latlng={latlng}
                  setLatlng={(newLatlng) => {
                    setLatlng(newLatlng);
                    setManualLat(newLatlng[0].toString());
                    setManualLng(newLatlng[1].toString());
                  }}
                />
              </MapContainer>
            </div>
          </div>

          <Button onClick={handleCreateOffice} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Office"}
          </Button>
        </div>
      )}

      {mode === "assign" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Assign Manager to Office</h3>
          
          <div>
            <Label>Select Manager</Label>
            <select
              value={selectedManager}
              onChange={(e) => setSelectedManager(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="">Select Manager</option>
              {getAvailableManagers().map((manager) => (
                <option key={manager.clerkId} value={manager.clerkId}>
                  {manager.name} ({manager.email})
                </option>
              ))}
            </select>
            {getAvailableManagers().length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                All managers are already assigned to offices
              </p>
            )}
          </div>

          <div>
            <Label>Select Office</Label>
            <select
              value={selectedOffice}
              onChange={(e) => setSelectedOffice(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="">Select Office</option>
              {offices.map((office) => (
                <option key={office.id} value={office.id}>
                  {office.name} ({office.managers.length} managers assigned)
                </option>
              ))}
            </select>
          </div>

          <Button 
            onClick={handleAssignManager} 
            disabled={isSubmitting || !selectedManager || !selectedOffice}
          >
            {isSubmitting ? "Assigning..." : "Assign Manager"}
          </Button>
        </div>
      )}

      {/* Current Assignments */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Current Office Assignments</h3>
        <div className="grid gap-4">
          {offices.map((office) => (
            <div key={office.id} className="border rounded-lg p-4">
              <h4 className="font-semibold">{office.name}</h4>
              <p className="text-sm text-gray-600">
                Location: {office.latitude.toFixed(6)}, {office.longitude.toFixed(6)}
              </p>
              <div className="mt-2">
                <p className="text-sm font-medium">Assigned Managers:</p>
                {office.managers.length > 0 ? (
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {office.managers.map((manager) => (
                      <li key={manager.id}>{manager.name} ({manager.email})</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No managers assigned</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DraggableMarker({
  latlng,
  setLatlng,
}: {
  latlng: [number, number];
  setLatlng: (pos: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      setLatlng([e.latlng.lat, e.latlng.lng]);
    },
  });

  return (
    <Marker
      position={latlng}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const position = marker.getLatLng();
          setLatlng([position.lat, position.lng]);
        },
      }}
    >
      <Popup>Drag me to the office location or click on the map</Popup>
    </Marker>
  );
}