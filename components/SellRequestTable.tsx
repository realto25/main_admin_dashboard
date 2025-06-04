"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface SellRequest {
  id: string;
  status: string;
  createdAt: Date;
  user: {
    name: string;
    email: string;
    phone: string | null;
  };
  land: {
    number: string;
    size: string;
    price: number;
  };
  Plot: {
    title: string;
    location: string;
  } | null;
}

interface SellRequestTableProps {
  requests: SellRequest[];
  onStatusChange: (requestId: string, newStatus: string) => Promise<void>;
}

export function SellRequestTable({
  requests,
  onStatusChange,
}: SellRequestTableProps) {
  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      await onStatusChange(requestId, newStatus);
      toast.success("Sell request status updated successfully");
    } catch (error) {
      toast.error("Failed to update sell request status");
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Land Details</TableHead>
            <TableHead>Plot</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Requested On</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{request.user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {request.user.email}
                  </p>
                  {request.user.phone && (
                    <p className="text-sm text-muted-foreground">
                      {request.user.phone}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">Land #{request.land.number}</p>
                  <p className="text-sm text-muted-foreground">
                    {request.land.size} - ${request.land.price.toLocaleString()}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                {request.Plot ? (
                  <>
                    <p className="font-medium">{request.Plot.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.Plot.location}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No plot assigned
                  </p>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    request.status === "approved"
                      ? "default"
                      : request.status === "rejected"
                      ? "outline"
                      : "secondary"
                  }
                  className={
                    request.status === "rejected"
                      ? "border-destructive text-destructive hover:bg-destructive/10"
                      : ""
                  }
                >
                  {request.status}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(request.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right space-x-2">
                {request.status === "pending" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(request.id, "approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleStatusChange(request.id, "rejected")}
                    >
                      Reject
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
