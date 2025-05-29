// app/dashboard/visit-requests/page.tsx
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

interface VisitRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  qrCode?: string;
  plotId: string;
  createdAt: string;
}

const statusConfig = {
  PENDING: { color: "bg-yellow-500", icon: Clock },
  APPROVED: { color: "bg-green-500", icon: CheckCircle2 },
  REJECTED: { color: "bg-red-500", icon: XCircle },
};

export default function VisitRequestsPage() {
  const [requests, setRequests] = useState<VisitRequest[]>([]);
  const [selectedQR, setSelectedQR] = useState<string | null>(null);

  useEffect(() => {
    axios.get("/api/visit-requests").then((res) => setRequests(res.data));
  }, []);

  const approveRequest = async (id: string) => {
    try {
      const res = await axios.post(`/api/visit-requests/${id}/approve`);
      setRequests((prev) => prev.map((r) => (r.id === id ? res.data : r)));
      toast.success("Request approved and QR code generated");
    } catch (error) {
      toast.error("Failed to approve request");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Visit Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Plot ID</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => {
                const StatusIcon = statusConfig[req.status].icon;
                return (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.name}</TableCell>
                    <TableCell>{req.plotId}</TableCell>
                    <TableCell>
                      {new Date(req.date).toLocaleDateString()} {req.time}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`${
                          statusConfig[req.status].color
                        } text-white`}
                      >
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      {req.status === "PENDING" && (
                        <Button
                          size="sm"
                          onClick={() => approveRequest(req.id)}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          Approve
                        </Button>
                      )}
                      {req.qrCode && (
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
