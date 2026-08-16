"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getOnboardingSteps } from "@/components/onboarding/onboarding-steps";
import type { UserRole } from "@/types/database";

const STORAGE_KEY = "dossiers-qr:tour-dismissed-v1";
const OPEN_EVENT = "dossiers-qr:open-tour";

/** Fired by the "Revoir le tutoriel" button on /aide — decoupled via a
 * window event rather than context, since OnboardingTour is mounted once
 * in the (app) layout and the trigger can live on any page. */
export function openOnboardingTour() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/**
 * Mounted once in the (app) layout. Auto-opens on a user's first
 * authenticated page view (dismissal is remembered in localStorage, so it
 * never nags again), and can be replayed anytime via openOnboardingTour().
 * A small step dialog rather than an on-page spotlight tour — simpler to
 * keep accessible (Radix Dialog already gives focus trap, Escape-to-close
 * and aria labelling for free) and it doesn't depend on every target
 * element existing on the current screen.
 */
export function OnboardingTour({ role, firstName }: { role: UserRole; firstName: string }) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const steps = getOnboardingSteps(role, firstName);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      // localStorage unavailable (private browsing, disabled storage) — fail open, just don't persist.
    }
    if (dismissed) return;

    const timer = window.setTimeout(() => {
      setStepIndex(0);
      setOpen(true);
    }, 600);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    function handleOpenRequest() {
      setStepIndex(0);
      setOpen(true);
    }
    window.addEventListener(OPEN_EVENT, handleOpenRequest);
    return () => window.removeEventListener(OPEN_EVENT, handleOpenRequest);
  }, []);

  const dismiss = useCallback(() => {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Ignore — worst case the tour reappears next visit, harmless.
    }
  }, []);

  const step = steps[stepIndex];
  if (!step) return null;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;
  const Icon = step.icon;

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : dismiss())}>
      <DialogContent
        className="sm:max-w-sm"
        aria-describedby="onboarding-tour-description"
      >
        <DialogHeader>
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="size-6" aria-hidden />
          </div>
          <DialogTitle className="text-center">{step.title}</DialogTitle>
          <DialogDescription id="onboarding-tour-description" className="text-center">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-1.5">
          {steps.map((s, i) => (
            <span
              key={s.title}
              aria-hidden
              className={cn("size-1.5 rounded-full transition-colors", i === stepIndex ? "bg-primary" : "bg-muted")}
            />
          ))}
        </div>
        <p className="sr-only" aria-live="polite">
          Étape {stepIndex + 1} sur {steps.length}
        </p>

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={dismiss}>
            Passer
          </Button>
          <div className="flex gap-2">
            {!isFirst ? (
              <Button type="button" variant="outline" size="sm" onClick={() => setStepIndex((i) => i - 1)}>
                Précédent
              </Button>
            ) : null}
            <Button type="button" size="sm" onClick={() => (isLast ? dismiss() : setStepIndex((i) => i + 1))}>
              {isLast ? "Terminer" : "Suivant"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
