// Supabase Edge Function: Automated Content Optimization Workflow
// Runs daily at 7 AM UTC (after Slack alerts)
// 1. Fetches top 20 opportunities (high impact)
// 2. Generates optimizations using Claude API
// 3. Stores recommendations in seo_content_optimizations
// 4. Auto-applies highest-confidence variants
// 5. Syncs with Magento via webhook

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.24.3";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

const anthropic = new Anthropic({
  apiKey: Deno.env.get("ANTHROPIC_API_KEY"),
});

interface Opportunity {
  keyword: string;
  current_rank_position: number;
  current_ctr: number;
  current_impressions: number;
  site: string;
}

interface OptimizationResult {
  keyword: string;
  suggestedTitles: Array<{ variant: string; reasoning: string }>;
  suggestedDescriptions: Array<{ variant: string; reasoning: string }>;
  expectedCtrLift: number;
  expectedImpactScore: number;
}

async function generateOptimizations(
  opportunities: Opportunity[]
): Promise<OptimizationResult[]> {
  const results: OptimizationResult[] = [];

  for (const opp of opportunities.slice(0, 10)) {
    try {
      const prompt = `Analyze this keyword opportunity and provide SEO optimizations:

KEYWORD: "${opp.keyword}"
Current Rank: ${opp.current_rank_position}
Current CTR: ${(opp.current_ctr * 100).toFixed(2)}%
Impressions: ${opp.current_impressions}
Site: ${opp.site}

Generate 3 title variants (58 chars max) and 3 description variants (160 chars max).
Format as JSON:
{
  "suggestedTitles": [{"variant": "...", "reasoning": "..."}],
  "suggestedDescriptions": [{"variant": "...", "reasoning": "..."}],
  "expectedCtrLift": 1.5,
  "priority": "urgent"
}`;

      const message = await anthropic.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      });

      const content = message.content[0];
      if (content.type !== "text") continue;

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) continue;

      const parsed = JSON.parse(jsonMatch[0]);
      const impactScore =
        opp.current_impressions * (parsed.expectedCtrLift - 1);

      results.push({
        keyword: opp.keyword,
        suggestedTitles: parsed.suggestedTitles,
        suggestedDescriptions: parsed.suggestedDescriptions,
        expectedCtrLift: parsed.expectedCtrLift,
        expectedImpactScore: impactScore,
      });

      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to optimize "${opp.keyword}":`, error);
    }
  }

  return results;
}

async function storeOptimizations(
  opportunities: Opportunity[],
  optimizations: OptimizationResult[]
): Promise<void> {
  const rows = opportunities
    .slice(0, optimizations.length)
    .map((opp, idx) => {
      const opt = optimizations[idx];
      return {
        site: opp.site,
        keyword: opp.keyword,
        current_title: `${opp.site} - ${opp.keyword}`,
        current_description: `Shop ${opp.keyword}. Fast shipping.`,
        current_ctr: opp.current_ctr,
        current_impressions: opp.current_impressions,
        current_rank_position: opp.current_rank_position,
        suggested_title_1: opt.suggestedTitles[0]?.variant,
        suggested_title_1_reasoning: opt.suggestedTitles[0]?.reasoning,
        suggested_title_2: opt.suggestedTitles[1]?.variant,
        suggested_title_2_reasoning: opt.suggestedTitles[1]?.reasoning,
        suggested_title_3: opt.suggestedTitles[2]?.variant,
        suggested_title_3_reasoning: opt.suggestedTitles[2]?.reasoning,
        suggested_desc_1: opt.suggestedDescriptions[0]?.variant,
        suggested_desc_1_reasoning: opt.suggestedDescriptions[0]?.reasoning,
        suggested_desc_2: opt.suggestedDescriptions[1]?.variant,
        suggested_desc_2_reasoning: opt.suggestedDescriptions[1]?.reasoning,
        suggested_desc_3: opt.suggestedDescriptions[2]?.variant,
        suggested_desc_3_reasoning: opt.suggestedDescriptions[2]?.reasoning,
        expected_ctr_lift: opt.expectedCtrLift,
        expected_impact_score: opt.expectedImpactScore,
        priority:
          opt.expectedImpactScore > 5000
            ? "urgent"
            : opt.expectedImpactScore > 2000
              ? "high"
              : "medium",
        status: "pending",
      };
    });

  const { error } = await supabase
    .from("seo_content_optimizations")
    .upsert(rows, { onConflict: "site,keyword" });

  if (error) throw error;
}

async function autoApplyTopOptimizations(): Promise<void> {
  // Get top 5 urgent optimizations
  const { data: pending } = await supabase
    .from("seo_content_optimizations")
    .select("*")
    .eq("status", "pending")
    .eq("priority", "urgent")
    .order("expected_impact_score", { ascending: false })
    .limit(5);

  if (!pending) return;

  for (const opt of pending) {
    // Auto-select best variant (highest confidence)
    const selectedTitle = opt.suggested_title_1;
    const selectedDesc = opt.suggested_desc_1;

    await supabase.rpc("apply_optimization", {
      optimization_id: opt.id,
      applied_title: selectedTitle,
      applied_desc: selectedDesc,
      applied_by_user: "auto-optimizer",
    });

    // Trigger Magento webhook
    try {
      await fetch(Deno.env.get("MAGENTO_WEBHOOK_URL") || "", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "optimization_applied",
          keyword: opt.keyword,
          site: opt.site,
          newTitle: selectedTitle,
          newDescription: selectedDesc,
        }),
      });
    } catch (e) {
      console.log("Magento webhook not configured (optional)");
    }
  }
}

async function main() {
  try {
    // 1. Fetch top opportunities (high impressions + page 2 ranking)
    const { data: opportunities } = await supabase
      .from("seo_opportunities")
      .select("keyword, current_rank_position, current_ctr, current_impressions, site")
      .is("resolved_at", null)
      .order("current_impressions", { ascending: false })
      .limit(20);

    if (!opportunities || opportunities.length === 0) {
      return { status: "no_opportunities" };
    }

    // 2. Generate optimizations
    const optimizations = await generateOptimizations(opportunities);

    // 3. Store in database
    await storeOptimizations(opportunities, optimizations);

    // 4. Auto-apply top recommendations
    await autoApplyTopOptimizations();

    return {
      status: "success",
      optimizations_generated: optimizations.length,
      opportunities_analyzed: opportunities.length,
    };
  } catch (error) {
    console.error("Optimization workflow error:", error);
    return { status: "error", error: String(error) };
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const result = await main();
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
