"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import axios from "axios";
import { CheckCircle2, Clock, QrCode, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Manager {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  stats: {
    totalAssignments: number;
    visitRequests: number;
    buyRequests: number;
  };
  clerkId: string;
}

interface VisitRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ASSIGNED";
  qrCode?: string;
  plotId: string;
  plot?: {
    id: string;
    title: string;
    location?: string;
    project?: {
      id: string;
      name: string;
    };
  };
  assignedManager?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  createdAt: string;
  rejectionReason?: string | null;
}

const statusConfig = {
  PENDING: { color: "bg-yellow-500", icon: Clock, label: "Pending" },
  APPROVED: { color: "bg-green-500", icon: CheckCircle2, label: "Approved" },
  REJECTED: { color: "bg-red-500", icon: XCircle, label: "Rejected" },
  ASSIGNED: { color: "bg-blue-500", icon: Clock, label: "Assigned" },
};

export default function VisitRequestsPage() {
  const [requests, setRequests] = useState<VisitRequest[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [selectedQR, setSelectedQR] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [requestsRes, managersRes] = await Promise.all([
        axios.get("/api/visit-requests"),
        axios.get("/api/visit-requests?getManagers=true"),
      ]);

      console.log(
        "Visit Requests Response:",
        JSON.stringify(requestsRes.data, null, 2)
      );
      console.log(
        "Managers Response:",
        JSON.stringify(managersRes.data, null, 2)
      );

      if (!Array.isArray(requestsRes.data)) {
        throw new Error("Invalid visit requests response: Expected an array");
      }
      if (!Array.isArray(managersRes.data)) {
        throw new Error("Invalid managers response: Expected an array");
      }

      setRequests(requestsRes.data);
      setManagers(managersRes.data);
    } catch (error: any) {
      console.error("Error fetching data:", error.message || error);
      setError(error.message || "Failed to fetch data");
      toast.error(error.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const assignManager = async (requestId: string, managerId: string) => {
    try {
      const manager = managers.find((m) => m.id === managerId);
      if (!manager) {
        toast.error("Manager not found");
        return;
      }

      const res = await axios.patch("/api/visit-requests", {
        id: requestId,
        managerClerkId: manager.clerkId,
      });
      setRequests((prev) =>
        prev.map((req) => (req.id === requestId ? res.data : req))
      );
      toast.success("Manager assigned successfully");
    } catch (error: any) {
      console.error("Error assigning manager:", error.message || error);
      toast.error("Failed to assign manager");
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {error && <div className="text-red-500 text-center">{error}</div>}
      <Card>
        <CardHeader>
          <CardTitle>Visit Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-center text-gray-500">
              No visit requests found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Plot</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Manager</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => {
                  const statusKey =
                    req.status in statusConfig
                      ? (req.status as keyof typeof statusConfig)
                      : "PENDING";
                  const StatusIcon = statusConfig[statusKey].icon;

                  return (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.name}</TableCell>
                      <TableCell>
                        {req.plot?.title || `Plot ${req.plotId}`}
                        {req.plot?.project?.name && (
                          <span className="text-sm text-gray-500 ml-2">
                            ({req.plot.project.name})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(req.date).toLocaleDateString()} {req.time}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`${statusConfig[statusKey].color} text-white`}
                        >
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[statusKey].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {req.assignedManager ? (
                          <div>
                            <div className="font-medium">
                              {req.assignedManager.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {req.assignedManager.email}
                            </div>
                          </div>
                        ) : (
                          <Select
                            onValueChange={(value) =>
                              assignManager(req.id, value)
                            }
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Assign Manager" />
                            </SelectTrigger>
                            <SelectContent>
                              {managers.map((manager) => (
                                <SelectItem key={manager.id} value={manager.id}>
                                  <div className="flex flex-col">
                                    <span>{manager.name}</span>
                                    <span className="text-xs text-gray-500">
                                      {manager.stats.totalAssignments}{" "}
                                      assignments
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell className="space-x-2">
                        {req.status === "APPROVED" && req.qrCode && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedQR(req.qrCode!)}
                              >
                                <QrCode className="w-4 h-4 mr-1" />
                                View QR
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>QR Code</DialogTitle>
                              </DialogHeader>
                              <div className="flex justify-center p-4">
                                <img
                                  src={req.qrCode}
                                  alt="QR Code"
                                  className="w-48 h-48"
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        {req.status === "ASSIGNED" && (
                          <Badge variant="secondary">Waiting for Manager</Badge>
                        )}
                        {req.status === "REJECTED" && (
                          <Badge variant="destructive">
                            Rejected{" "}
                            {req.rejectionReason
                              ? `(${req.rejectionReason})`
                              : ""}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
