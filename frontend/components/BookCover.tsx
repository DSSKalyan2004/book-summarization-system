import React, { useState } from "react";
import { BookOpen, Sparkles } from "lucide-react";

interface Props {
  title?: string;
  size?: "sm" | "md" | "lg";
  color?: string;
}

/** Generates a deterministic color from a title string */
function titleToColor(title: string): string {
  const colors = [
    ["#4F46E5", "#7C3AED"],
    ["#0891B2", "#06B6D4"],
    ["#059669", "#10B981"],
    ["#DC2626", "#F97316"],
    ["#7C3AED", "#EC4899"],
    ["#1D4ED8", "#3B82F6"],
    ["#0F766E", "#2DD4BF"],
    ["#9333EA", "#C084FC"],
  ];
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
  const pair = colors[Math.abs(hash) % colors.length];
  return `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`;
}

function titleToShadowColor(title: string): string {
  const colors = ["79,70,229", "8,145,178", "5,150,105", "220,38,38", "124,58,237", "29,78,216", "15,118,110", "147,51,234"];
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const BookCover: React.FC<Props> = ({ title = "Book", size = "md" }) => {
  const dims = { sm: { w: 80, h: 110 }, md: { w: 120, h: 165 }, lg: { w: 160, h: 220 } };
  const d = dims[size];
  const gradient = titleToColor(title);
  const shadowRgb = titleToShadowColor(title);
  const initials = title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: d.w + 20, height: d.h + 30 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Floating shadow */}
      <div
        className="animate-book-shadow absolute"
        style={{
          bottom: 0,
          left: "10%",
          width: "80%",
          height: "12px",
          borderRadius: "50%",
          background: `rgba(${shadowRgb},0.25)`,
          filter: "blur(6px)",
          transition: "transform 0.3s ease, opacity 0.3s ease",
          transform: isHovered ? "scale(0.7)" : "scale(1)",
          opacity: isHovered ? 0.15 : 0.3,
        }}
      />

      {/* Glow effect on hover */}
      <div
        style={{
          position: "absolute",
          left: 10,
          top: 0,
          width: d.w,
          height: d.h,
          borderRadius: "4px 12px 12px 4px",
          background: `radial-gradient(ellipse at center, rgba(${shadowRgb},0.3) 0%, transparent 70%)`,
          opacity: isHovered ? 1 : 0,
          transition: "opacity 0.4s ease",
          filter: "blur(16px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Book body */}
      <div
        className="animate-book-float absolute"
        style={{
          width: d.w,
          height: d.h,
          left: 10,
          top: 0,
          borderRadius: "4px 12px 12px 4px",
          background: gradient,
          boxShadow: isHovered
            ? `inset -3px 0 8px rgba(0,0,0,0.15), 8px 8px 28px rgba(${shadowRgb},0.4), -2px 0 0 #312e81, 0 0 24px rgba(${shadowRgb},0.15)`
            : `inset -3px 0 8px rgba(0,0,0,0.15), 4px 4px 20px rgba(${shadowRgb},0.3), -2px 0 0 #312e81`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          transform: isHovered
            ? "perspective(600px) rotateY(-6deg) rotateX(3deg) translateY(-6px)"
            : "none",
          zIndex: 1,
        }}
      >
        {/* Spine highlight */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "6px",
            background: "rgba(255,255,255,0.15)",
            borderRadius: "4px 0 0 4px",
            transition: "background 0.3s ease",
            ...(isHovered ? { background: "rgba(255,255,255,0.25)" } : {}),
          }}
        />

        {/* Page edge lines */}
        <div
          className="animate-page-flip"
          style={{
            position: "absolute",
            right: -2,
            top: "8%",
            bottom: "8%",
            width: "4px",
            background: "repeating-linear-gradient(180deg, #fff 0px, #fff 2px, transparent 2px, transparent 4px)",
            opacity: isHovered ? 0.6 : 0.4,
            borderRadius: "0 2px 2px 0",
            transition: "opacity 0.3s ease",
          }}
        />

        {/* Inner page peeking out (3D effect) */}
        {isHovered && (
          <div
            style={{
              position: "absolute",
              right: 3,
              top: "5%",
              bottom: "5%",
              width: d.w * 0.85,
              background: "rgba(255,255,255,0.08)",
              borderRadius: "0 3px 3px 0",
              transform: "perspective(400px) rotateY(-5deg)",
              transformOrigin: "right center",
            }}
          />
        )}

        {/* Decorative text lines */}
        <div style={{ position: "absolute", left: "15%", right: "15%", top: "15%", display: "flex", flexDirection: "column", gap: size === "sm" ? 2 : 3, opacity: 0.15 }}>
          <div style={{ width: "100%", height: size === "sm" ? 1.5 : 2, background: "#fff", borderRadius: 1 }} />
          <div style={{ width: "70%", height: size === "sm" ? 1.5 : 2, background: "#fff", borderRadius: 1 }} />
        </div>

        {/* Icon */}
        <div
          style={{
            padding: size === "sm" ? 6 : 10,
            background: isHovered ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.15)",
            borderRadius: "12px",
            backdropFilter: "blur(4px)",
            marginBottom: size === "sm" ? 4 : 8,
            transition: "background 0.3s ease, transform 0.3s ease",
            transform: isHovered ? "scale(1.1)" : "scale(1)",
          }}
        >
          <BookOpen size={size === "sm" ? 18 : size === "md" ? 26 : 34} color="#fff" strokeWidth={1.8} />
        </div>

        {/* Initials */}
        <span
          style={{
            color: "#fff",
            fontWeight: 800,
            fontSize: size === "sm" ? 14 : size === "md" ? 20 : 28,
            letterSpacing: "0.05em",
            textShadow: "0 2px 8px rgba(0,0,0,0.25)",
          }}
        >
          {initials}
        </span>

        {/* Decorative line */}
        <div
          style={{
            width: isHovered ? "50%" : "40%",
            height: 2,
            background: "rgba(255,255,255,0.3)",
            borderRadius: 99,
            marginTop: size === "sm" ? 4 : 8,
            transition: "width 0.3s ease",
          }}
        />

        {/* Bottom text lines */}
        <div style={{ position: "absolute", left: "20%", right: "20%", bottom: "12%", display: "flex", flexDirection: "column", gap: 2, opacity: 0.12 }}>
          <div style={{ width: "100%", height: 1.5, background: "#fff", borderRadius: 1 }} />
          <div style={{ width: "60%", height: 1.5, background: "#fff", borderRadius: 1 }} />
        </div>

        {/* Sparkle decorations */}
        <Sparkles
          size={size === "sm" ? 10 : 14}
          color="rgba(255,255,255,0.5)"
          style={{
            position: "absolute",
            top: "12%",
            right: "15%",
            animation: "sparkle 3s ease-in-out infinite",
            opacity: isHovered ? 1 : 0.5,
            transition: "opacity 0.3s ease",
          }}
        />
        <Sparkles
          size={size === "sm" ? 8 : 11}
          color="rgba(255,255,255,0.4)"
          style={{
            position: "absolute",
            bottom: "18%",
            left: "20%",
            animation: "sparkle 3s ease-in-out infinite 1.5s",
            opacity: isHovered ? 1 : 0.4,
            transition: "opacity 0.3s ease",
          }}
        />
      </div>
    </div>
  );
};

export default BookCover;
