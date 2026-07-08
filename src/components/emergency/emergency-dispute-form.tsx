"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

export function EmergencyDisputeForm({ circleId }: { circleId: string }) {
  const [description, setDescription] = useState("");
  return (
    <div className="grid gap-4 rounded-xl border border-border bg-white p-4">
      <Field>
        <FieldLabel htmlFor={`dispute-${circleId}`}>Dispute description</FieldLabel>
        <Textarea id={`dispute-${circleId}`} value={description} onChange={(event) => setDescription(event.target.value)} />
      </Field>
      <Button onClick={() => toast.success("Your dispute has been raised. The pool creator will review it.")}>Submit Dispute</Button>
    </div>
  );
}

