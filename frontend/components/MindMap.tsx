import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { SummaryResult } from "../types";

interface Props {
  summary: SummaryResult;
}

interface MindBranch {
  id: string;
  title: string;
  color: string;
  x: number;
  y: number;
  lines: string[];
}

function clip(text: string, max = 120): string {
  if (!text) return "";
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3)}...`;
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 18);
}

function toSimple(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\b(additionally|furthermore|moreover|therefore|consequently|however|nevertheless)\b/gi, "")
    .replace(/\b(utilize|utilized|utilization)\b/gi, "use")
    .replace(/\b(implement|implemented|implementation)\b/gi, "apply")
    .replace(/\b(methodology)\b/gi, "method")
    .replace(/\b(significant)\b/gi, "important")
    .replace(/\b(approximately)\b/gi, "about")
    .replace(/\s+,/g, ",")
    .trim();
}

function extractKeywords(text: string, limit = 4): string[] {
  const stop = new Set([
    "this", "that", "with", "from", "have", "were", "their", "there", "which", "about", "will", "would",
    "into", "after", "before", "also", "more", "than", "such", "your", "through", "because", "using",
    "used", "does", "those", "these", "where", "when", "what", "while", "over", "under",
  ]);

  const words = (text.toLowerCase().match(/\b[a-z]{4,}\b/g) ?? []).filter((w) => !stop.has(w));
  const freq = new Map<string, number>();
  words.forEach((word) => freq.set(word, (freq.get(word) ?? 0) + 1));

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
}

function deriveBranches(summary: SummaryResult): MindBranch[] {
  const text = (summary.summaryParagraphs ?? []).join(" ");
  const sentences = splitSentences(text);
  const keywords = extractKeywords(summary.fullText || text);

  const s0 = toSimple(sentences[0] || summary.bulletPoints?.[0] || "Document text is read and prepared.");
  const s1 = toSimple(sentences[1] || summary.bulletPoints?.[1] || "Main ideas are detected from the document.");
  const s2 = toSimple(sentences[2] || summary.bulletPoints?.[2] || "Important details are selected and ranked.");
  const s3 = toSimple(sentences[3] || summary.bulletPoints?.[3] || "A short final summary is generated.");

  const overviewLines = [
    clip(`Source: ${summary.metadata.title || "Uploaded DOCX"}`),
    clip(s0),
    clip(`Words analyzed: ${summary.wordCount.toLocaleString()}`),
  ];

  const conceptLines = [
    clip(`Core concept: ${toSimple(summary.tableRows?.[0]?.concept || summary.bulletPoints?.[0] || "Main topic")}`),
    clip(`Support concept: ${toSimple(summary.tableRows?.[1]?.concept || summary.bulletPoints?.[1] || "Supporting point")}`),
    clip(`Keywords: ${keywords.join(", ") || "Concepts extracted from document"}`),
  ];

  const flowLines = [
    clip(`Step 1: ${s0}`),
    clip(`Step 2: ${s1}`),
    clip(`Step 3: ${s2}`),
  ];

  const outputLines = [
    clip(`Summary: ${s3}`),
    clip(`Key takeaway: ${toSimple(sentences[4] || summary.bulletPoints?.[4] || "Final output is concise and meaningful.")}`),
    clip(`Ready output blocks: ${summary.summaryParagraphs.length || 1}`),
  ];

  return [
    { id: "overview", title: "Overview", color: "#2563eb", x: 30, y: 30, lines: overviewLines },
    { id: "concept", title: "Concepts", color: "#ea580c", x: 70, y: 30, lines: conceptLines },
    { id: "flow", title: "Document Flow", color: "#16a34a", x: 30, y: 70, lines: flowLines },
    { id: "output", title: "Final Output", color: "#ec4899", x: 70, y: 70, lines: outputLines },
  ];
}

const centerPoint = { x: 50, y: 50 };

const TypeText: React.FC<{ text: string; run: boolean }> = ({ text, run }) => {
  const [shown, setShown] = useState(run ? text : "");

  useEffect(() => {
    if (!run) {
      setShown("");
      return;
    }

    let index = 0;
    const timer = window.setInterval(() => {
      index += 2;
      setShown(text.slice(0, index));
      if (index >= text.length) window.clearInterval(timer);
    }, 10);

    return () => window.clearInterval(timer);
  }, [text, run]);

  return <p>{shown}</p>;
};

const MindMapSection: React.FC<Props> = ({ summary }) => {
  const prefersReducedMotion = useReducedMotion();
  const branches = useMemo(() => deriveBranches(summary), [summary]);
  const [activeId, setActiveId] = useState<string>(branches[0].id);
  const [expandedId, setExpandedId] = useState<string>(branches[0].id);

  useEffect(() => {
    setActiveId(branches[0].id);
    setExpandedId(branches[0].id);
  }, [summary.id, branches]);

  return (
    <section className="radialmap-shell rounded-[22px]">
      <div className="radialmap-head">
        <div>
          <h3 className="radialmap-title">Document Mind Map</h3>
          <p className="radialmap-subtitle">Animated branch map generated from your uploaded DOCX content.</p>
        </div>
        <div className="radialmap-badge">
          <Sparkles size={13} />
          4 Branches
        </div>
      </div>

      <div className="radialmap-canvas">
        <div className="radialmap-stage">
          <svg className="radialmap-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {branches.map((branch, index) => {
              const midX = centerPoint.x + (branch.x - centerPoint.x) * 0.56;
              const path = `M ${centerPoint.x} ${centerPoint.y} Q ${midX} ${centerPoint.y} ${branch.x} ${branch.y}`;
              const active = activeId === branch.id;

              return (
                <motion.path
                  key={`line-${branch.id}`}
                  d={path}
                  className={active ? "is-active" : ""}
                  initial={prefersReducedMotion ? false : { pathLength: 0, opacity: 0.2 }}
                  animate={prefersReducedMotion ? { opacity: 1 } : { pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.62, delay: 0.15 + index * 0.09, ease: [0.22, 1, 0.36, 1] }}
                />
              );
            })}
          </svg>

          <motion.div
            className="radialmap-center"
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="center-glow" aria-hidden="true" />
            <h4>{clip(summary.metadata.title || "Uploaded Document", 52)}</h4>
          </motion.div>

          {branches.map((branch, index) => {
            const isActive = activeId === branch.id;
            const isExpanded = expandedId === branch.id;
            const text = branch.lines.join("\n");
            const initialOffsetX = (50 - branch.x) * 0.45;
            const initialOffsetY = (50 - branch.y) * 0.45;

            return (
              <motion.button
                key={branch.id}
                type="button"
                className={`radialmap-node ${isActive ? "active" : ""}`}
                style={{ left: `${branch.x}%`, top: `${branch.y}%`, ["--branch-color" as string]: branch.color }}
                initial={prefersReducedMotion ? false : { opacity: 0, x: initialOffsetX, y: initialOffsetY, scale: 0.82 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0, y: 0, scale: 1 }}
                transition={{ duration: 0.42, delay: 0.18 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
                onClick={() => {
                  setActiveId(branch.id);
                  setExpandedId((prev) => (prev === branch.id ? "" : branch.id));
                }}
              >
                <div className="node-title-row">
                  <span className="node-dot" aria-hidden="true" />
                  <span>{branch.title}</span>
                </div>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      className="node-content"
                      initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <TypeText text={text} run={isExpanded} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MindMapSection;
