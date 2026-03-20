import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SummaryResult, TableRow } from "../types";
import { Table2 } from "lucide-react";

interface Props {
  summary: SummaryResult;
}

/* Helpers to derive fallback data */

function deriveTableRows(summary: SummaryResult): TableRow[] {
  if (summary.tableRows && summary.tableRows.length > 0) return summary.tableRows;
  return (summary.bulletPoints ?? []).slice(0, 6).map(bp => {
    const words = bp.split(/\s+/);
    const end = Math.min(4, Math.ceil(words.length * 0.35));
    // If no concept can be derived, use an empty string instead of 'Key Point'
    const concept = words.slice(0, end).join(" ").replace(/[.,;:!?]$/, "").trim() || "";
    return { concept, explanation: bp };
  });
}

// Table Section (exported separately)
export const TableSection: React.FC<Props> = ({ summary }) => {
  const prefersReducedMotion = useReducedMotion();
  const tableRows = deriveTableRows(summary);
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(180deg, #7c3aed, #a855f7)" }} />
        <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: "#7c3aed" }}>
          <Table2 size={16} /> Professional Table Summary
        </h3>
      </div>
      <p className="text-sm ml-4" style={{ color: "#6b7280" }}>
        Key concepts and simple explanations, auto-extracted from your document.
      </p>
      {tableRows.length > 0 ? (
        <div
          style={{
            overflowX: "auto",
            borderRadius: "22px",
            border: "1.5px solid rgba(196,181,253,0.35)",
            background: "rgba(255,255,255,0.97)",
            boxShadow: "0 18px 36px rgba(124,58,237,0.08)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: "15px" }}>
            <thead>
              <tr>
                {["#", "Concept", "Explanation"].map((h) => (
                  <th key={h} style={{
                    padding: "16px 18px",
                    textAlign: "left",
                    color: "#fff",
                    fontWeight: 800,
                    background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    whiteSpace: "nowrap",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, i) => (
                <motion.tr
                  key={i}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
                  animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  style={{ background: i % 2 === 0 ? "#f6f3ff" : "#ffffff" }}
                >
                  <td style={{ padding: "18px 18px", borderBottom: i < tableRows.length - 1 ? "1px solid #ede9fe" : "none", verticalAlign: "top", width: "64px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: "32px",
                        height: "32px",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, #ede9fe, #ddd6fe)",
                        color: "#6d28d9",
                        fontWeight: 800,
                        fontSize: 15,
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </td>
                  <td style={{ padding: "18px 18px", borderBottom: i < tableRows.length - 1 ? "1px solid #ede9fe" : "none", verticalAlign: "top", width: "32%" }}>
                    <span style={{ fontWeight: 800, color: "#5b21b6", lineHeight: 1.5, fontSize: 15 }}>
                      {row.concept}
                    </span>
                  </td>
                  <td style={{ padding: "18px 18px", borderBottom: i < tableRows.length - 1 ? "1px solid #ede9fe" : "none", color: "#374151", lineHeight: 1.7, fontSize: 15 }}>
                    <div style={{ position: "relative", paddingLeft: "16px" }}>
                      <span
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "4px",
                          bottom: "4px",
                          width: "4px",
                          borderRadius: "999px",
                          background: "linear-gradient(180deg, #a855f7, #ddd6fe)",
                        }}
                      />
                      {row.explanation}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ color: "#9ca3af", fontSize: "15px", textAlign: "center", padding: "24px" }}>
          No concept-definition pairs detected in this document.
        </p>
      )}
    </div>
  );
};
