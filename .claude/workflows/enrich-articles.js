export const meta = {
  name: "enrich-articles",
  description: "Fan out Claude agents to LLM-quality tag un-enriched Content Hub articles (no API key). Pair with data-hub/scripts/enrich_with_agents.sh: prep produces the args, merge writes results back.",
  phases: [{ title: "Enrich", detail: "classify article batches" }],
};

// Args (from enrich_with_agents.sh prep): { inputFile, outDir, total, batchSize, model }
// The runtime may deliver args as a JSON string or an object — handle both.
const A = typeof args === "string" ? JSON.parse(args) : (args || {});
const TOTAL = Number(A.total) || 0;
const BATCH = Math.max(1, Number(A.batchSize) || 50);
const INPUT = A.inputFile;
const OUTDIR = A.outDir;
const MODEL = A.model || "sonnet";
const nBatches = Math.ceil(TOTAL / BATCH);

const TAXONOMY = `
CONTROLLED VOCABULARY — use these EXACT strings, never invent values:
- primary_category: wine | spirits | food | lifestyle | travel | hospitality | cultural | other
- topic_region: France | Italy | Spain | USA (California) | USA (Other) | Argentina | Chile | Australia | New Zealand | Germany | Portugal | Greece | South Africa | Emerging | Scotland | Ireland | USA | Japan | India | Mexico | Other
- spirits_type (ONLY if clearly a spirit, else ""): whisky | gin | rum | vodka | tequila | mezcal | brandy | cognac | liqueur | other
- trend_signals (0+ from): scarcity/shortage | price_spike | emerging_region | health_angle_positive | health_angle_negative | sustainability_focus | cultural_moment | celebrity_tie | investment_opportunity | counterfeit_warning | award_winning | limited_release | viral_on_social | climate_impact | regulatory_change | technology_innovation
- buyer_persona: casual_drinker | enthusiast | collector
- aeo_citation_opportunity: high | medium | low
- thailand_focus: high (clearly about Thailand/Bangkok/Thai cities) | medium (from a Thai outlet but not Thailand-topical) | "" (not Thailand)
`;

const SCHEMA = {
  type: "object",
  properties: { written: { type: "integer" }, out_file: { type: "string" } },
  required: ["written", "out_file"],
};

function buildPrompt(batchIdx) {
  const start = batchIdx * BATCH;
  const end = Math.min(start + BATCH, TOTAL);
  const out = `${OUTDIR}/out_${batchIdx}.jsonl`;
  return `You are an expert wine & spirits market analyst doing high-quality content classification. You ARE the classifier — use judgment, not keyword matching.

TASK: read articles ${start}..${end - 1} (0-indexed line "n") from this JSONL file:
${INPUT}
Each line is {"n","url","title","excerpt","source","vertical"}.

For EACH article, produce an enrichment object:
- url: copy the input "url" verbatim (join key — must match exactly)
- content_excerpt: clean factual 1-sentence summary (<=300 chars). If input excerpt is empty/a slug, infer a GENERAL summary from the title. NEVER fabricate specifics (no invented scores, prices, dates, ABV, awards). Keep general when unsure.
- topic_region: most relevant region, else "Other"
- spirits_type: the spirit type if clearly a spirit, else ""
- trend_signals: JSON array of applicable signals (may be [])
- primary_category: KEEP the input "vertical" if it is one of wine/spirits/food/lifestyle/travel/hospitality; else infer
- buyer_persona: casual_drinker | enthusiast | collector
- aeo_citation_opportunity: high if an AI engine would likely cite it for a buying/recommendation query (guides, rankings, "best", comparisons, definitive explainers); medium for solid educational/news; low for thin/ephemeral
- thailand_focus: per the rule below

${TAXONOMY}

OUTPUT: using python (via Bash), write one JSON object per line to:
${out}
Each line = {"url","content_excerpt","topic_region","spirits_type","trend_signals","primary_category","buyer_persona","aeo_citation_opportunity","thailand_focus"}. trend_signals must be a JSON array. Write ALL ${end - start} articles (read input with python json.loads per line, filter n in [${start},${end}), classify, write). Do not skip any.

Return {"written": <line count>, "out_file": "${out}"}.`;
}

phase("Enrich");
log(`Enriching ${TOTAL} articles in ${nBatches} batches of ${BATCH} (model ${MODEL})...`);

const results = await parallel(
  Array.from({ length: nBatches }, (_, i) => () =>
    agent(buildPrompt(i), {
      label: `enrich batch ${i} (rows ${i * BATCH}-${Math.min((i + 1) * BATCH, TOTAL) - 1})`,
      phase: "Enrich",
      schema: SCHEMA,
      model: MODEL,
    })
  )
);

const ok = results.filter(Boolean);
const totalWritten = ok.reduce((s, r) => s + (r.written || 0), 0);
log(`Done: ${ok.length}/${nBatches} batches, ${totalWritten} articles enriched.`);
return { batches: ok.length, totalBatches: nBatches, totalWritten, files: ok.map((r) => r.out_file) };
