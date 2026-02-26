"use client";

import { useState } from "react";
import { ThemeProvider } from "./ThemeProvider";
import { HelpProvider } from "./HelpProvider";
import SettingsBar from "./SettingsBar";
import DataTransferModal from "./DataTransferModal";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const [showDataTransfer, setShowDataTransfer] = useState(false);

  return (
    <ThemeProvider>
      <HelpProvider>
        <SettingsBar onDataTransfer={() => setShowDataTransfer(true)} />
        {children}
        {showDataTransfer && (
          <DataTransferModal onClose={() => setShowDataTransfer(false)} />
        )}
      </HelpProvider>
    </ThemeProvider>
  );
}
