export const meta = {
  name: "enrich-articles",
  description:
    "Fan out Claude agents to LLM-quality tag un-enriched Content Hub " +
    "articles (no API key). Each agent reads a line-range of input.jsonl, " +
    "classifies every article per the controlled taxonomy, and writes " +
    "out_<batch>.jsonl. Pair with data-hub/scripts/enrich_with_agents.sh: " +
    "`prep` produces the args below, `merge` writes the results back to the DB.",
  args: {
    inputFile: "Absolute path to data/enrich/input.jsonl (from `prep`).",
    outDir: "Absolute path to the data/enrich dir for out_<batch>.jsonl files.",
    total: "Number of input lines (rows) to classify.",
    batchSize: "Lines per agent batch (e.g. 50).",
    model: "Agent model (default 'sonnet').",
  },
};

export default async function ({ args, agent, parallel }) {
  const total = Number(args.total) || 0;
  const batchSize = Math.max(1, Number(args.batchSize) || 50);
  const inputFile = args.inputFile;
  const outDir = args.outDir;
  const model = args.model || "sonnet";
  const nBatches = Math.ceil(total / batchSize);

  // --- Controlled vocabulary (single source of truth for the agents) -------
  // Kept INLINE so each agent prompt is self-contained and can NEVER drift
  // from a file it cannot read. Mirrors data-hub/config/taxonomy.json.
  const TAXONOMY = [
    "CONTROLLED VOCABULARY (use ONLY these exact values):",
    "- primary_category: wine|spirits|food|lifestyle|travel|hospitality|cultural|other",
    "- topic_region: France|Italy|Spain|USA (California)|USA (Other)|Argentina|Chile|Australia|New Zealand|Germany|Portugal|Greece|South Africa|Emerging|Scotland|Ireland|USA|Japan|India|Mexico|Other",
    '- spirits_type (or ""): whisky|gin|rum|vodka|tequila|mezcal|brandy|cognac|liqueur|other',
    "- trend_signals (0+, a JSON list): scarcity/shortage|price_spike|emerging_region|health_angle_positive|health_angle_negative|sustainability_focus|cultural_moment|celebrity_tie|investment_opportunity|counterfeit_warning|award_winning|limited_release|viral_on_social|climate_impact|regulatory_change|technology_innovation",
    "- buyer_persona: casual_drinker|enthusiast|collector",
    "- aeo_citation_opportunity: high|medium|low",
    '- thailand_focus: high|medium|""',
  ].join("\n");

  const batchPrompt = (batch, start, end) =>
    [
      `You are classifying Content Hub articles, batch ${batch} of ${nBatches}.`,
      "",
      `Read lines [${start}, ${end}) (by the 0-based "n" field) from this JSONL file:`,
      `  ${inputFile}`,
      'Each input line is {"n", "url", "title", "excerpt", "source", "vertical"}.',
      "",
      "For EACH article in your range, classify it per this taxonomy:",
      TAXONOMY,
      "",
      "Rules:",
      "- NEVER fabricate specifics. Do not invent critic scores, prices, dates,",
      "  ABV/PPM, awards, ranks, or any number not present in the title/excerpt.",
      "  When unsure, choose the safest broad value (e.g. topic_region 'Other',",
      '  spirits_type "", trend_signals []).',
      "- content_excerpt: a clean, factual, <=300-character summary of the",
      "  article based ONLY on the given title/excerpt. No marketing fluff, no",
      "  invented facts. If the input excerpt is empty, summarize from the title.",
      "- primary_category: keep the article's input `vertical` IF it is a valid",
      "  category value above; otherwise pick the best-fitting valid value.",
      "- trend_signals MUST be a JSON list (use [] if none apply).",
      "",
      "Write your results to:",
      `  ${outDir}/out_${batch}.jsonl`,
      "one JSON object PER LINE, each with EXACTLY these keys:",
      "  {url, content_excerpt, topic_region, spirits_type, trend_signals,",
      "   primary_category, buyer_persona, aeo_citation_opportunity, thailand_focus}",
      "The `url` MUST be copied verbatim from the matching input line (it is the",
      "merge key). Use python to read the input range and write the output file,",
      "e.g.:",
      "  python3 - <<'PY'",
      "  import json",
      `  start, end = ${start}, ${end}`,
      `  rows = [json.loads(l) for l in open(${JSON.stringify(inputFile)})]`,
      "  rows = [r for r in rows if start <= r['n'] < end]",
      "  # ...classify each r into an object as specified above...",
      `  with open(${JSON.stringify(`${outDir}/out_${batch}.jsonl`)}, 'w') as f:`,
      "      for obj in results:",
      "          f.write(json.dumps(obj, ensure_ascii=False) + '\\n')",
      "  PY",
      "",
      "Return {written: <int rows you wrote>, out_file: <the path you wrote>}.",
    ].join("\n");

  const tasks = [];
  for (let batch = 0; batch < nBatches; batch++) {
    const start = batch * batchSize;
    const end = Math.min(start + batchSize, total);
    tasks.push(
      agent(batchPrompt(batch, start, end), {
        label: `enrich batch ${batch} [${start},${end})`,
        phase: "Enrich",
        schema: { written: "int", out_file: "string" },
        model,
      })
    );
  }

  const results = await parallel(tasks);

  const files = results.map((r) => r && r.out_file).filter(Boolean);
  const totalWritten = results.reduce(
    (sum, r) => sum + (r && Number(r.written) ? Number(r.written) : 0),
    0
  );

  return {
    batches: results,
    totalBatches: nBatches,
    totalWritten,
    files,
  };
}
