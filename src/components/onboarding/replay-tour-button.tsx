"use client";

import { PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openOnboardingTour } from "@/components/onboarding/onboarding-tour";

export function ReplayTourButton() {
  return (
    <Button type="button" onClick={openOnboardingTour}>
      <PlayCircle className="size-4" aria-hidden />
      Revoir le tutoriel
    </Button>
  );
}
