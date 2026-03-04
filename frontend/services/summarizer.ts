import { pipeline, env } from "@xenova/transformers";
import { BookMetadata, SummaryResult, TableRow } from "../types";

env.allowLocalModels = false;
env.useBrowserCache = false;

let bertModel: any = null;

async function initializeModel() {
  if (!bertModel) {
    console.log("ðŸ¤– Loading BERT model...");
    bertModel = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    console.log("âœ… BERT ready");
  }
}

// â”€â”€ Text cleaning â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function cleanText(raw: string): string {
  return raw
    .replace(/https?:\/\/[^\s]+/gi, " ")
    .replace(/www\.[^\s]+/gi, " ")
    .replace(/[\w.-]+@[\w.-]+\.\w+/gi, " ")
    .replace(/\[\d+\]/g, " ")
    .replace(/\(\d+\)/g, " ")
    .replace(/[^\w\s.,!?;:()\-'"\u2014\u2013]/g, " ")
    .replace(/^[\s]*[\u2022\u25AA\u25AB\u25A0\u25A1\u25CF\u25CB\u25C6\u25C7\u2605\u2606\u25BA\u25B8]+[\s]*/gm, "")
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

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// â”€â”€ Sentence splitter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Base TF-IDF scorer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    const posScore = relPos < 0.15 ? 1.4 : relPos < 0.30 ? 1.1 : relPos > 0.85 ? 1.2 : 1.0;
    const titleBoost = sentWords.filter(w => titleWords.has(w)).length * 0.35;
    const diversityScore = uniqueWords.size / (sentWords.length || 1);
    const len = sentence.length;
    const lengthScore = len >= 80 && len <= 180 ? 1.1 : len >= 40 ? 1.0 : 0.8;
    const score = (tfidf * 0.55 + posScore * 0.2 + titleBoost + diversityScore * 0.15) * lengthScore;
    return { sentence, score, idx };
  });
}

// â”€â”€ Dedup (Jaccard > 72%) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function dedup(sentences: string[], alreadyUsed: Set<string> = new Set()): string[] {
  const seen: string[] = [];
  for (const s of sentences) {
    if (alreadyUsed.has(s)) continue;
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

function buildParagraph(sentences: string[], minWords: number, maxWords: number): string {
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

// ── SIMPLIFICATION ENGINE ──────────────────────────────────────────────────
// Rewrites any document sentence into short, plain, easy-to-read English.

const WORD_MAP: Record<string, string> = {
  utilize: "use", utilizes: "uses", utilized: "used", utilizing: "using",
  implement: "apply", implements: "applies", implemented: "applied", implementing: "applying",
  facilitate: "help", facilitates: "helps", facilitated: "helped",
  demonstrate: "show", demonstrates: "shows", demonstrated: "showed",
  indicate: "show", indicates: "shows", indicated: "showed",
  perform: "do", performs: "does", performed: "did",
  obtain: "get", obtains: "gets", obtained: "got",
  provide: "give", provides: "gives", provided: "gave",
  determine: "find", determines: "finds", determined: "found",
  examine: "look at", examines: "looks at", examined: "looked at",
  numerous: "many", multiple: "many", various: "many",
  significant: "important", significantly: "greatly",
  therefore: "so", however: "but", furthermore: "also", additionally: "also",
  subsequently: "then", consequently: "so", approximately: "about",
  sufficient: "enough", majority: "most", primarily: "mainly",
  essentially: "basically", specifically: "exactly", typically: "usually",
  methodology: "method", capability: "ability", functionality: "feature",
  subsequent: "next", prior: "before", initial: "first",
  require: "need", requires: "needs", required: "needed",
  establish: "set up", establishes: "sets up", established: "set up",
};

function simplifyToPlainEnglish(raw: string, maxLen = 90): string {
  let s = raw
    // Remove dependent relative clauses
    .replace(/,\s*which\b[^,.!?]*/gi, "")
    .replace(/,\s*that\b[^,.!?]*/gi, "")
    .replace(/,\s*who\b[^,.!?]*/gi, "")
    .replace(/,\s*where\b[^,.!?]*/gi, "")
    // Remove parenthetical content
    .replace(/\([^)]*\)/g, "")
    // Replace verbose phrases
    .replace(/\bin order to\b/gi, "to")
    .replace(/\bdue to the fact that\b/gi, "because")
    .replace(/\bin spite of the fact that\b/gi, "although")
    .replace(/\bwith respect to\b/gi, "about")
    .replace(/\bwith regard to\b/gi, "about")
    .replace(/\bin terms of\b/gi, "in")
    .replace(/\ba number of\b/gi, "many")
    .replace(/\ba variety of\b/gi, "many")
    .replace(/\ba wide range of\b/gi, "many")
    .replace(/\bas well as\b/gi, "and")
    .replace(/\bfor the purpose of\b/gi, "to")
    .replace(/\bmake use of\b/gi, "use")
    .replace(/\btake into account\b/gi, "consider")
    .replace(/\bin addition to\b/gi, "besides")
    .replace(/\bas a result\b/gi, "so")
    .replace(/\bin other words\b/gi, "meaning")
    // Strip leading connector words
    .replace(/^(Furthermore|Moreover|However|Nevertheless|Consequently|Therefore|Thus|Hence|Additionally|Specifically|Notably|Indeed|Also),?\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

  // Swap complex words for simpler ones
  s = s.replace(/\b(\w+)\b/g, (w) => WORD_MAP[w.toLowerCase()] ?? w);

  // If too many commas, keep only the first clause
  const commas = (s.match(/,/g) || []).length;
  if (commas >= 3) {
    const first = s.split(",")[0].trim();
    if (first.length > 20) s = first;
  }

  // Trim to maxLen at a word boundary
  if (s.length > maxLen) {
    const cut = s.lastIndexOf(" ", maxLen - 2);
    s = cut > 30 ? s.slice(0, cut) : s.slice(0, maxLen - 1);
  }

  s = s.trim();
  if (!s) return "";
  s = s.charAt(0).toUpperCase() + s.slice(1);
  if (!/[.!?]$/.test(s)) s += ".";
  return s;
}

// Extract a short concept name (1-4 words) from a sentence
function extractConceptName(sentence: string): string {
  const STRIP_LEAD = /^(The|A|An|This|That|These|Those|Its|Their|Our)\s+/i;
  const m = sentence.match(
    /^(.{3,50}?)\s+(?:is|are|was|were|can|will|refers? to|means?|involves?|describes?|enables?|allows?|includes?|helps?)\b/i
  );
  const phrase = m
    ? m[1].replace(STRIP_LEAD, "").replace(/[.,;!?]$/g, "").trim()
    : sentence.replace(STRIP_LEAD, "").split(/\s+/).slice(0, 3).join(" ").replace(/[.,;!?]$/g, "");
  return phrase.split(/\s+/).slice(0, 4).join(" ");
}



// â”€â”€ TABLE: extract definitional sentences â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Sentences that explain WHAT something IS (concept = definition pairs)
const DEFN_PATTERNS: [RegExp, number, number][] = [
  // "X is/are a/an/the ..."  â†’ [concept, explanation]
  [/^(.{4,50}?)\s+(?:is|are|was|were)\s+(a |an |the |one )(.{10,})/i, 1, 2],
  // "X refers to / means / involves ..."
  [/^(.{4,50}?)\s+(?:refers? to|means?|involves?|describes?|represents?|consists? of|defined? as|known as|called)\s+(.{10,})/i, 1, 2],
  // "X includes / contains / comprises ..."
  [/^(.{4,50}?)\s+(?:includes?|contains?|comprises?|provides?|enables?|allows?)\s+(.{10,})/i, 1, 2],
];

function parseDefinition(sentence: string): TableRow | null {
  for (const [pattern] of DEFN_PATTERNS) {
    const m = sentence.match(pattern);
    if (!m) continue;
    // Extract concept using smart noun-phrase extractor
    const concept = extractConceptName(sentence);
    if (!concept || concept.split(/\s+/).length > 5 || concept.length < 3) continue;
    // Generate a simplified, plain-English explanation (not the raw sentence)
    const simplified = simplifyToPlainEnglish(sentence, 100);
    if (!simplified || simplified.length < 10) continue;
    return { concept: cap(concept), explanation: simplified };
  }
  return null;
}

function definitionalScore(sentence: string): number {
  const l = sentence.toLowerCase();
  let bonus = 0;
  if (/\b(?:is|are|was|were)\s+(?:a|an|the)\b/.test(l)) bonus += 0.8;
  if (/\b(?:refers? to|means?|defined? as|known as|called|represents?)\b/.test(l)) bonus += 1.0;
  if (/\b(?:involves?|includes?|describes?|consists? of)\b/.test(l)) bonus += 0.6;
  return bonus;
}

// â”€â”€ FLOW: extract sequential / process sentences â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Sentences that describe HOW something happens (steps, causes, results)
const FLOW_WORDS = [
  "first", "second", "third", "then", "next", "after", "before",
  "finally", "subsequently", "initially", "eventually", "when", "once",
  "begin", "start", "lead", "result", "follow", "cause", "enable",
  "allow", "require", "process", "step", "phase", "stage", "trigger",
  "produce", "generate", "create", "complete", "finish",
];

function flowScore(sentence: string): number {
  const l = sentence.toLowerCase();
  const words = l.match(/\b\w+\b/g) || [];
  const hits = words.filter(w => FLOW_WORDS.some(fw => w.startsWith(fw))).length;
  return hits * 0.45;
}

// Convert a raw document sentence into a short, plain-English flow step
function toSimpleFlowStep(raw: string): string {
  let s = simplifyToPlainEnglish(raw, 95);
  // Remove leading "The " to make more action-oriented
  s = s.replace(/^The\s+(?=[A-Z])/,  "");
  // If it's still long, take only up to the first comma or semi-colon
  const split = s.search(/[,;]/);
  if (split > 20 && split < s.length - 5) s = s.slice(0, split).trim() + ".";
  if (!s) s = simplifyToPlainEnglish(raw, 70);
  return s;
}

// â”€â”€ Main export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function generateBookSummary(
  text: string,
  metadata: BookMetadata
): Promise<SummaryResult> {
  const startTime = Date.now();

  try {
    await initializeModel();
    console.log("ðŸ¤– Starting BERT extractive summarizationâ€¦");

    const clean = cleanText(text);
    if (clean.length < 50)
      throw new Error("Document too short. Please provide at least 50 characters of text.");

    const wordCount = text.split(/\s+/).length;
    const processText = clean.substring(0, 60_000);
    const titleWords = new Set(metadata.title.toLowerCase().match(/\b[a-z]{3,}\b/g) || []);

    const allSentences = splitSentences(processText);
    if (allSentences.length === 0)
      throw new Error("Could not extract sentences from document. Please check the content.");

    console.log(`ðŸ“ ${allSentences.length} sentences extracted`);

    // â”€â”€ 1. Summary paragraphs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const scored = scoreSentences(allSentences, processText, titleWords);
    const topN = Math.min(45, scored.length);
    const topScored = [...scored]
      .sort((a, b) => b.score - a.score)
      .slice(0, topN)
      .sort((a, b) => a.idx - b.idx);

    const selected = dedup(topScored.map(s => s.sentence));
    const usedSentences = new Set(selected);   // track what's used

    const split = Math.ceil(selected.length * 0.45);
    const earlyPool = selected.slice(0, split);
    const latePool  = selected.slice(split);

    let para1 = buildParagraph(earlyPool, 120, 210);
    if (para1 && !para1.toLowerCase().includes(metadata.title.toLowerCase().split(" ")[0])) {
      para1 = `"${metadata.title}" â€” ` + para1.charAt(0).toLowerCase() + para1.slice(1);
    }
    para1 = fixSentence(cleanText(para1));

    const pool2 = latePool.length >= 4 ? latePool : selected.slice(Math.ceil(selected.length * 0.3));
    let para2 = buildParagraph(pool2, 140, 280);
    para2 = fixSentence(cleanText(para2));

    if (!para1 && selected.length > 0) para1 = fixSentence(selected.slice(0, 3).join(" "));
    if (!para2 && selected.length > 3) para2 = fixSentence(selected.slice(3, 8).join(" "));
    if (!para1) para1 = `"${metadata.title}" â€” the document did not yield enough extractable text for a full paragraph summary.`;

    // â”€â”€ 2. Key Insights (bullets) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Top TF-IDF sentences NOT already used in paragraphs
    const bulletScored = scoreSentences(allSentences, processText, titleWords)
      .sort((a, b) => b.score - a.score);
    const bulletPool = dedup(bulletScored.map(s => s.sentence), usedSentences);

    const bulletPoints: string[] = [];
    const maxBullets = Math.min(10, Math.max(5, Math.floor(bulletPool.length * 0.25)));

    for (const sent of bulletPool) {
      if (bulletPoints.length >= maxBullets) break;
      let bullet = sent.trim();
      if (bullet.length > 180) {
        const cut = bullet.lastIndexOf(". ", 178);
        bullet = cut > 60 ? bullet.substring(0, cut + 1) : bullet.substring(0, 178).trimEnd() + ".";
      }
      bullet = fixSentence(bullet);
      if (bullet.split(/\s+/).length >= 5 && bullet.length >= 30) {
        bulletPoints.push(bullet);
        usedSentences.add(sent);
      }
    }
    if (bulletPoints.length < 5) {
      for (const sent of bulletPool) {
        if (bulletPoints.length >= 5) break;
        const bullet = fixSentence(sent.trim());
        if (bullet.split(/\s+/).length >= 5 && bullet.length >= 30 && !bulletPoints.includes(bullet)) {
          bulletPoints.push(bullet);
          usedSentences.add(sent);
        }
      }
    }
    if (bulletPoints.length === 0)
      bulletPoints.push(`"${metadata.title}" â€” no standalone key insights could be extracted.`);

    // â”€â”€ 3. Table rows (definitional sentences) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Sentences that define/explain concepts â€” different from bullet points
    const baseScored = scoreSentences(allSentences, processText, titleWords);
    const defScored = baseScored
      .map(({ sentence, score, idx }) => ({
        sentence,
        score: score + definitionalScore(sentence),
        idx,
      }))
      .sort((a, b) => b.score - a.score);

    const tableRows: TableRow[] = [];
    const usedForTable = new Set<string>(usedSentences);

    for (const { sentence } of defScored) {
      if (tableRows.length >= 8) break;
      if (usedForTable.has(sentence)) continue;
      const row = parseDefinition(sentence);
      if (!row) continue;
      // avoid duplicate concepts
      if (tableRows.some(r => r.concept.toLowerCase() === row.concept.toLowerCase())) continue;
      tableRows.push(row);
      usedForTable.add(sentence);
    }

    // Fallback: if not enough definitional sentences found, use top-scored sentences simplified
    if (tableRows.length < 4) {
      const fallbackPool = dedup(
        baseScored.sort((a, b) => b.score - a.score).map(s => s.sentence),
        usedForTable
      );
      for (const sent of fallbackPool) {
        if (tableRows.length >= 6) break;
        const concept = extractConceptName(sent);
        const explanation = simplifyToPlainEnglish(sent, 100);
        if (concept.length > 3 && explanation.length > 10
          && !tableRows.some(r => r.concept.toLowerCase() === concept.toLowerCase())) {
          tableRows.push({ concept: cap(concept), explanation });
          usedForTable.add(sent);
        }
      }
    }

    // â”€â”€ 4. Flow steps (sequential / process sentences) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Sentences describing HOW/WHEN things happen â€” different from all above
    const flowScored = baseScored
      .map(({ sentence, score, idx }) => ({
        sentence,
        score: score + flowScore(sentence),
        idx,
      }))
      .sort((a, b) => b.score - a.score);

    const usedForFlow = new Set<string>(usedForTable);
    const flowCandidates: { sentence: string; idx: number }[] = [];

    for (const { sentence, score, idx } of flowScored) {
      if (flowCandidates.length >= 20) break;
      if (usedForFlow.has(sentence)) continue;
      // Only include if it has at least one flow word
      if (flowScore(sentence) === 0 && flowCandidates.length >= 5) continue;
      flowCandidates.push({ sentence, idx });
      usedForFlow.add(sentence);
    }

    // Sort by document position (tells a narrative story)
    flowCandidates.sort((a, b) => a.idx - b.idx);
    // Pick 5â€“7 evenly spaced
    const maxFlow = Math.min(7, Math.max(4, flowCandidates.length));
    const flowSteps: string[] = [];
    if (flowCandidates.length <= maxFlow) {
      flowCandidates.forEach(fc => flowSteps.push(toSimpleFlowStep(fc.sentence)));
    } else {
      const gap = flowCandidates.length / maxFlow;
      for (let i = 0; i < maxFlow; i++) {
        flowSteps.push(toSimpleFlowStep(flowCandidates[Math.round(i * gap)].sentence));
      }
    }

    if (flowSteps.length === 0) {
      // Last resort: pick first 5 sentences not used elsewhere
      const remaining = dedup(
        allSentences.filter(s => !usedForFlow.has(s))
      ).slice(0, 5);
      remaining.forEach(s => flowSteps.push(toSimpleFlowStep(s)));
    }

    const processingTime = (Date.now() - startTime) / 1000;
    console.log(`âœ… Done in ${processingTime.toFixed(1)}s â€” ${bulletPoints.length} bullets, ${tableRows.length} rows, ${flowSteps.length} steps`);

    return {
      id: (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
      metadata,
      fullText: text,
      summaryParagraphs: [para1, para2].filter(Boolean),
      bulletPoints,
      tableRows,
      flowSteps,
      wordCount,
      processingTime,
      timestamp: Date.now(),
    };
  } catch (error: any) {
    console.error("âŒ Summarization error:", error);
    throw new Error(error.message || "Failed to generate summary. Please try again.");
  }
}
