import React, { useState, useRef, useEffect } from "react";
import { Lightbulb, Table2, GitBranch, X } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current && activeTab) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [activeTab]);

  const activeData = tabs.find((t) => t.id === activeTab);

  return (
    <div>
      {/* Button bar */}
      <div className="flex gap-3 flex-wrap">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(isActive ? null : tab.id)}
              className="flex items-center gap-2.5 px-5 py-3 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: isActive
                  ? `linear-gradient(135deg, ${tab.gradientFrom}, ${tab.gradientTo})`
                  : "#ffffff",
                color: isActive ? "#ffffff" : tab.accentColor,
                border: isActive ? "1.5px solid transparent" : `1.5px solid ${tab.accentColor}30`,
                boxShadow: isActive
                  ? `0 4px 16px ${tab.accentColor}35`
                  : "0 2px 8px rgba(11,60,93,0.06)",
                transform: isActive ? "translateY(-1px)" : "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  const btn = e.currentTarget;
                  btn.style.borderColor = `${tab.accentColor}60`;
                  btn.style.boxShadow = `0 4px 14px ${tab.accentColor}20`;
                  btn.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  const btn = e.currentTarget;
                  btn.style.borderColor = `${tab.accentColor}30`;
                  btn.style.boxShadow = "0 2px 8px rgba(11,60,93,0.06)";
                  btn.style.transform = "none";
                }
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {isActive && <X size={14} style={{ marginLeft: "2px", opacity: 0.8 }} />}
            </button>
          );
        })}
      </div>

      {/* Content panel */}
      <div
        style={{
          maxHeight: activeTab ? `${height + 40}px` : "0px",
          opacity: activeTab ? 1 : 0,
          overflow: "hidden",
          transition:
            "max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease",
        }}
      >
        {activeData && (
          <div ref={contentRef} className="pt-6">
            {activeData.content}
          </div>
        )}
      </div>
    </div>
  );
};

export default SectionTabs;
export { Lightbulb, Table2, GitBranch };
