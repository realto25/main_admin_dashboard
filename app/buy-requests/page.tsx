"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
}

interface BuyRequest {
  id: string;
  name: string;
  phone: string;
  message: string | null;
  status: "PENDING" | "ASSIGNED" | "ACCEPTED" | "REJECTED" | "COMPLETED";
  createdAt: string;
  land: {
    id: string;
    number: string;
    plot: {
      id: string;
      title: string;
    };
  };
  assignedManager?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
}

const statusConfig = {
  PENDING: { color: "bg-yellow-500", label: "Pending" },
  ASSIGNED: { color: "bg-blue-500", label: "Assigned" },
  ACCEPTED: { color: "bg-green-500", label: "Accepted" },
  REJECTED: { color: "bg-red-500", label: "Rejected" },
  COMPLETED: { color: "bg-purple-500", label: "Completed" },
};

export default function BuyRequestsPage() {
  const [requests, setRequests] = useState<BuyRequest[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [requestsRes, managersRes] = await Promise.all([
        axios.get("/api/buy-request"),
        axios.get("/api/buy-request?getManagers=true"),
      ]);
      setRequests(requestsRes.data);
      setManagers(managersRes.data);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const assignManager = async (requestId: string, managerId: string) => {
    try {
      const res = await axios.patch("/api/buy-request", {
        id: requestId,
        assignedManagerId: managerId,
      });
      setRequests((prev) =>
        prev.map((req) => (req.id === requestId ? res.data : req))
      );
      toast.success("Manager assigned successfully");
    } catch (error) {
      toast.error("Failed to assign manager");
    }
  };

  const updateStatus = async (
    requestId: string,
    status: BuyRequest["status"]
  ) => {
    try {
      const res = await axios.patch("/api/buy-request", {
        id: requestId,
        status,
      });
      setRequests((prev) =>
        prev.map((req) => (req.id === requestId ? res.data : req))
      );
      toast.success("Status updated successfully");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Buy Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Plot</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Manager</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.name}</TableCell>
                  <TableCell>
                    {req.land.plot.title} - Plot {req.land.number}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`${statusConfig[req.status].color} text-white`}
                    >
                      {statusConfig[req.status].label}
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
                        onValueChange={(value) => assignManager(req.id, value)}
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
                                  {manager.stats.totalAssignments} assignments
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell className="space-x-2">
                    {req.status === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateStatus(req.id, "ACCEPTED")}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateStatus(req.id, "REJECTED")}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {req.status === "ACCEPTED" && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(req.id, "COMPLETED")}
                        className="bg-purple-500 hover:bg-purple-600"
                      >
                        Mark Complete
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
