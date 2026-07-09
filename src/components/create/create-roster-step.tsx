"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { CreateRosterMember } from "@/lib/mocks";

export function CreateRosterStep({
  members,
  memberCount,
  onAddMember,
  onRemoveMember,
}: {
  members: CreateRosterMember[];
  memberCount: number;
  onAddMember: (member: CreateRosterMember) => void;
  onRemoveMember: (index: number) => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-[1fr_1.4fr_auto] md:items-end">
        <Field>
          <FieldLabel htmlFor="member-name">Display name</FieldLabel>
          <Input id="member-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="member-wallet">Wallet address</FieldLabel>
          <Input id="member-wallet" value={walletAddress} onChange={(event) => setWalletAddress(event.target.value)} />
          <FieldDescription>Wallet roster locks before activation.</FieldDescription>
        </Field>
        <Button
          type="button"
          onClick={() => {
            if (!displayName || !walletAddress) return;
            onAddMember({ displayName, walletAddress });
            setDisplayName("");
            setWalletAddress("");
          }}
        >
          <Plus className="size-4" />
          Add
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Roster</h3>
        <Badge variant={members.length >= memberCount ? "default" : "secondary"}>
          {members.length} / {memberCount}
        </Badge>
      </div>
      <div className="grid gap-2">
        {members.map((member, index) => (
          <div key={`${member.walletAddress}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white p-3">
            <div className="min-w-0">
              <p className="font-semibold">{member.displayName}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">{member.walletAddress}</p>
            </div>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => onRemoveMember(index)} aria-label={`Remove ${member.displayName}`}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

