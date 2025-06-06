"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import axios from "axios";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface LeaveRequest {
  id: string;
  userId: string;
  user: {
    clerkId: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
  };
  startDate: string;
  endDate: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

const statusConfig = {
  PENDING: { color: "bg-yellow-500", icon: Clock, label: "Pending" },
  APPROVED: { color: "bg-green-500", icon: CheckCircle2, label: "Approved" },
  REJECTED: { color: "bg-red-500", icon: XCircle, label: "Rejected" },
};

export default function LeaveRequestsPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get("/api/leave-request");

      console.log(
        "Leave Requests Response:",
        JSON.stringify(response.data, null, 2)
      );

      if (!Array.isArray(response.data)) {
        throw new Error("Invalid leave requests response: Expected an array");
      }

      setRequests(response.data);
    } catch (error: any) {
      console.error("Error fetching data:", error.message || error);
      setError(error.message || "Failed to fetch leave requests");
      toast.error(error.message || "Failed to fetch leave requests");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (
    requestId: string,
    action: "APPROVE" | "REJECT"
  ) => {
    try {
      const payload = {
        id: requestId,
        action,
        rejectionReason: action === "REJECT" ? rejectionReason : undefined,
      };

      const response = await axios.patch("/api/leave-request", payload);

      if (response.status !== 200) {
        throw new Error(`Failed to ${action.toLowerCase()} leave request`);
      }

      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? {
                ...req,
                status: action === "APPROVE" ? "APPROVED" : "REJECTED",
                rejectionReason: action === "REJECT" ? rejectionReason : null,
              }
            : req
        )
      );
      setSelectedRequestId(null);
      setRejectionReason("");
      toast.success(`Leave request ${action.toLowerCase()}d successfully`);
    } catch (error: any) {
      console.error(
        `Error ${action.toLowerCase()}ing leave request:`,
        error.message || error
      );
      toast.error(`Failed to ${action.toLowerCase()} leave request`);
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
          <CardTitle>Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-center text-gray-500">
              No leave requests found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Manager Name</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted On</TableHead>
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
                      <TableCell className="font-medium">
                        {req.user.name} ({req.user.email})
                      </TableCell>
                      <TableCell>
                        {new Date(req.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(req.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{req.reason}</TableCell>
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
                        {new Date(req.createdAt).toLocaleDateString()}{" "}
                        {new Date(req.createdAt).toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="space-x-2">
                        {req.status === "PENDING" ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleAction(req.id, "APPROVE")}
                              className="bg-green-500 text-white"
                            >
                              Approve
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setSelectedRequestId(req.id)}
                                >
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>
                                    Reject Leave Request
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="py-4">
                                  <label className="block text-sm font-medium text-gray-700">
                                    Reason for Rejection
                                  </label>
                                  <Input
                                    value={rejectionReason}
                                    onChange={(e) =>
                                      setRejectionReason(e.target.value)
                                    }
                                    placeholder="Enter rejection reason"
                                    className="mt-1"
                                  />
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="secondary"
                                    onClick={() => {
                                      setSelectedRequestId(null);
                                      setRejectionReason("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() =>
                                      handleAction(req.id, "REJECT")
                                    }
                                    disabled={!rejectionReason.trim()}
                                  >
                                    Confirm Rejection
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </>
                        ) : req.status === "REJECTED" && req.rejectionReason ? (
                          <Badge
                            variant="secondary"
                            className="bg-red-500 text-white"
                          >
                            Rejected ({req.rejectionReason})
                          </Badge>
                        ) : null}
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
