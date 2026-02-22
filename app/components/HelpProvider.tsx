"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getHelpEnabled, saveHelpEnabled } from "@/app/lib/settingsStorage";

interface HelpContextValue {
  helpEnabled: boolean;
  setHelpEnabled: (v: boolean) => void;
  currentStep: number;
  nextStep: () => void;
  skipGuide: () => void;
  resetGuide: () => void;
  activeStepCount: number;
  setActivePageStepCount: (count: number) => void;
}

const HelpContext = createContext<HelpContextValue>({
  helpEnabled: true,
  setHelpEnabled: () => {},
  currentStep: 0,
  nextStep: () => {},
  skipGuide: () => {},
  resetGuide: () => {},
  activeStepCount: 0,
  setActivePageStepCount: () => {},
});

export function HelpProvider({ children }: { children: React.ReactNode }) {
  const [helpEnabled, setHelpEnabledState] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeStepCount, setActiveStepCount] = useState(0);

  useEffect(() => {
    setHelpEnabledState(getHelpEnabled());
  }, []);

  const setHelpEnabled = useCallback((v: boolean) => {
    setHelpEnabledState(v);
    saveHelpEnabled(v);
    if (v) {
      setCurrentStep(0);
    }
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      const next = prev + 1;
      if (next >= activeStepCount) {
        setHelpEnabledState(false);
        saveHelpEnabled(false);
        return 0;
      }
      return next;
    });
  }, [activeStepCount]);

  const skipGuide = useCallback(() => {
    setHelpEnabledState(false);
    saveHelpEnabled(false);
    setCurrentStep(0);
  }, []);

  const resetGuide = useCallback(() => {
    setCurrentStep(0);
  }, []);

  const setActivePageStepCount = useCallback((count: number) => {
    setActiveStepCount(count);
    setCurrentStep(0);
  }, []);

  return (
    <HelpContext.Provider
      value={{
        helpEnabled,
        setHelpEnabled,
        currentStep,
        nextStep,
        skipGuide,
        resetGuide,
        activeStepCount,
        setActivePageStepCount,
      }}
    >
      {children}
    </HelpContext.Provider>
  );
}

export function useHelp() {
  return useContext(HelpContext);
}
