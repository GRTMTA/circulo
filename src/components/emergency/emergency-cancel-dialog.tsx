"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function EmergencyCancelDialog({
  circleName,
  open = false,
  onOpenChange,
}: {
  circleName: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [reason, setReason] = useState("Payment failure");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Circle?</DialogTitle>
          <DialogDescription>This action is irreversible for {circleName}. Funds remain governed by contract rules.</DialogDescription>
        </DialogHeader>
        <Textarea value={reason} onChange={(event) => setReason(event.target.value)} />
        <DialogFooter>
          <Button variant="destructive" onClick={() => toast.error("Cancellation requested")}>Confirm Cancellation</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

