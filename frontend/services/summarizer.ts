import { pipeline, env } from "@xenova/transformers";
import { BookMetadata, SummaryResult } from "../types";

env.allowLocalModels = false;
env.useBrowserCache = true;

let bertModel: any = null;

async function initializeModel() {
  if (!bertModel) {
    console.log("🤖 Loading BERT model...");
    bertModel = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    console.log("✅ BERT ready");
  }
}

// ── Text cleaning ──────────────────────────────────────────────────────────
function cleanText(raw: string): string {
  return raw
    .replace(/https?:\/\/[^\s]+/gi, " ")
    .replace(/www\.[^\s]+/gi, " ")
    .replace(/[\w.-]+@[\w.-]+\.\w+/gi, " ")
    .replace(/\[\d+\]/g, " ")
    .replace(/\(\d+\)/g, " ")
    .replace(/[^\w\s.,!?;:()\-'"—–]/g, " ")
    .replace(/^[\s]*[•▪▫■□●○◆◇★☆►▸]+[\s]*/gm, "")
    .replace(/^\s*\d+\s*$/gm, "")
    .replace(/\.{2,}/g, ".")
    .replace(/,{2,}/g, ",")
    .replace(/!{2,}/g, "!")
    .replace(/\?{2,}/g, "?")
    .replace(/\s+/g, " ")
    .replace(/([.!?])\s*([A-Z])/g, "$1 $2")
    .replace(/([a-z])([A-Z])/g, "$1. $2")
    .trim();
}

function fixSentence(s: string): string {
  let t = s.trim().replace(/\s+/g, " ").replace(/\s([.,!?;:])/g, "$1");
  if (!t || t.length < 10) return "";
  t = t.charAt(0).toUpperCase() + t.slice(1);
  if (!/[.!?]$/.test(t)) t += ".";
  return t;
}

// ── Split text into proper sentences ──────────────────────────────────────
function splitSentences(text: string): string[] {
  return text
    .replace(/([.!?])\s+/g, "$1|||")
    .split("|||")
    .map(s => s.trim())
    .filter(s => {
      if (s.length < 20 || s.length > 600) return false;
      const alpha = (s.match(/[a-zA-Z]/g) || []).length;
      if (alpha < s.length * 0.45) return false;
      const special = (s.match(/[^\w\s.,!?;:()\-'"]/g) || []).length;
      if (special > 8) return false;
      return true;
    })
    .map(s => fixSentence(s))
    .filter(Boolean);
}

// ── TF-IDF + position + title-keyword scoring ─────────────────────────────
function scoreSentences(
  sentences: string[],
  fullText: string,
  titleWords: Set<string>
): { sentence: string; score: number; idx: number }[] {
  const allWords = fullText.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const freq: Record<string, number> = {};
  allWords.forEach(w => (freq[w] = (freq[w] || 0) + 1));
  const totalSents = sentences.length || 1;

  return sentences.map((sentence, idx) => {
    const sentWords = sentence.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const uniqueWords = new Set(sentWords);

    const tfidf =
      sentWords.reduce((sum, w) => sum + Math.log(1 + (freq[w] || 0)), 0) /
      (sentWords.length || 1);

    const relPos = idx / totalSents;
    const posScore =
      relPos < 0.15 ? 1.4 :
      relPos < 0.30 ? 1.1 :
      relPos > 0.85 ? 1.2 : 1.0;

    const titleBoost = sentWords.filter(w => titleWords.has(w)).length * 0.35;
    const diversityScore = uniqueWords.size / (sentWords.length || 1);
    const len = sentence.length;
    const lengthScore = len >= 80 && len <= 180 ? 1.1 : len >= 40 ? 1.0 : 0.8;

    const score =
      (tfidf * 0.55 + posScore * 0.2 + titleBoost + diversityScore * 0.15) *
      lengthScore;

    return { sentence, score, idx };
  });
}

// ── Remove near-duplicate sentences (Jaccard > 72%) ───────────────────────
function dedup(sentences: string[]): string[] {
  const seen: string[] = [];
  for (const s of sentences) {
    const sW = new Set(s.toLowerCase().match(/\b[a-z]{4,}\b/g) || []);
    const isDup = seen.some(prev => {
      const pW = new Set(prev.toLowerCase().match(/\b[a-z]{4,}\b/g) || []);
      const inter = [...sW].filter(w => pW.has(w)).length;
      const union = new Set([...sW, ...pW]).size;
      return union > 0 && inter / union > 0.72;
    });
    if (!isDup) seen.push(s);
  }
  return seen;
}

// ── Build a coherent paragraph from ordered sentences ─────────────────────
function buildParagraph(
  sentences: string[],
  minWords: number,
  maxWords: number
): string {
  const chosen: string[] = [];
  let wc = 0;
  for (const s of sentences) {
    const w = s.split(/\s+/).length;
    if (wc + w > maxWords) break;
    chosen.push(s);
    wc += w;
    if (wc >= minWords) break;
  }
  return chosen.join(" ").replace(/\s+/g, " ").trim();
}

// ── Main export ────────────────────────────────────────────────────────────
export async function generateBookSummary(
  text: string,
  metadata: BookMetadata
): Promise<SummaryResult> {
  const startTime = Date.now();

  try {
    await initializeModel();
    console.log("🤖 Starting BERT extractive summarization...");

    const clean = cleanText(text);
    if (clean.length < 50)
      throw new Error(
        "Document too short. Please provide at least 50 characters of text."
      );

    const wordCount = text.split(/\s+/).length;
    const processText = clean.substring(0, 60_000);
    console.log(`📊 Processing ${wordCount} words...`);

    const titleWords = new Set(
      metadata.title.toLowerCase().match(/\b[a-z]{3,}\b/g) || []
    );

    const allSentences = splitSentences(processText);
    if (allSentences.length === 0)
      throw new Error(
        "Could not extract sentences from document. Please check the content."
      );

    console.log(`📝 ${allSentences.length} sentences extracted`);

    const scored = scoreSentences(allSentences, processText, titleWords);
    const topN = Math.min(45, scored.length);
    const topScored = [...scored]
      .sort((a, b) => b.score - a.score)
      .slice(0, topN)
      .sort((a, b) => a.idx - b.idx);

    const selected = dedup(topScored.map(s => s.sentence));
    console.log(`🎯 ${selected.length} unique key sentences selected`);

    // Paragraph 1: early sentences (intro / context)
    const split = Math.ceil(selected.length * 0.45);
    const earlyPool = selected.slice(0, split);
    const latePool  = selected.slice(split);

    let para1 = buildParagraph(earlyPool, 120, 210);
    if (para1 && !para1.toLowerCase().includes(
        metadata.title.toLowerCase().split(" ")[0]
      )) {
      para1 = `"${metadata.title}" — ` + para1.charAt(0).toLowerCase() + para1.slice(1);
    }
    para1 = fixSentence(cleanText(para1));

    // Paragraph 2: later / deeper content
    const pool2 = latePool.length >= 4 ? latePool : selected.slice(Math.ceil(selected.length * 0.3));
    let para2 = buildParagraph(pool2, 140, 280);
    para2 = fixSentence(cleanText(para2));

    // Fallbacks for very short documents
    if (!para1 && selected.length > 0)
      para1 = fixSentence(selected.slice(0, 3).join(" "));
    if (!para2 && selected.length > 3)
      para2 = fixSentence(selected.slice(3, 8).join(" "));
    if (!para1)
      para1 = `"${metadata.title}" — the document did not yield enough extractable text for a full paragraph summary.`;

    console.log(
      `📊 Para1: ${para1.split(/\s+/).length}w | Para2: ${para2.split(/\s+/).length}w`
    );

    // Key bullet points — score the full clean text independently
    const bulletCandidates = splitSentences(processText);
    const bulletScored = scoreSentences(bulletCandidates, processText, titleWords)
      .sort((a, b) => b.score - a.score);

    const bulletPool = dedup(bulletScored.map(s => s.sentence));
    const bulletPoints: string[] = [];

    // Target 5–10 key points depending on available content
    const maxBullets = Math.min(10, Math.max(5, Math.floor(bulletPool.length * 0.25)));

    for (const sent of bulletPool) {
      if (bulletPoints.length >= maxBullets) break;
      if (para1.includes(sent) || para2.includes(sent)) continue;

      let bullet = sent.trim();
      if (bullet.length > 180) {
        const cut = bullet.lastIndexOf(". ", 178);
        bullet =
          cut > 60
            ? bullet.substring(0, cut + 1)
            : bullet.substring(0, 178).trimEnd() + ".";
      }
      bullet = fixSentence(bullet);
      if (bullet.split(/\s+/).length >= 5 && bullet.length >= 30)
        bulletPoints.push(bullet);
    }

    // Pad up to 5 with lower-scored candidates if needed
    if (bulletPoints.length < 5) {
      for (const sent of bulletPool) {
        if (bulletPoints.length >= 5) break;
        const bullet = fixSentence(sent.trim());
        if (
          bullet.split(/\s+/).length >= 5 &&
          bullet.length >= 30 &&
          !bulletPoints.includes(bullet)
        )
          bulletPoints.push(bullet);
      }
    }

    if (bulletPoints.length === 0)
      bulletPoints.push(
        `"${metadata.title}" — no standalone key insights could be extracted. Try uploading a longer document.`
      );

    const processingTime = (Date.now() - startTime) / 1000;
    console.log(`✅ Done in ${processingTime.toFixed(1)}s — ${bulletPoints.length} bullets`);

    return {
      id: crypto.randomUUID(),
      metadata,
      fullText: text,
      summaryParagraphs: [para1, para2].filter(Boolean),
      bulletPoints,
      wordCount,
      processingTime,
      timestamp: Date.now(),
    };
  } catch (error: any) {
    console.error("❌ Summarization error:", error);
    throw new Error(error.message || "Failed to generate summary. Please try again.");
  }
}
