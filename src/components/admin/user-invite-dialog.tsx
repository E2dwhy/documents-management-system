"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, UserPlus, Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** 8+ random alphanumeric chars — meets the 8-char minimum, easy enough to
 * read aloud/copy when handing it to someone directly. */
function generatePassword(): string {
  return Math.random().toString(36).slice(2, 10);
}
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useFormAction } from "@/hooks/use-form-action";
import { inviteUserAction } from "@/lib/actions/users";
import { initialUserFormState } from "@/lib/actions/users-state";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { Service } from "@/lib/data/reference-data";

export function UserInviteDialog({ services }: { services: Service[] }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const { state, isPending, submit } = useFormAction(inviteUserAction, initialUserFormState, (result) => {
    setOpen(false);
    setPassword("");
    toast.success(result.message ?? "Compte créé.", { duration: 15000 });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="size-4" aria-hidden />
          Inviter
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inviter un utilisateur</DialogTitle>
          <DialogDescription>
            Un email lui sera envoyé pour définir son mot de passe.
          </DialogDescription>
        </DialogHeader>
        <form action={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Nom complet</Label>
            <Input id="fullName" name="fullName" required maxLength={150} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="role">Rôle</Label>
              <Select name="role" defaultValue="agent" required>
                <SelectTrigger id="role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="serviceId">Service</Label>
              <Select name="serviceId">
                <SelectTrigger id="serviceId" className="w-full">
                  <SelectValue placeholder="Aucun" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Mot de passe initial (optionnel)</Label>
            <div className="flex gap-2">
              <Input
                id="password"
                name="password"
                minLength={8}
                placeholder="Laisser vide pour envoyer un lien par email"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button type="button" variant="outline" size="icon" onClick={() => setPassword(generatePassword())}>
                <Dices className="size-4" aria-hidden />
                <span className="sr-only">Générer un mot de passe</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Rend le compte utilisable tout de suite, sans dépendre de l&apos;email — pratique pour
              tester ou simuler un circuit sans attendre. À communiquer vous-même à la personne.
            </p>
          </div>

          {state.status === "error" && state.message ? (
            <p role="alert" className="text-sm text-destructive">
              {state.message}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Inviter
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
