"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function OnboardingCompleteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>You are all set</DialogTitle>
          <DialogDescription>You now know how to navigate your circles and inspect key status signals.</DialogDescription>
        </DialogHeader>
        <DialogFooter><Button onClick={() => onOpenChange(false)}>Got it</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

