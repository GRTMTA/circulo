"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { EmergencyCancelDialog } from "@/components/emergency/emergency-cancel-dialog";
import { EmergencyPauseDialog } from "@/components/emergency/emergency-pause-dialog";

export function EmergencyControls({ circleName }: { circleName: string }) {
  const [pauseOpen, setPauseOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" onClick={() => setPauseOpen(true)}>Request emergency pause</Button>
      <Button variant="destructive" onClick={() => setCancelOpen(true)}>Cancel if rules allow</Button>
      <EmergencyPauseDialog circleName={circleName} open={pauseOpen} onOpenChange={setPauseOpen} />
      <EmergencyCancelDialog circleName={circleName} open={cancelOpen} onOpenChange={setCancelOpen} />
    </div>
  );
}

