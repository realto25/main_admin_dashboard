"use client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface SellRequestActionsProps {
  requestId: string;
  currentStatus: string;
  onStatusChange: (status: string) => Promise<void>;
}

export function SellRequestActions({
  requestId,
  currentStatus,
  onStatusChange,
}: SellRequestActionsProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );
  const router = useRouter();

  const handleAction = async (type: "approve" | "reject") => {
    setActionType(type);
    setShowConfirmDialog(true);
  };

  const confirmAction = async () => {
    if (!actionType) return;

    setLoading(true);
    try {
      await onStatusChange(actionType);
      setShowConfirmDialog(false);
      router.refresh();
    } catch (error) {
      console.error(`Error ${actionType}ing request:`, error);
      toast.error(`Failed to ${actionType} request`);
    } finally {
      setLoading(false);
    }
  };

  if (currentStatus !== "pending") {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction("approve")}
          disabled={loading}
        >
          Approve
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleAction("reject")}
          disabled={loading}
        >
          Reject
        </Button>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "approve" ? "Approve" : "Reject"} Sell Request
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {actionType} this sell request? This
              action will{" "}
              {actionType === "approve"
                ? "make the plot available for sale"
                : "keep the plot with the current owner"}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              disabled={loading}
              className={actionType === "reject" ? "bg-destructive" : ""}
            >
              {loading
                ? "Processing..."
                : actionType === "approve"
                ? "Approve"
                : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
