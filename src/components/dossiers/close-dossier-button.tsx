"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { closeDossierAction, initialDossierActionState } from "@/lib/actions/dossiers";

export function CloseDossierButton({ dossierId }: { dossierId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    // AlertDialogAction is Dialog.Close under the hood, so the dialog is
    // already gone by the time this resolves — feedback goes through a
    // toast, not an inline error inside the (now unmounted) dialog.
    startTransition(async () => {
      const formData = new FormData();
      formData.set("dossierId", dossierId);
      const result = await closeDossierAction(initialDossierActionState, formData);

      if (result.status === "success") {
        toast.success("Dossier clôturé.");
        router.refresh();
      } else {
        toast.error(result.message ?? "Une erreur est survenue.");
      }
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="default" size="sm">
          <Lock className="size-4" aria-hidden />
          Clôturer le dossier
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clôturer ce dossier ?</AlertDialogTitle>
          <AlertDialogDescription>
            Le dossier sera verrouillé et ne pourra plus être scanné ni modifié. Cette action peut être
            annulée uniquement par un administrateur.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction type="button" disabled={isPending} onClick={handleConfirm}>
            Clôturer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
