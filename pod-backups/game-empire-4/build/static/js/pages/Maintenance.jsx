import React from "react";
import { useSite } from "../lib/site";

export default function Maintenance() {
  const { settings } = useSite();
  return (
    <div className="min-h-screen bg-cyber grid place-items-center p-4 relative" data-testid="maintenance-screen">
      <div className="relative z-10 glass-strong p-8 max-w-lg text-center">
        <div className="text-mono text-xs text-[var(--accent)] mb-2">// SYSTEM MAINTENANCE IN PROGRESS</div>
        <div className="text-display text-3xl font-black mb-3 neon-text">الموقع متوقف مؤقتاً للصيانة</div>
        <div className="text-sm text-[var(--text-secondary)]">{settings?.maintenance_message || "نعمل على تحسينات. يرجى المحاولة لاحقاً."}</div>
      </div>
    </div>
  );
}
