import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { optimizeOpportunities } from '@/lib/content-optimizer'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const site = searchParams.get('site') || undefined

    // Fetch top opportunities
    let query = supabase
      .from('seo_opportunities')
      .select(
        'keyword, current_rank_position, current_ctr, current_impressions, current_title, current_description'
      )
      .is('resolved_at', null)
      .order('current_impressions', { ascending: false })
      .limit(limit)

    if (site) {
      query = query.eq('site', site)
    }

    const { data: opportunities, error } = await query

    if (error) {
      throw new Error(`Failed to fetch opportunities: ${error.message}`)
    }

    if (!opportunities || opportunities.length === 0) {
      return NextResponse.json(
        { message: 'No opportunities found', optimizations: [] },
        { status: 200 }
      )
    }

    // Generate optimizations
    const optimizations = await optimizeOpportunities(
      opportunities.map((o: any) => ({
        keyword: o.keyword,
        current_rank_position: o.current_rank_position,
        current_ctr: o.current_ctr,
        current_impressions: o.current_impressions
      })),
      Object.fromEntries(
        opportunities.map((o: any) => [o.keyword, o.current_title || ''])
      ),
      Object.fromEntries(
        opportunities.map((o: any) => [o.keyword, o.current_description || ''])
      )
    )

    return NextResponse.json(
      {
        status: 'success',
        optimizedCount: optimizations.length,
        totalOpportunitiesAnalyzed: opportunities.length,
        optimizations: optimizations.slice(0, 10) // Top 10 by impact
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Optimization error:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to optimize content',
        error: String(error)
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { keywords = [], site } = body

    if (!keywords.length) {
      return NextResponse.json(
        { message: 'No keywords provided', optimizations: [] },
        { status: 400 }
      )
    }

    // Fetch opportunities for specific keywords
    let query = supabase
      .from('seo_opportunities')
      .select(
        'keyword, current_rank_position, current_ctr, current_impressions, current_title, current_description'
      )
      .in('keyword', keywords)
      .is('resolved_at', null)

    if (site) {
      query = query.eq('site', site)
    }

    const { data: opportunities, error } = await query

    if (error) {
      throw new Error(`Failed to fetch opportunities: ${error.message}`)
    }

    if (!opportunities || opportunities.length === 0) {
      return NextResponse.json(
        { message: 'No opportunities found', optimizations: [] },
        { status: 200 }
      )
    }

    // Generate optimizations
    const optimizations = await optimizeOpportunities(
      opportunities.map((o: any) => ({
        keyword: o.keyword,
        current_rank_position: o.current_rank_position,
        current_ctr: o.current_ctr,
        current_impressions: o.current_impressions
      })),
      Object.fromEntries(
        opportunities.map((o: any) => [o.keyword, o.current_title || ''])
      ),
      Object.fromEntries(
        opportunities.map((o: any) => [o.keyword, o.current_description || ''])
      )
    )

    return NextResponse.json(
      {
        status: 'success',
        optimizedCount: optimizations.length,
        optimizations
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Optimization error:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to optimize content',
        error: String(error)
      },
      { status: 500 }
    )
  }
}
