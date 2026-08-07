"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LockOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { reopenDossierAction, initialDossierActionState } from "@/lib/actions/dossiers";

export function ReopenDossierButton({ dossierId }: { dossierId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    // AlertDialogAction is Dialog.Close under the hood — the dialog is
    // already gone once this resolves, so feedback is a toast, not an
    // inline message inside the (now unmounted) dialog.
    const reasonAtSubmit = reason;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("dossierId", dossierId);
      formData.set("reason", reasonAtSubmit);
      const result = await reopenDossierAction(initialDossierActionState, formData);

      if (result.status === "success") {
        setReason("");
        toast.success("Dossier rouvert.");
        router.refresh();
      } else {
        toast.error(result.message ?? "Une erreur est survenue.");
      }
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <LockOpen className="size-4" aria-hidden />
          Rouvrir le dossier
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Rouvrir ce dossier ?</AlertDialogTitle>
          <AlertDialogDescription>
            Un motif est obligatoire — il sera enregistré dans l&apos;historique du dossier.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-1.5 text-left">
          <Label htmlFor="reason">Motif de réouverture</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            required
            placeholder="Ex. Erreur de saisie, à corriger."
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel type="button">Annuler</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            disabled={isPending || reason.trim().length === 0}
            onClick={handleConfirm}
          >
            Rouvrir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
