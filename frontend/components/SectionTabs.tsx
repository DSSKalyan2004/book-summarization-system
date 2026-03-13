import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Lightbulb, Table2, GitBranch } from "lucide-react";

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
  content: React.ReactNode;
}

interface Props {
  tabs: Tab[];
}

const SectionTabs: React.FC<Props> = ({ tabs }) => {
  const prefersReducedMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<string | null>(tabs[0]?.id ?? null);

  useEffect(() => {
    if (!tabs.length) {
      setActiveTab(null);
      return;
    }

    if (!activeTab || !tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [activeTab, tabs]);

  const activeData = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  if (!activeData) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div
        className="rounded-[28px] p-3 md:p-4"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.98) 100%)",
          border: "1px solid rgba(226,232,240,0.9)",
          boxShadow: "0 22px 48px rgba(15,23,42,0.08)",
        }}
      >
        <div className="flex flex-wrap gap-3">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <motion.button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                whileHover={prefersReducedMotion ? undefined : { y: -2, scale: 1.01 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex min-w-[180px] flex-1 items-center gap-3 overflow-hidden rounded-2xl px-4 py-3.5 text-left"
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${tab.gradientFrom}, ${tab.gradientTo})`
                    : `linear-gradient(135deg, ${tab.accentColor}10, rgba(255,255,255,0.98))`,
                  color: isActive ? "#ffffff" : "#0f172a",
                  border: isActive ? "1px solid transparent" : `1px solid ${tab.accentColor}24`,
                  boxShadow: isActive
                    ? `0 18px 34px ${tab.accentColor}30`
                    : "0 10px 22px rgba(15,23,42,0.06)",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: isActive
                      ? "linear-gradient(120deg, rgba(255,255,255,0.18), transparent 45%, rgba(255,255,255,0.08))"
                      : `radial-gradient(circle at top right, ${tab.accentColor}14, transparent 55%)`,
                    pointerEvents: "none",
                  }}
                />
                <span
                  className="relative flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{
                    background: isActive ? "rgba(255,255,255,0.18)" : `${tab.accentColor}18`,
                    color: isActive ? "#ffffff" : tab.accentColor,
                    boxShadow: isActive ? "inset 0 1px 0 rgba(255,255,255,0.16)" : "none",
                  }}
                >
                  {tab.icon}
                </span>
                <span className="relative flex-1">
                  <span className="block text-sm font-semibold" style={{ letterSpacing: "-0.01em" }}>
                    {tab.label}
                  </span>
                  <span
                    className="block text-[11px] font-medium uppercase tracking-[0.14em]"
                    style={{ color: isActive ? "rgba(255,255,255,0.78)" : `${tab.accentColor}CC` }}
                  >
                    {isActive ? "Current view" : "Open panel"}
                  </span>
                </span>
                <span
                  className="relative flex h-8 w-8 items-center justify-center rounded-full"
                  style={{
                    background: isActive ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.9)",
                    color: isActive ? "#ffffff" : tab.accentColor,
                    fontSize: "14px",
                    fontWeight: 800,
                  }}
                >
                  {isActive ? "•" : "+"}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeData.id}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.985 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[30px]"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)",
            border: `1px solid ${activeData.accentColor}20`,
            boxShadow: "0 26px 60px rgba(15,23,42,0.08)",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(circle at top right, ${activeData.accentColor}16, transparent 38%), radial-gradient(circle at bottom left, ${activeData.gradientTo}12, transparent 32%)`,
              pointerEvents: "none",
            }}
          />
          <div className="relative border-b border-slate-200/70 px-6 py-5 md:px-8">
            <div className="flex flex-wrap items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{
                  background: `linear-gradient(135deg, ${activeData.gradientFrom}, ${activeData.gradientTo})`,
                  color: "#ffffff",
                  boxShadow: `0 14px 26px ${activeData.accentColor}26`,
                }}
              >
                {activeData.icon}
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: activeData.accentColor }}>
                  Summary view
                </p>
                <h3 className="text-xl font-semibold text-slate-900">{activeData.label}</h3>
              </div>
            </div>
          </div>
          <div className="relative px-4 py-4 md:px-6 md:py-6">{activeData.content}</div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SectionTabs;
export { Lightbulb, Table2, GitBranch };
