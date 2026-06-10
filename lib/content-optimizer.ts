import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export interface OpportunityOptimization {
  keyword: string
  currentTitle: string
  currentDescription: string
  currentCtr: number
  currentImpressions: number
  currentRank: number
  suggestedTitles: Array<{ variant: string; reasoning: string }>
  suggestedDescriptions: Array<{ variant: string; reasoning: string }>
  expectedCtrLift: number
  expectedImpactScore: number
  priority: 'urgent' | 'high' | 'medium' | 'low'
}

interface CompetitorData {
  position: number
  title: string
  description: string
  url: string
}

async function analyzeOpportunity(
  keyword: string,
  currentTitle: string,
  currentDescription: string,
  currentCtr: number,
  currentImpressions: number,
  currentRank: number,
  competitorData?: CompetitorData[]
): Promise<OpportunityOptimization> {
  const competitorAnalysis = competitorData
    ? `Top ranking competitors:\n${competitorData
        .map(
          (c) =>
            `Position ${c.position}: "${c.title}"\n${c.description}\n(${c.url})`
        )
        .join('\n\n')}`
    : 'No competitor data available'

  const prompt = `You are an SEO expert specializing in title tag and meta description optimization for e-commerce.

KEYWORD: "${keyword}"
CURRENT STATE:
- Title: "${currentTitle}"
- Description: "${currentDescription}"
- Current CTR: ${(currentCtr * 100).toFixed(2)}%
- Monthly Impressions: ${currentImpressions.toLocaleString()}
- Current Rank Position: ${currentRank}

${competitorAnalysis}

Your task:
1. Analyze why the current title/description underperform (low CTR despite impressions)
2. Generate 3 alternative titles (58 chars max, SERP-optimized)
3. Generate 3 alternative descriptions (160 chars max, CTR-boosting)
4. Estimate expected CTR improvement (0-2x multiplier)
5. Explain the reasoning for each change

Format your response as JSON with this structure:
{
  "analysis": "2-3 sentences explaining the current weakness",
  "suggestedTitles": [
    {
      "variant": "title text here (under 58 chars)",
      "reasoning": "why this is better"
    }
  ],
  "suggestedDescriptions": [
    {
      "variant": "description text here (under 160 chars)",
      "reasoning": "why this drives clicks"
    }
  ],
  "expectedCtrLift": 1.5,
  "confidence": 0.85
}

Remember:
- Titles should include the brand/key modifier + main keyword
- Descriptions should have a clear value prop + CTA
- Focus on click-through rate, not just keywords
- Be specific and actionable`

  const message = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new Error('Expected text response from Claude')
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Could not parse Claude response as JSON')
  }

  const analysis = JSON.parse(jsonMatch[0])

  // Calculate impact score
  const ctrLift = analysis.expectedCtrLift || 1.5
  const expectedNewCtr = currentCtr * ctrLift
  const estimatedNewClicks = (currentImpressions / 100) * expectedNewCtr * 100
  const currentClicks = (currentImpressions / 100) * currentCtr * 100
  const additionalClicks = estimatedNewClicks - currentClicks

  let priority: 'urgent' | 'high' | 'medium' | 'low' = 'medium'
  if (currentImpressions > 1000 && currentRank >= 11) priority = 'urgent'
  else if (currentImpressions > 500) priority = 'high'
  else if (currentImpressions > 100) priority = 'medium'
  else priority = 'low'

  return {
    keyword,
    currentTitle,
    currentDescription,
    currentCtr,
    currentImpressions,
    currentRank,
    suggestedTitles: analysis.suggestedTitles || [],
    suggestedDescriptions: analysis.suggestedDescriptions || [],
    expectedCtrLift: ctrLift,
    expectedImpactScore: additionalClicks,
    priority
  }
}

export async function optimizeOpportunities(
  opportunities: Array<{
    keyword: string
    current_rank_position: number
    current_ctr: number
    current_impressions: number
  }>,
  productTitles?: Record<string, string>,
  productDescriptions?: Record<string, string>
): Promise<OpportunityOptimization[]> {
  const results: OpportunityOptimization[] = []

  // Process in priority order: highest impressions + page 2 = fastest wins
  const sorted = [...opportunities].sort((a, b) => {
    const aScore = a.current_impressions * (a.current_rank_position >= 11 ? 2 : 1)
    const bScore = b.current_impressions * (b.current_rank_position >= 11 ? 2 : 1)
    return bScore - aScore
  })

  for (const opp of sorted.slice(0, 20)) {
    try {
      const currentTitle = productTitles?.[opp.keyword] || `Wine - ${opp.keyword}`
      const currentDesc = productDescriptions?.[opp.keyword] || 'Shop our selection.'

      const optimization = await analyzeOpportunity(
        opp.keyword,
        currentTitle,
        currentDesc,
        opp.current_ctr,
        opp.current_impressions,
        opp.current_rank_position
      )

      results.push(optimization)

      // Rate limit: Claude API
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`Failed to optimize "${opp.keyword}":`, error)
    }
  }

  return results.sort((a, b) => b.expectedImpactScore - a.expectedImpactScore)
}
