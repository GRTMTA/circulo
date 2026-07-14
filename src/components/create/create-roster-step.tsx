"use client";

import { useState } from "react";
import { Trash2, Loader2, Plus, CheckCircle2, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { CreateRosterMember } from "@/lib/create/types";
import { isValidStellarPublicKey, validateRosterEntry } from "@/lib/create/validation";
import { resolveUserByUsernameAction, resolveUserByWalletAction } from "@/app/dashboard/actions";

interface ResolvedUser {
  displayName: string;
  username: string | null;
  walletAddress: string;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

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
  const [resolvedUser, setResolvedUser] = useState<ResolvedUser | null>(null);
  const [entryErrors, setEntryErrors] = useState<Record<string, string>>({});
  const [resolving, setResolving] = useState(false);

  const rosterFull = members.length >= memberCount;
  const walletLocked = resolvedUser?.walletAddress
    ? walletAddress.trim().toUpperCase() === resolvedUser.walletAddress.toUpperCase()
    : false;

  function resetEntry() {
    setUserId("");
    setWalletAddress("");
    setResolvedUser(null);
    setEntryErrors({});
  }

  // Resolve the User ID when the field loses focus.
  async function handleUserIdBlur() {
    const cleanId = userId.trim().replace(/^@/, "");
    if (!cleanId) {
      setEntryErrors((prev) => ({ ...prev, userId: "" }));
      return;
    }

    if (!/^\d{6}$/.test(cleanId)) {
      setResolvedUser(null);
      setEntryErrors((prev) => ({ ...prev, userId: "User ID must be a 6-digit number." }));
      return;
    }

    setResolving(true);
    try {
      const res = await resolveUserByUsernameAction(cleanId);
      if (res.success && res.walletAddress) {
        setResolvedUser({
          displayName: res.displayName || cleanId,
          username: cleanId,
          walletAddress: res.walletAddress,
        });
        setWalletAddress(res.walletAddress);
        setEntryErrors({});
      } else if (res.success && !res.walletAddress) {
        setResolvedUser(null);
        setEntryErrors({ userId: "That user hasn't connected a wallet yet, so they can't be added." });
      } else {
        setResolvedUser(null);
        setEntryErrors({ userId: res.error || "No user found with that ID." });
      }
    } catch {
      setResolvedUser(null);
      setEntryErrors({ userId: "Couldn't verify that User ID. Try again." });
    } finally {
      setResolving(false);
    }
  }

  // Validate the wallet address (and try to resolve a name) on blur.
  async function handleWalletBlur() {
    const cleanWallet = walletAddress.trim().toUpperCase();
    if (!cleanWallet) {
      setEntryErrors((prev) => ({ ...prev, walletAddress: "" }));
      return;
    }

    if (!isValidStellarPublicKey(cleanWallet)) {
      setEntryErrors((prev) => ({
        ...prev,
        walletAddress: "Enter a valid Stellar address (starts with G, 56 characters).",
      }));
      return;
    }

    setEntryErrors((prev) => ({ ...prev, walletAddress: "" }));

    // If a User ID already resolved this wallet, keep that profile card.
    if (resolvedUser && resolvedUser.walletAddress.toUpperCase() === cleanWallet) {
      return;
    }

    // Otherwise attempt a courtesy lookup so we can show who owns this wallet.
    setResolving(true);
    try {
      const res = await resolveUserByWalletAction(cleanWallet);
      if (res.success) {
        setResolvedUser({
          displayName: res.displayName || "Registered member",
          username: res.username ?? null,
          walletAddress: cleanWallet,
        });
        if (res.username) setUserId(res.username);
      } else {
        setResolvedUser(null);
      }
    } catch {
      setResolvedUser(null);
    } finally {
      setResolving(false);
    }
  }

  function handleUserIdChange(value: string) {
    setUserId(value);
    setResolvedUser(null);
    setEntryErrors((prev) => ({ ...prev, userId: "" }));
  }

  function handleWalletChange(value: string) {
    setWalletAddress(value);
    if (resolvedUser) setResolvedUser(null);
    setEntryErrors((prev) => ({ ...prev, walletAddress: "" }));
  }

  const walletValid = isValidStellarPublicKey(walletAddress.trim().toUpperCase());
  const userIdClean = userId.trim().replace(/^@/, "");
  const userIdBlocks = userIdClean.length > 0 && !resolvedUser;
  const canAdd =
    !resolving &&
    !rosterFull &&
    walletValid &&
    !userIdBlocks &&
    !entryErrors.userId &&
    !entryErrors.walletAddress;

  function handleAdd() {
    const cleanWallet = walletAddress.trim().toUpperCase();

    if (rosterFull) {
      setEntryErrors({ walletAddress: `This circle is limited to ${memberCount} members.` });
      return;
    }

    const displayName =
      resolvedUser?.displayName ||
      `${cleanWallet.slice(0, 6)}...${cleanWallet.slice(-4)}`;

    const fieldErrors = validateRosterEntry(displayName, cleanWallet, members);
    if (Object.keys(fieldErrors).length > 0) {
      setEntryErrors(fieldErrors);
      return;
    }

    onAddMember({ displayName, walletAddress: cleanWallet });
    resetEntry();
  }

  return (
    <div className="grid gap-6">
      {/* Roster Capacity Badge */}
      <div className="flex items-center justify-between gap-3 bg-[var(--color-background-muted)]/30 border border-[var(--color-border-muted)] px-4 py-2.5 rounded-xl">
        <span className="text-xs font-semibold text-muted-foreground">
          Invite up to {memberCount} — you can add more later
        </span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
          members.length >= memberCount
            ? "bg-green-500/10 text-green-500 border-green-500/20"
            : "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
        }`}>
          {members.length} / {memberCount} Members
        </span>
      </div>

      <div className="rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-background-default)] p-5">
        <p className="text-sm text-muted-foreground mb-4">
          Add each member by their <strong>wallet address</strong>. If they already have a
          Circulo account, enter their <strong>User ID</strong> to fill in their details
          automatically.
        </p>

        <div className="grid gap-4 md:grid-cols-2 md:items-start">
          {/* User ID Field (optional lookup) */}
          <Field>
            <FieldLabel htmlFor="member-id">User ID</FieldLabel>
            <Input
              id="member-id"
              value={userId}
              onChange={(event) => handleUserIdChange(event.target.value)}
              onBlur={handleUserIdBlur}
              placeholder="e.g. 192083"
              aria-invalid={!!entryErrors.userId}
            />
            <FieldDescription>Optional. Looks up a registered member.</FieldDescription>
            {entryErrors.userId ? <FieldError>{entryErrors.userId}</FieldError> : null}
          </Field>

          {/* Wallet Address Field (required) */}
          <Field>
            <FieldLabel htmlFor="member-wallet" required>Wallet Address</FieldLabel>
            <Input
              id="member-wallet"
              value={walletAddress}
              onChange={(event) => handleWalletChange(event.target.value)}
              onBlur={handleWalletBlur}
              placeholder="Starts with G..."
              readOnly={walletLocked}
              aria-invalid={!!entryErrors.walletAddress}
              className={walletLocked ? "bg-[var(--color-background-muted)]/40" : undefined}
            />
            <FieldDescription>
              {walletLocked ? "Filled from the resolved User ID." : "Required. 56-character Stellar address."}
            </FieldDescription>
            {entryErrors.walletAddress ? <FieldError>{entryErrors.walletAddress}</FieldError> : null}
          </Field>
        </div>

        {/* Resolution feedback */}
        {resolving && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground bg-[var(--color-background-muted)]/20 p-3 rounded-xl border border-[var(--color-border-muted)]">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span>Resolving user details...</span>
          </div>
        )}

        {!resolving && resolvedUser && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/5 p-3 animate-in fade-in duration-200">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-sm font-bold text-indigo-500">
              {getInitials(resolvedUser.displayName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 shrink-0 text-green-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-green-600">Verified member</span>
              </div>
              <p className="truncate font-semibold text-[var(--color-text-default)]">{resolvedUser.displayName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {resolvedUser.username ? `User ID ${resolvedUser.username} · ` : ""}
                {resolvedUser.walletAddress.slice(0, 6)}...{resolvedUser.walletAddress.slice(-4)}
              </p>
            </div>
          </div>
        )}

        {/* Add Button */}
        <div className="mt-5 flex justify-end">
          <Button
            type="button"
            onClick={handleAdd}
            disabled={!canAdd}
            className="font-semibold h-11"
          >
            {resolving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
            Add Participant
          </Button>
        </div>
      </div>

      {errors.roster && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-600">
          <UserRound className="size-4 shrink-0" />
          <span>{errors.roster}</span>
        </div>
      )}
      {errors.duplicates && (
        <div className="flex items-center gap-2 rounded-xl border border-[var(--color-error-default)]/20 bg-[var(--color-error-default)]/5 p-4 text-sm text-[var(--color-error-default)]">
          <Trash2 className="size-4 shrink-0" />
          <span>{errors.duplicates}</span>
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
                  No participants added yet. You&apos;re added automatically as creator — invite others now or after the circle is created.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
