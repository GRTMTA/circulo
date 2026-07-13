"use client";

import { useState } from "react";
import { AlertCircle, Plus, Trash2, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { InfoTip } from "@/components/ui/info-tip";
import { Input } from "@/components/ui/input";
import type { CreateRosterMember } from "@/lib/mocks";
import { validateRosterEntry } from "@/lib/create/validation";
import { resolveUserByUsernameAction } from "@/app/dashboard/actions";

export function CreateRosterStep({
  members,
  memberCount,
  onAddMember,
  onRemoveMember,
  errors = {},
}: {
  members: CreateRosterMember[];
  memberCount: number;
  onAddMember: (member: CreateRosterMember) => void;
  onRemoveMember: (index: number) => void;
  errors?: Record<string, string>;
}) {
  const [displayName, setDisplayName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [entryErrors, setEntryErrors] = useState<Record<string, string>>({});
  const [resolving, setResolving] = useState(false);

  async function handleAdd() {
    const cleanWallet = walletAddress.trim();
    const isStellarAddress = cleanWallet.toUpperCase().startsWith("G") && cleanWallet.length === 56;
    let resolvedWallet = isStellarAddress ? cleanWallet.toUpperCase() : cleanWallet;
    let resolvedName = displayName.trim();

    if (!isStellarAddress && cleanWallet.length > 0) {
      setResolving(true);
      try {
        const res = await resolveUserByUsernameAction(walletAddress);
        if (res.success) {
          resolvedWallet = res.walletAddress || "";
          if (!resolvedWallet) {
            setEntryErrors({ walletAddress: "This user has not connected a Stellar wallet yet." });
            setResolving(false);
            return;
          }
          resolvedName = res.displayName || resolvedName || walletAddress.replace(/^@/, "");
        } else {
          setEntryErrors({ walletAddress: "User ID not found." });
          setResolving(false);
          return;
        }
      } catch {
        setEntryErrors({ walletAddress: "Failed to resolve User ID." });
        setResolving(false);
        return;
      } finally {
        setResolving(false);
      }
    }

    const fieldErrors = validateRosterEntry(resolvedName, resolvedWallet, members);
    setEntryErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    onAddMember({ displayName: resolvedName, walletAddress: resolvedWallet });
    setDisplayName("");
    setWalletAddress("");
    setEntryErrors({});
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-[1fr_1.4fr_auto] md:items-start">
        <Field>
          <FieldLabel htmlFor="member-name">Display name</FieldLabel>
          <Input
            id="member-name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            aria-invalid={!!entryErrors.displayName}
          />
          {entryErrors.displayName ? (
            <FieldError>{entryErrors.displayName}</FieldError>
          ) : null}
        </Field>
        <Field>
          <div className="flex items-center gap-1.5">
            <FieldLabel htmlFor="member-wallet">Wallet address or User ID</FieldLabel>
            <InfoTip>Enter a Stellar public key starting with G (56 chars), or a unique 6-digit User ID (e.g. 192083) to invite them.</InfoTip>
          </div>
          <Input
            id="member-wallet"
            value={walletAddress}
            onChange={(event) => setWalletAddress(event.target.value.trim())}
            placeholder="GAAAABBB... or 192083"
            aria-invalid={!!entryErrors.walletAddress}
          />
          <FieldDescription>
            Roster locks before activation. 
            <span className="block mt-1 font-mono text-[10px] text-muted-foreground">
              Mock format: GAAAABBBCCCDDDEEEFFFGGGHHHIIIJJJKKKLLLMMMNNOOOPPPQQQRRR5
            </span>
          </FieldDescription>
          {entryErrors.walletAddress ? (
            <FieldError>{entryErrors.walletAddress}</FieldError>
          ) : null}
        </Field>
        <Button
          type="button"
          className="md:mt-7"
          disabled={members.length >= memberCount || resolving}
          onClick={handleAdd}
        >
          {resolving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Resolving...
            </>
          ) : (
            <>
              <Plus className="size-4" />
              Add
            </>
          )}
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Roster</h3>
        <Badge variant={members.length >= memberCount ? "default" : "secondary"}>
          {members.length} / {memberCount}
        </Badge>
      </div>

      {/* Step-level validation errors */}
      {errors.roster || errors.walletAddress || errors.duplicates ? (
        <div className="flex items-start gap-2 rounded-xl border border-[var(--color-error-default)]/20 bg-[var(--color-error-default)]/5 p-3 text-sm text-[var(--color-error-default)]">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div className="grid gap-1">
            {errors.roster ? <p>{errors.roster}</p> : null}
            {errors.walletAddress ? <p>{errors.walletAddress}</p> : null}
            {errors.duplicates ? <p>{errors.duplicates}</p> : null}
          </div>
        </div>
      ) : null}

      <div className="grid gap-2">
        {members.map((member, index) => (
          <div
            key={`${member.walletAddress}-${index}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white p-3"
          >
            <div className="min-w-0">
              <p className="font-semibold">{member.displayName}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {member.walletAddress}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onRemoveMember(index)}
              aria-label={`Remove ${member.displayName}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        {members.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No members added yet. Add the first member above.
          </p>
        ) : null}
      </div>
    </div>
  );
}
