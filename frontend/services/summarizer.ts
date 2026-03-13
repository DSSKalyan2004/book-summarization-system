import { pipeline, env } from "@xenova/transformers";
import { BookMetadata, SummaryResult, TableRow, MindMapNode } from "../types";

// CRITICAL: cache model in browser so it doesn't re-download every time
env.allowLocalModels = false;
env.useBrowserCache = true;

let bertModel: any = null;
let modelLoading: Promise<any> | null = null;

async function initializeModel() {
  if (bertModel) return;
  if (modelLoading) { await modelLoading; return; }
  modelLoading = (async () => {
    console.log("\u{1F916} Loading BERT model\u2026");
    bertModel = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    console.log("\u2705 BERT ready (cached for next time)");
  })();
  await modelLoading;
  modelLoading = null;
}

// Pre-warm: start downloading model as soon as module loads
if (typeof window !== "undefined") {
  setTimeout(() => initializeModel().catch(() => {}), 100);
}

// -- Text cleaning -------------------------------------------------------
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
    .replace(/\s([.,!?;:])/g, "$1")
    .replace(/([.,!?;:])([A-Za-z])/g, "$1 $2")
    .replace(/([.!?])\s*([A-Z])/g, "$1 $2")
    .replace(/([a-z])([A-Z])/g, "$1. $2")
    .trim();
}

function fixSentence(s: string): string {
  let t = s.trim().replace(/\s+/g, " ").replace(/\s([.,!?;:])/g, "$1");
  if (!t || t.length < 10) return "";
  // Fix common punctuation issues
  t = t.replace(/([.,!?;:])([A-Za-z])/g, "$1 $2");
  t = t.replace(/\s{2,}/g, " ");
  t = t.charAt(0).toUpperCase() + t.slice(1);
  if (!/[.!?]$/.test(t)) t += ".";
  return t;
}

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// -- Abbreviations that should NOT split sentences -----------------------
const ABBREVS = new Set([
  "mr", "mrs", "ms", "dr", "prof", "sr", "jr", "st", "vs", "etc",
  "inc", "ltd", "corp", "vol", "fig", "eq", "no", "approx",
  "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "oct", "nov", "dec",
]);

// -- Sentence splitter with abbreviation awareness -----------------------
function splitSentences(text: string): string[] {
  const raw: string[] = [];
  let start = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch !== "." && ch !== "!" && ch !== "?") continue;

    // Check if this is really a sentence boundary
    if (ch === ".") {
      // Look at word before the dot
      const before = text.substring(Math.max(0, i - 15), i);
      const wordMatch = before.match(/(\w+)$/);
      if (wordMatch && ABBREVS.has(wordMatch[1].toLowerCase())) continue;
      // Single uppercase letter (initial) e.g. "J."
      if (wordMatch && wordMatch[1].length === 1 && /[A-Z]/.test(wordMatch[1])) continue;
      // Number decimal e.g. "3.14"
      if (i > 0 && /\d/.test(text[i - 1]) && i < text.length - 1 && /\d/.test(text[i + 1])) continue;
    }

    // Must be followed by space + uppercase, or end of text
    const afterIdx = i + 1;
    if (afterIdx < text.length) {
      const after = text.substring(afterIdx).match(/^\s*(.)/);
      if (!after) continue;
      if (after[1] && !/[A-Z"\u201C(]/.test(after[1])) continue;
    }

    const sentence = text.substring(start, i + 1).trim();
    if (sentence.length >= 15) raw.push(sentence);
    start = i + 1;
  }
  // Remaining text
  const tail = text.substring(start).trim();
  if (tail.length >= 15) raw.push(tail);

  return raw
    .filter(s => {
      if (s.length < 20 || s.length > 600) return false;
      const alpha = (s.match(/[a-zA-Z]/g) || []).length;
      return alpha >= s.length * 0.4;
    })
    .map(s => fixSentence(s))
    .filter(Boolean);
}

// -- Word frequency computation (done ONCE, used everywhere) -------------
function computeWordFreq(text: string): Record<string, number> {
  const freq: Record<string, number> = {};
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  return freq;
}

// -- Score sentences (TF-IDF + position + title boost) -------------------
function scoreSentences(
  sentences: string[],
  freq: Record<string, number>,
  titleWords: Set<string>
): { sentence: string; score: number; idx: number }[] {
  const totalSents = sentences.length || 1;

  return sentences.map((sentence, idx) => {
    const sentWords: string[] = sentence.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const uniqueWords = new Set(sentWords);
    let tfidfSum = 0;
    for (const w of sentWords) tfidfSum += Math.log(1 + (freq[w] || 0));
    const tfidf = tfidfSum / (sentWords.length || 1);
    const relPos = idx / totalSents;
    const posScore = relPos < 0.15 ? 1.5 : relPos < 0.30 ? 1.2 : relPos > 0.85 ? 1.3 : 1.0;
    const titleBoost = sentWords.filter(w => titleWords.has(w)).length * 0.4;
    const diversityScore = uniqueWords.size / (sentWords.length || 1);
    const len = sentence.length;
    const lengthScore = len >= 60 && len <= 200 ? 1.15 : len >= 40 ? 1.0 : 0.8;
    const score = (tfidf * 0.50 + posScore * 0.25 + titleBoost + diversityScore * 0.15) * lengthScore;
    return { sentence, score, idx };
  });
}

// -- Dedup (Jaccard > 65% = too similar) ---------------------------------
function dedup(sentences: string[], alreadyUsed: Set<string> = new Set()): string[] {
  const seen: string[] = [];
  for (const s of sentences) {
    if (alreadyUsed.has(s)) continue;
    const sW = new Set(s.toLowerCase().match(/\b[a-z]{4,}\b/g) || []);
    if (sW.size < 2) continue;
    const isDup = seen.some(prev => {
      const pW = new Set(prev.toLowerCase().match(/\b[a-z]{4,}\b/g) || []);
      const inter = [...sW].filter(w => pW.has(w)).length;
      const union = new Set([...sW, ...pW]).size;
      return union > 0 && inter / union > 0.65;
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

// -- SIMPLIFICATION ENGINE -----------------------------------------------
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
  endeavor: "try", endeavors: "tries",
  commence: "start", commences: "starts", commenced: "started",
  terminate: "end", terminates: "ends", terminated: "ended",
  accomplish: "achieve", accomplishes: "achieves", accomplished: "achieved",
  ascertain: "find out", endeavour: "try",
};

function simplifyToPlainEnglish(raw: string, maxLen = 110): string {
  let s = raw
    .replace(/,\s*which\b[^,.!?]*/gi, "")
    .replace(/,\s*who\b[^,.!?]*/gi, "")
    .replace(/,\s*where\b[^,.!?]*/gi, "")
    .replace(/\([^)]*\)/g, "")
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
    .replace(/\bit is important to note that\b/gi, "")
    .replace(/\bit should be noted that\b/gi, "")
    .replace(/\bon the other hand\b/gi, "but")
    .replace(/^(Furthermore|Moreover|However|Nevertheless|Consequently|Therefore|Thus|Hence|Additionally|Specifically|Notably|Indeed|Also),?\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

  // Swap complex words for simpler ones
  s = s.replace(/\b(\w+)\b/g, (w) => WORD_MAP[w.toLowerCase()] ?? w);

  // If too many commas, keep first three clauses
  const commas = (s.match(/,/g) || []).length;
  if (commas >= 4) {
    const parts = s.split(",");
    const kept = parts.slice(0, 3).join(",").trim();
    if (kept.length > 30) s = kept;
  }

  // Trim to maxLen at a word boundary
  if (s.length > maxLen) {
    const cut = s.lastIndexOf(" ", maxLen - 2);
    s = cut > 30 ? s.slice(0, cut) : s.slice(0, maxLen - 1);
  }

  s = s.trim();
  if (!s) return "";
  // Fix punctuation
  s = s.replace(/\s([.,!?;:])/g, "$1");
  s = s.replace(/([.,!?;:])([A-Za-z])/g, "$1 $2");
  s = s.charAt(0).toUpperCase() + s.slice(1);
  if (!/[.!?]$/.test(s)) s += ".";
  return s;
}

// -- Extract concept name from a sentence --------------------------------
function extractConceptName(sentence: string): string {
  const STRIP_LEAD = /^(The|A|An|This|That|These|Those|Its|Their|Our|In|By|For|With)\s+/i;

  // Try to match subject before a linking/action verb
  const m = sentence.match(
    /^(.{3,60}?)\s+(?:is|are|was|were|can|will|has|have|had|refers? to|means?|involves?|describes?|enables?|allows?|includes?|helps?|plays?|serves?|provides?|represents?|creates?|supports?|determines?|affects?)\b/i
  );

  let phrase: string;
  if (m) {
    phrase = m[1].replace(STRIP_LEAD, "").replace(/[.,;!?]$/g, "").trim();
  } else {
    // Fallback: extract the most meaningful noun phrase from the beginning
    const words = sentence.replace(STRIP_LEAD, "").split(/\s+/);
    // Take words until we hit a common verb or conjunction
    const stopWords = new Set(["is", "are", "was", "were", "has", "have", "had", "can", "will", "and", "but", "or", "which", "that", "when", "where", "while", "if", "so", "then"]);
    const taken: string[] = [];
    for (const w of words) {
      if (stopWords.has(w.toLowerCase()) && taken.length >= 2) break;
      taken.push(w);
      if (taken.length >= 5) break;
    }
    phrase = taken.join(" ").replace(/[.,;!?]$/g, "");
  }

  // Clean up and limit to 5 meaningful words
  phrase = phrase.replace(/\s+/g, " ").trim();
  const finalWords = phrase.split(/\s+/).slice(0, 5);
  return finalWords.join(" ");
}

// -- TABLE: definitional sentences ---------------------------------------
const DEFN_PATTERNS: RegExp[] = [
  /^(.{4,60}?)\s+(?:is|are|was|were)\s+(a |an |the |one |considered |defined )(.{10,})/i,
  /^(.{4,60}?)\s+(?:refers? to|means?|involves?|describes?|represents?|consists? of|defined? as|known as|called)\s+(.{10,})/i,
  /^(.{4,60}?)\s+(?:includes?|contains?|comprises?|provides?|enables?|allows?|plays?|serves?|supports?|creates?|determines?)\s+(.{10,})/i,
  /^(.{4,60}?)\s+(?:can be|may be|should be|must be|has been|have been)\s+(.{10,})/i,
  /^(.{4,60}?)\s+(?:helps?|works?|contributes?|leads?|results?|affects?|influences?)\s+(.{10,})/i,
];

function parseDefinition(sentence: string): TableRow | null {
  for (const pattern of DEFN_PATTERNS) {
    const m = sentence.match(pattern);
    if (!m) continue;
    const concept = extractConceptName(sentence);
    if (!concept || concept.split(/\s+/).length > 6 || concept.length < 3) continue;
    // Use a longer max length to preserve meaning in explanations
    const simplified = simplifyToPlainEnglish(sentence, 160);
    if (!simplified || simplified.length < 15) continue;
    return { concept: cap(concept), explanation: simplified };
  }
  return null;
}

function definitionalScore(sentence: string): number {
  const l = sentence.toLowerCase();
  let bonus = 0;
  if (/\b(?:is|are|was|were)\s+(?:a|an|the)\b/.test(l)) bonus += 0.8;
  if (/\b(?:refers? to|means?|defined? as|known as|called|represents?)\b/.test(l)) bonus += 1.0;
  if (/\b(?:involves?|includes?|describes?|consists? of|plays?|serves?)\b/.test(l)) bonus += 0.6;
  if (/\b(?:important|key|essential|critical|fundamental|significant|crucial|primary|central)\b/.test(l)) bonus += 0.4;
  if (/\b(?:helps?|enables?|supports?|provides?|creates?|determines?|affects?)\b/.test(l)) bonus += 0.5;
  // Longer sentences with definitional patterns tend to be more informative
  if (sentence.length >= 60 && sentence.length <= 250 && bonus > 0) bonus += 0.3;
  return bonus;
}

// -- MIND MAP: cluster bullets into themed branches ----------------------
function buildMindMap(
  title: string,
  bulletPoints: string[],
  tableRows: TableRow[]
): MindMapNode[] {
  // Group concepts from table rows into thematic branches
  const branches: MindMapNode[] = [];
  let nodeId = 0;
  const nextId = () => `mm-${++nodeId}`;

  // Branch 1: Key Concepts (from table rows)
  if (tableRows.length > 0) {
    branches.push({
      id: nextId(),
      label: "Key Concepts",
      children: tableRows.slice(0, 5).map(row => ({
        id: nextId(),
        label: row.concept,
        children: [{
          id: nextId(),
          label: row.explanation.length > 80
            ? row.explanation.substring(0, 77).trimEnd() + "..."
            : row.explanation,
          children: [],
        }],
      })),
    });
  }

  // Branch 2: Main Insights (from bullets)
  if (bulletPoints.length > 0) {
    const insightBullets = bulletPoints.slice(0, 5);
    branches.push({
      id: nextId(),
      label: "Main Insights",
      children: insightBullets.map(bp => ({
        id: nextId(),
        label: bp.length > 80 ? bp.substring(0, 77).trimEnd() + "..." : bp,
        children: [],
      })),
    });
  }

  // Branch 3: Additional Details (remaining bullets)
  if (bulletPoints.length > 5) {
    branches.push({
      id: nextId(),
      label: "Additional Details",
      children: bulletPoints.slice(5, 10).map(bp => ({
        id: nextId(),
        label: bp.length > 80 ? bp.substring(0, 77).trimEnd() + "..." : bp,
        children: [],
      })),
    });
  }

  return branches;
}

// -- Main export ---------------------------------------------------------
export async function generateBookSummary(
  text: string,
  metadata: BookMetadata
): Promise<SummaryResult> {
  const startTime = Date.now();

  try {
    await initializeModel();
    console.log("\u{1F916} Starting BERT extractive summarization\u2026");

    const clean = cleanText(text);
    if (clean.length < 50)
      throw new Error("Document too short. Please provide at least 50 characters of text.");

    const wordCount = text.split(/\s+/).length;
    // Limit text to process for speed - 50K chars is plenty for summarization
    const processText = clean.substring(0, 50_000);
    const titleWords = new Set(metadata.title.toLowerCase().match(/\b[a-z]{3,}\b/g) || []);

    const allSentences = splitSentences(processText);
    if (allSentences.length === 0)
      throw new Error("Could not extract sentences from document. Please check the content.");

    console.log(`\u{1F4DD} ${allSentences.length} sentences extracted`);

    // Compute word frequencies ONCE - reused for all scoring
    const freq = computeWordFreq(processText);

    // Score all sentences ONCE
    const baseScored = scoreSentences(allSentences, freq, titleWords);

    // -- 1. Summary paragraphs -------------------------------------------
    const topN = Math.min(40, baseScored.length);
    const topScored = [...baseScored]
      .sort((a, b) => b.score - a.score)
      .slice(0, topN)
      .sort((a, b) => a.idx - b.idx);

    const selected = dedup(topScored.map(s => s.sentence));
    const usedSentences = new Set(selected);

    const splitPt = Math.ceil(selected.length * 0.45);
    const earlyPool = selected.slice(0, splitPt);
    const latePool = selected.slice(splitPt);

    // Build coherent opening paragraph with title context
    let para1 = buildParagraph(earlyPool, 100, 220);
    if (para1 && !para1.toLowerCase().includes(metadata.title.toLowerCase().split(" ")[0])) {
      para1 = `"${metadata.title}" explores key ideas: ` + para1.charAt(0).toLowerCase() + para1.slice(1);
    }
    para1 = fixSentence(cleanText(para1));

    // Build second paragraph covering the deeper analysis
    const pool2 = latePool.length >= 4 ? latePool : selected.slice(Math.ceil(selected.length * 0.3));
    let para2 = buildParagraph(pool2, 120, 280);
    if (para2 && para1) {
      para2 = "The document further discusses " + para2.charAt(0).toLowerCase() + para2.slice(1);
    }
    para2 = fixSentence(cleanText(para2));

    // Build a third paragraph if enough material is available
    let para3 = "";
    const pool3 = selected.slice(Math.ceil(selected.length * 0.65));
    if (pool3.length >= 3) {
      para3 = buildParagraph(pool3, 80, 180);
      if (para3) {
        para3 = "In summary, " + para3.charAt(0).toLowerCase() + para3.slice(1);
        para3 = fixSentence(cleanText(para3));
      }
    }

    if (!para1 && selected.length > 0) para1 = fixSentence(selected.slice(0, 3).join(" "));
    if (!para2 && selected.length > 3) para2 = fixSentence(selected.slice(3, 8).join(" "));
    if (!para1) para1 = `"${metadata.title}" \u2014 the document did not yield enough extractable text for a full paragraph summary.`;

    // -- 2. Key Insights (bullets) — distilled, meaningful points --------
    const bulletRanked = [...baseScored].sort((a, b) => b.score - a.score);
    const bulletPool = dedup(bulletRanked.map(s => s.sentence), usedSentences);

    const bulletPoints: string[] = [];
    const maxBullets = Math.min(10, Math.max(5, Math.floor(bulletPool.length * 0.25)));

    for (const sent of bulletPool) {
      if (bulletPoints.length >= maxBullets) break;
      // Simplify to plain English for cleaner insights
      let bullet = simplifyToPlainEnglish(sent.trim(), 180);
      if (!bullet || bullet.length < 25) {
        bullet = fixSentence(sent.trim());
      }
      if (bullet.length > 220) {
        const cut = bullet.lastIndexOf(". ", 215);
        bullet = cut > 60 ? bullet.substring(0, cut + 1) : bullet.substring(0, 215).trimEnd() + ".";
      }
      bullet = fixSentence(bullet);
      if (bullet.split(/\s+/).length >= 5 && bullet.length >= 30) {
        bulletPoints.push(bullet);
        usedSentences.add(sent);
      }
    }
    // Fill to minimum 5
    if (bulletPoints.length < 5) {
      for (const sent of bulletPool) {
        if (bulletPoints.length >= 5) break;
        let bullet = simplifyToPlainEnglish(sent.trim(), 180);
        if (!bullet || bullet.length < 25) bullet = fixSentence(sent.trim());
        bullet = fixSentence(bullet);
        if (bullet.split(/\s+/).length >= 5 && bullet.length >= 30 && !bulletPoints.includes(bullet)) {
          bulletPoints.push(bullet);
          usedSentences.add(sent);
        }
      }
    }
    if (bulletPoints.length === 0)
      bulletPoints.push(`"${metadata.title}" \u2014 no standalone key insights could be extracted.`);

    // -- 3. Table rows (definitional sentences) --------------------------
    // First pass: don't exclude usedSentences — table needs the best definitional content
    const defScored = baseScored
      .map(({ sentence, score, idx }) => ({
        sentence,
        score: score + definitionalScore(sentence),
        idx,
      }))
      .sort((a, b) => b.score - a.score);

    const tableRows: TableRow[] = [];
    const usedConcepts = new Set<string>();

    for (const { sentence } of defScored) {
      if (tableRows.length >= 10) break;
      const row = parseDefinition(sentence);
      if (!row) continue;
      const conceptKey = row.concept.toLowerCase();
      if (usedConcepts.has(conceptKey)) continue;
      tableRows.push(row);
      usedConcepts.add(conceptKey);
    }

    // Fallback: use top sentences as concept-explanation pairs with better extraction
    if (tableRows.length < 5) {
      const fallbackPool = dedup(
        [...baseScored].sort((a, b) => b.score - a.score).map(s => s.sentence)
      );
      for (const sent of fallbackPool) {
        if (tableRows.length >= 8) break;
        const concept = extractConceptName(sent);
        const explanation = simplifyToPlainEnglish(sent, 160);
        const conceptKey = concept.toLowerCase();
        if (concept.length > 3 && explanation.length > 20
          && !usedConcepts.has(conceptKey)) {
          tableRows.push({ concept: cap(concept), explanation });
          usedConcepts.add(conceptKey);
        }
      }
    }

    // -- 4. Mind map nodes -----------------------------------------------
    const mindMapNodes = buildMindMap(metadata.title, bulletPoints, tableRows);

    const processingTime = (Date.now() - startTime) / 1000;
    console.log(`\u2705 Done in ${processingTime.toFixed(1)}s \u2014 ${bulletPoints.length} bullets, ${tableRows.length} rows`);

    return {
      id: (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
      metadata,
      fullText: text,
      summaryParagraphs: [para1, para2, para3].filter(Boolean),
      bulletPoints,
      tableRows,
      mindMapNodes,
      wordCount,
      processingTime,
      timestamp: Date.now(),
    };
  } catch (error: any) {
    console.error("\u274C Summarization error:", error);
    throw new Error(error.message || "Failed to generate summary. Please try again.");
  }
}
