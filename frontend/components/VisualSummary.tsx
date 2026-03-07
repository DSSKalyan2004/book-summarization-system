import React from "react";
import { SummaryResult } from "../types";
import { Table2, GitBranch, ArrowDown } from "lucide-react";

interface Props {
  summary: SummaryResult;
}

const VisualSummary: React.FC<Props> = ({ summary }) => {
  const bullets = summary.bulletPoints ?? [];

  // Use saved tableRows if present; otherwise derive from bullet points
  const tableRows =
    summary.tableRows && summary.tableRows.length > 0
      ? summary.tableRows
      : bullets.slice(0, 6).map(bp => {
          const words = bp.split(/\s+/);
          const end = Math.min(4, Math.ceil(words.length * 0.35));
          const concept = words
            .slice(0, end)
            .join(" ")
            .replace(/[.,;:!?]$/, "")
            .trim() || "Key Point";
          return { concept, explanation: bp };
        });

  // Use saved flowSteps if present; otherwise use bullet points as steps
  const flowSteps =
    summary.flowSteps && summary.flowSteps.length > 0
      ? summary.flowSteps
      : bullets.slice(0, 6);

  return (
    <div className="space-y-8">

      {/* â”€â”€ Table Format Summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="card-premium rounded-2xl" style={{ padding: "36px 40px" }}>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(180deg, #7c3aed, #a855f7)" }} />
          <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: "#7c3aed" }}>
            <Table2 size={16} /> Table Format Summary
          </h3>
        </div>
        <p className="text-sm mb-5 ml-4" style={{ color: "#9ca3af" }}>
          Concepts &amp; definitions extracted directly from the document.
        </p>

        {tableRows.length > 0 ? (
          <div style={{ overflowX: "auto", borderRadius: "12px", border: "1.5px solid #e9d5ff" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr>
                  {["Concept", "Explanation"].map(h => (
                    <th key={h} style={{
                      padding: "12px 18px",
                      textAlign: "left",
                      color: "#fff",
                      fontWeight: 700,
                      background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      whiteSpace: "nowrap",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, i) => (
                  <tr
                    key={i}
                    style={{ background: i % 2 === 0 ? "#faf5ff" : "#ffffff", borderBottom: i < tableRows.length - 1 ? "1px solid #ede9fe" : "none" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = "#f3e8ff"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? "#faf5ff" : "#ffffff"; }}
                  >
                    <td style={{ padding: "13px 18px", fontWeight: 700, color: "#6d28d9", verticalAlign: "top", lineHeight: 1.5, width: "28%", whiteSpace: "nowrap" }}>
                      {row.concept}
                    </td>
                    <td style={{ padding: "13px 18px", color: "#374151", lineHeight: 1.75 }}>
                      {row.explanation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: "#9ca3af", fontSize: "14px", textAlign: "center", padding: "24px" }}>
            No concept-definition pairs detected in this document.
          </p>
        )}
      </div>

      {/* â”€â”€ Flow Diagram â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="card-premium rounded-2xl" style={{ padding: "36px 40px" }}>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(180deg, #0891b2, #0ea5e9)" }} />
          <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: "#0891b2" }}>
            <GitBranch size={16} /> Flow Diagram
          </h3>
        </div>
        <p className="text-sm mb-7 ml-4" style={{ color: "#9ca3af" }}>
          Sequential steps &amp; processes in the order they appear in the document.
        </p>

        {flowSteps.length > 0 ? (
          <div className="flex flex-col items-center">
            {flowSteps.map((step, i) => (
              <React.Fragment key={i}>
                <div
                  style={{
                    background: "linear-gradient(135deg, #f0f9ff 0%, #eff6ff 100%)",
                    border: "2px solid #bae6fd",
                    borderRadius: "14px",
                    padding: "16px 28px",
                    width: "100%",
                    maxWidth: "640px",
                    textAlign: "center",
                    boxShadow: "0 3px 12px rgba(8,145,178,0.10)",
                    transition: "all 0.2s",
                    cursor: "default",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = "#38bdf8";
                    el.style.boxShadow = "0 6px 20px rgba(8,145,178,0.22)";
                    el.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = "#bae6fd";
                    el.style.boxShadow = "0 3px 12px rgba(8,145,178,0.10)";
                    el.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: "26px", height: "26px", borderRadius: "50%",
                    background: "linear-gradient(135deg, #0891b2, #0ea5e9)",
                    color: "#fff", fontWeight: 800, fontSize: "11px",
                    marginBottom: "8px", boxShadow: "0 2px 8px rgba(8,145,178,0.35)",
                  }}>
                    {i + 1}
                  </div>
                  <p style={{ fontSize: "13px", color: "#1e40af", fontWeight: 600, lineHeight: 1.65, margin: 0 }}>
                    {step}
                  </p>
                </div>

                {i < flowSteps.length - 1 && (
                  <div style={{ padding: "6px 0" }}>
                    <ArrowDown size={22} color="#0891b2" strokeWidth={2.5} />
                  </div>
                )}
              </React.Fragment>
            ))}

            {/* Terminal node */}
            <div style={{ padding: "6px 0" }}>
              <ArrowDown size={22} color="#059669" strokeWidth={2.5} />
            </div>
            <div style={{
              background: "linear-gradient(135deg, #059669, #10b981)",
              borderRadius: "14px", padding: "14px 32px", textAlign: "center",
              boxShadow: "0 4px 16px rgba(5,150,105,0.28)",
              maxWidth: "640px", width: "100%",
            }}>
              <p style={{ fontSize: "13px", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Document Understanding Complete
              </p>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.75)", margin: "4px 0 0 0" }}>
                {summary.metadata.title}
              </p>
            </div>
          </div>
        ) : (
          <p style={{ color: "#9ca3af", fontSize: "14px", textAlign: "center", padding: "24px" }}>
            No sequential process steps detected in this document.
          </p>
        )}
      </div>
    </div>
  );
};

export default VisualSummary;
