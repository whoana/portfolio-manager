"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useHelp } from "./HelpProvider";
import type { HelpStep } from "@/app/lib/helpSteps";

interface BalloonTooltipProps {
  steps: HelpStep[];
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export default function BalloonTooltip({ steps }: BalloonTooltipProps) {
  const { helpEnabled, currentStep, nextStep, skipGuide, setActivePageStepCount } = useHelp();
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    setActivePageStepCount(steps.length);
  }, [steps.length, setActivePageStepCount]);

  const measure = useCallback(() => {
    if (!helpEnabled || currentStep >= steps.length) {
      setTargetRect(null);
      return;
    }
    const step = steps[currentStep];
    const el = document.querySelector(`[data-help-step="${step.targetAttr}"]`);
    if (!el) {
      setTargetRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setTargetRect({
      top: r.top + window.scrollY,
      left: r.left + window.scrollX,
      width: r.width,
      height: r.height,
    });
  }, [helpEnabled, currentStep, steps]);

  useEffect(() => {
    if (!helpEnabled) return;

    measure();

    const onUpdate = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measure);
    };

    window.addEventListener("scroll", onUpdate, true);
    window.addEventListener("resize", onUpdate);

    return () => {
      window.removeEventListener("scroll", onUpdate, true);
      window.removeEventListener("resize", onUpdate);
      cancelAnimationFrame(rafRef.current);
    };
  }, [helpEnabled, measure]);

  // Scroll target into view
  useEffect(() => {
    if (!helpEnabled || currentStep >= steps.length) return;
    const step = steps[currentStep];
    const el = document.querySelector(`[data-help-step="${step.targetAttr}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // Remeasure after scroll settles
      const timer = setTimeout(measure, 400);
      return () => clearTimeout(timer);
    }
  }, [helpEnabled, currentStep, steps, measure]);

  if (!helpEnabled || currentStep >= steps.length || !targetRect) {
    return null;
  }

  const step = steps[currentStep];
  const padding = 8;

  // Spotlight cutout position (viewport-relative for fixed positioning)
  const spotlightStyle: React.CSSProperties = {
    position: "fixed",
    top: targetRect.top - window.scrollY - padding,
    left: targetRect.left - window.scrollX - padding,
    width: targetRect.width + padding * 2,
    height: targetRect.height + padding * 2,
    borderRadius: 12,
    pointerEvents: "none",
  };

  // Balloon position
  const balloonWidth = 300;
  let balloonTop: number;
  let balloonLeft = targetRect.left - window.scrollX + targetRect.width / 2 - balloonWidth / 2;

  // Clamp horizontal
  if (balloonLeft < 12) balloonLeft = 12;
  if (balloonLeft + balloonWidth > window.innerWidth - 12) {
    balloonLeft = window.innerWidth - balloonWidth - 12;
  }

  const arrowClass = step.position === "bottom" ? "balloon-arrow-top" : "balloon-arrow-bottom";

  if (step.position === "bottom") {
    balloonTop = targetRect.top - window.scrollY + targetRect.height + padding + 12;
  } else {
    balloonTop = targetRect.top - window.scrollY - padding - 12;
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[60]"
        onClick={skipGuide}
        style={{ background: "transparent" }}
      />

      {/* Spotlight cutout */}
      <div className="help-spotlight z-[60] pointer-events-none" style={spotlightStyle} />

      {/* Balloon */}
      <div
        className={`fixed z-[61] ${arrowClass}`}
        style={{
          top: step.position === "bottom" ? balloonTop : undefined,
          bottom: step.position === "top" ? window.innerHeight - balloonTop : undefined,
          left: balloonLeft,
          width: balloonWidth,
        }}
      >
        <div className="bg-card-bg border border-card-border rounded-xl shadow-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-bold text-foreground">{step.title}</h3>
            <span className="text-xs text-muted ml-2 whitespace-nowrap">
              {currentStep + 1}/{steps.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            {step.description}
          </p>
          <div className="flex items-center justify-between">
            <button
              onClick={skipGuide}
              className="text-xs text-muted hover:text-muted-foreground transition-colors"
            >
              건너뛰기
            </button>
            <button
              onClick={nextStep}
              className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-fg rounded-lg hover:bg-primary/90 transition-colors"
            >
              {currentStep === steps.length - 1 ? "완료" : "다음"}
            </button>
          </div>
        </div>
      </div>

      {/* Finger emoji for showFinger steps */}
      {step.showFinger && (
        <div
          className="fixed z-[61] animate-finger-bounce pointer-events-none text-2xl"
          style={{
            top: targetRect.top - window.scrollY - 32,
            left: targetRect.left - window.scrollX + targetRect.width / 2 - 12,
          }}
        >
          👆
        </div>
      )}
    </>
  );
}
