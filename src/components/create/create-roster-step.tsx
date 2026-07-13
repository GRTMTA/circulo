"use client";

import { useState } from "react";
import { Trash2, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { CreateRosterMember } from "@/lib/mocks";
import { validateRosterEntry } from "@/lib/create/validation";
import { resolveUserByUsernameAction, resolveUserByWalletAction } from "@/app/dashboard/actions";

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
  const [userId, setUserId] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [resolvedName, setResolvedName] = useState("");
  const [entryErrors, setEntryErrors] = useState<Record<string, string>>({});
  const [resolving, setResolving] = useState(false);

  async function handleUserIdChange(value: string) {
    setUserId(value);
    setEntryErrors({});
    
    const cleanVal = value.trim();
    if (!cleanVal) {
      setWalletAddress("");
      setResolvedName("");
      return;
    }

    const isNumericId = /^\d{6}$/.test(cleanVal.replace(/^@/, ""));
    if (isNumericId) {
      setResolving(true);
      try {
        const res = await resolveUserByUsernameAction(cleanVal);
        if (res.success) {
          setResolvedName(res.displayName || "");
          setWalletAddress(res.walletAddress || "");
        } else {
          setEntryErrors({ userId: "User ID not found." });
          setResolvedName("");
          setWalletAddress("");
        }
      } catch {
        setEntryErrors({ userId: "Error resolving User ID." });
      } finally {
        setResolving(false);
      }
    } else {
      setResolvedName("");
      setWalletAddress("");
    }
  }

  async function handleWalletChange(value: string) {
    setWalletAddress(value);
    setEntryErrors({});
    
    const cleanVal = value.trim();
    if (!cleanVal) {
      setUserId("");
      setResolvedName("");
      return;
    }

    const isStellar = cleanVal.toUpperCase().startsWith("G") && cleanVal.length === 56;
    if (isStellar) {
      setResolving(true);
      try {
        const res = await resolveUserByWalletAction(cleanVal);
        if (res.success) {
          setResolvedName(res.displayName || "");
          setUserId(res.username || "");
        } else {
          setUserId("");
          setResolvedName("");
        }
      } catch {
        setUserId("");
        setResolvedName("");
      } finally {
        setResolving(false);
      }
    } else {
      setUserId("");
      setResolvedName("");
    }
  }

  async function handleAdd() {
    const cleanId = userId.trim();
    const cleanWallet = walletAddress.trim();

    if (members.length >= memberCount) {
      setEntryErrors({ walletAddress: `Cannot add more than ${memberCount} members (configured limit).` });
      return;
    }

    if (!cleanWallet) {
      setEntryErrors({ walletAddress: "Wallet address is required." });
      return;
    }

    const isStellarAddress = cleanWallet.toUpperCase().startsWith("G") && cleanWallet.length === 56;
    if (!isStellarAddress) {
      setEntryErrors({ walletAddress: "Please enter a valid 56-character Stellar wallet address." });
      return;
    }

    if (cleanId && !/^\d{6}$/.test(cleanId.replace(/^@/, ""))) {
      setEntryErrors({ userId: "User ID must be a 6-digit number." });
      return;
    }

    const targetWallet = cleanWallet.toUpperCase();
    const targetName = resolvedName || `${targetWallet.slice(0, 6)}...${targetWallet.slice(-4)}`;

    const fieldErrors = validateRosterEntry(targetName, targetWallet, members);
    setEntryErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    onAddMember({ displayName: targetName, walletAddress: targetWallet });
    
    setUserId("");
    setWalletAddress("");
    setResolvedName("");
    setEntryErrors({});
  }

  return (
    <div className="grid gap-6">
      {/* Roster Capacity Badge */}
      <div className="flex items-center justify-between bg-[var(--color-background-muted)]/30 border border-[var(--color-border-muted)] px-4 py-2.5 rounded-xl">
        <span className="text-xs font-semibold text-muted-foreground">Roster Size limit</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
          members.length === memberCount 
            ? "bg-green-500/10 text-green-500 border-green-500/20" 
            : "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
        }`}>
          {members.length} / {memberCount} Members
        </span>
      </div>

      {/* Two Input Fields */}
      <div className="grid gap-4 md:grid-cols-2 md:items-start">
        {/* User ID Field */}
        <Field>
          <FieldLabel htmlFor="member-id">User ID (Optional)</FieldLabel>
          <Input
            id="member-id"
            value={userId}
            onChange={(event) => handleUserIdChange(event.target.value)}
            placeholder="e.g. 192083"
            aria-invalid={!!entryErrors.userId}
          />
          <FieldDescription>Automatically resolves name and wallet address.</FieldDescription>
          {entryErrors.userId ? (
            <FieldError>{entryErrors.userId}</FieldError>
          ) : null}
        </Field>

        {/* Wallet Address Field */}
        <Field>
          <FieldLabel htmlFor="member-wallet">Wallet Address</FieldLabel>
          <Input
            id="member-wallet"
            value={walletAddress}
            onChange={(event) => handleWalletChange(event.target.value)}
            placeholder="Starts with G..."
            aria-invalid={!!entryErrors.walletAddress}
          />
          <FieldDescription>Required. Resolves details if already registered.</FieldDescription>
          {entryErrors.walletAddress ? (
            <FieldError>{entryErrors.walletAddress}</FieldError>
          ) : null}
        </Field>
      </div>

      {resolving && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-[var(--color-background-muted)]/20 p-3 rounded-xl border border-[var(--color-border-muted)]">
          <Loader2 className="size-4 animate-spin text-primary" />
          <span>Resolving user details...</span>
        </div>
      )}

      {!resolving && resolvedName && (
        <div className="flex items-center justify-between rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-sm animate-in fade-in duration-200">
          <div>
            <span className="text-[10px] text-indigo-500/80 font-bold uppercase tracking-wider block">Resolved Name</span>
            <span className="font-semibold text-[var(--color-text-default)]">{resolvedName}</span>
          </div>
          {userId.trim() && (
            <span className="text-xs bg-indigo-500/10 text-indigo-500 font-semibold px-2 py-0.5 rounded border border-indigo-500/20">
              User ID: {userId.trim()}
            </span>
          )}
        </div>
      )}

      {/* Add Button */}
      <div className="flex justify-end border-b border-[var(--color-border-muted)] pb-5">
        <Button 
          type="button" 
          onClick={handleAdd} 
          disabled={resolving || (!userId.trim() && !walletAddress.trim()) || members.length >= memberCount} 
          className="font-semibold h-11"
        >
          {resolving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
          Add Participant
        </Button>
      </div>

      {errors.members && (
        <div className="flex items-center gap-2 rounded-xl border border-[var(--color-error-default)]/20 bg-[var(--color-error-default)]/5 p-4 text-sm text-[var(--color-error-default)]">
          <Trash2 className="size-4 shrink-0" />
          <span>{errors.members}</span>
        </div>
      )}

      <div className="rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-background-default)] overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-background-muted)]/50 border-b border-[var(--color-border-muted)]">
            <tr>
              <th className="px-4 py-3 font-semibold text-[var(--color-text-default)]">Member Name</th>
              <th className="px-4 py-3 font-semibold text-[var(--color-text-default)]">Wallet Address</th>
              <th className="px-4 py-3 font-semibold text-[var(--color-text-default)] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-muted)]">
            {members.map((member, index) => (
              <tr key={`${member.walletAddress}-${index}`} className="hover:bg-[var(--color-background-muted)]/20">
                <td className="px-4 py-3 font-medium text-[var(--color-text-default)]">{member.displayName}</td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                  {member.walletAddress.slice(0, 10)}...{member.walletAddress.slice(-8)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveMember(index)}
                    className="size-8 text-[var(--color-error-default)] hover:bg-[var(--color-error-muted)] hover:text-[var(--color-error-default)]"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                  No participants added yet. Add {memberCount} members (including yourself as creator) to proceed.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
