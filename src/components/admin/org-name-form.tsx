"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateOrgNameAction } from "@/lib/actions/settings";
import { initialSettingsFormState } from "@/lib/actions/settings-state";

export function OrgNameForm({ orgName }: { orgName: string }) {
  const [state, formAction, isPending] = useActionState(updateOrgNameAction, initialSettingsFormState);

  return (
    <form action={formAction} className="space-y-2">
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="orgName">Nom de l&apos;organisation</Label>
          <Input id="orgName" name="orgName" required maxLength={150} defaultValue={orgName} className="h-10" />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Enregistrer
        </Button>
      </div>
      {state.status === "error" && state.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
