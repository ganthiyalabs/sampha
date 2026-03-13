import * as React from "react";
import { SmartTaskInput } from "./smart-task-input";
import { Sparkles, ArrowRight } from "lucide-react";

const suggestions = [
  "Make my app responsive",
  "Create a landing page",
  "Get more leads",
  "Another long goal here",
];

export function AIChatPanel() {
  return (
    <div className="flex flex-col h-full min-h-0 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm">
      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 gap-6">
        {/* Logo / Icon */}
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl border border-border/50 bg-muted/30">
          <Sparkles className="w-7 h-7 text-muted-foreground/60" />
        </div>

        {/* Heading */}
        <h2 className="text-xl font-semibold text-foreground tracking-tight">
          What can I help with?
        </h2>

        {/* Suggestion Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-sm">
          {suggestions.map((s) => (
            <button
              key={s}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground rounded-full border border-border/50 bg-muted/20 hover:bg-muted/40 hover:text-foreground transition-colors cursor-default"
            >
              {s}
              <ArrowRight className="w-3 h-3 opacity-40" />
            </button>
          ))}
        </div>
      </div>

      {/* Smart Task Input at the bottom */}
      <div className="px-4 pb-4">
        <SmartTaskInput />
      </div>
    </div>
  );
}
