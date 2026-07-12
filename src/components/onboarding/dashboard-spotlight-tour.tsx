"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { completeOnboarding } from "@/app/dashboard/actions";
import { SpotlightOverlay } from "@/components/onboarding/spotlight-overlay";
import { SpotlightTooltip } from "@/components/onboarding/spotlight-tooltip";

const CLIENT_STORAGE_KEY = "circulo_onboarding_done";

export interface SpotlightStep {
  /** data-onboarding attribute value to target */
  target: string;
  title: string;
  description: string;
  placement?: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: SpotlightStep[] = [
  {
    target: "create-circle",
    title: "Create a Circle",
    description:
      "Start a new savings circle. Set your roster, contribution, interval, and payout order.",
    placement: "bottom",
  },
  {
    target: "circle-cards",
    title: "Your Circles",
    description:
      "Each card shows status, contribution amount, and round progress. Tap to open.",
    placement: "bottom",
  },
  {
    target: "sidebar-nav",
    title: "Circle Navigation",
    description:
      "Hover the sidebar to expand it and quickly switch between all your circles.",
    placement: "right",
  },
  {
    target: "header-search",
    title: "Quick Search",
    description:
      "Find circles, members, or settings instantly. Keyboard shortcut: Ctrl+K.",
    placement: "bottom",
  },
  {
    target: "notifications",
    title: "Notifications",
    description:
      "Contribution reminders and payout alerts surface here so nothing slips by.",
    placement: "bottom",
  },
];

function getTargetElement(target: string): Element | null {
  return document.querySelector(`[data-onboarding="${target}"]`);
}

export function DashboardSpotlightTour() {
  const [step, setStep] = useState<number | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number>(0);
  const scrollLockedRef = useRef(false);
  const finishedRef = useRef(false);

  // Lock scroll while tour is active
  useEffect(() => {
    if (step === null) {
      if (scrollLockedRef.current) {
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
        scrollLockedRef.current = false;
      }
      return;
    }

    if (!scrollLockedRef.current) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      scrollLockedRef.current = true;
    }

    function preventScroll(e: Event) {
      e.preventDefault();
    }
    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("touchmove", preventScroll, { passive: false });

    return () => {
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
    };
  }, [step]);

  // Start the tour only if not already completed on this client
  useEffect(() => {
    // Client-side guard: if already marked done, don't start
    if (localStorage.getItem(CLIENT_STORAGE_KEY)) {
      return;
    }
    const timer = setTimeout(() => setStep(0), 400);
    return () => clearTimeout(timer);
  }, []);

  // Track the target element's position
  useEffect(() => {
    if (step === null || step >= TOUR_STEPS.length) {
      setTargetRect(null);
      return;
    }

    const currentStep = TOUR_STEPS[step];
    let cancelled = false;

    function tryFind(attempts: number) {
      if (cancelled) return;
      const el = getTargetElement(currentStep.target);

      if (!el) {
        if (attempts > 0) {
          setTimeout(() => tryFind(attempts - 1), 200);
          return;
        }
        // Element doesn't exist — skip this step
        setStep((prev) => (prev !== null ? prev + 1 : null));
        return;
      }

      startMeasuring(el);
    }

    function startMeasuring(el: Element) {
      function measure() {
        if (cancelled) return;
        const rect = el.getBoundingClientRect();
        const maxH = window.innerHeight * 0.55;
        const h = Math.min(rect.height, maxH);
        const clamped = new DOMRect(rect.left, rect.top, rect.width, h);
        setTargetRect(clamped);
        rafRef.current = requestAnimationFrame(measure);
      }

      setTimeout(measure, 80);
    }

    setTimeout(() => tryFind(3), 80);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, [step]);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    setStep(null);
    setTargetRect(null);

    // Mark done on client immediately so it won't restart on re-render
    localStorage.setItem(CLIENT_STORAGE_KEY, "1");

    // Persist to DB so it never shows on any device/browser
    completeOnboarding();
  }, []);

  const handleNext = useCallback(() => {
    if (step === null) return;
    if (step >= TOUR_STEPS.length - 1) {
      finish();
    } else {
      setStep(step + 1);
    }
  }, [step, finish]);

  const handleSkip = useCallback(() => {
    finish();
  }, [finish]);

  if (step === null || step >= TOUR_STEPS.length) return null;

  const currentStep = TOUR_STEPS[step];

  return (
    <>
      <SpotlightOverlay targetRect={targetRect} />
      <SpotlightTooltip
        targetRect={targetRect}
        step={step + 1}
        total={TOUR_STEPS.length}
        title={currentStep.title}
        description={currentStep.description}
        placement={currentStep.placement}
        onNext={handleNext}
        onSkip={handleSkip}
      />
    </>
  );
}
