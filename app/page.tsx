'use client'

import { useEffect, useState } from 'react'
import { supabase, type GSCData, type GA4Data, type Regression, type Opportunity, type SyncLog } from '@/lib/supabase'
import { MetricsOverview } from '@/components/MetricsOverview'
import { RegressionAlerts } from '@/components/RegressionAlerts'
import { Opportunities } from '@/components/Opportunities'
import { SyncStatus } from '@/components/SyncStatus'
import { TrendChart } from '@/components/TrendChart'

export default function Dashboard() {
  const [gscData, setGscData] = useState<GSCData[]>([])
  const [ga4Data, setGa4Data] = useState<GA4Data[]>([])
  const [regressions, setRegressions] = useState<Regression[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Date range state
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date()
    date.setDate(date.getDate() - 7)
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState<string>(() => {
    const date = new Date()
    return date.toISOString().split('T')[0]
  })

  // Trend data for 7-day chart
  const [trendData, setTrendData] = useState<Array<{date: string; avgPosition: number; avgCtr: number}>>([])

  // Search/filter state
  const [opportunitySearch, setOpportunitySearch] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch GSC data for date range
        const { data: gsc, error: gscErr } = await supabase
          .from('seo_gsc_daily')
          .select('*')
          .gte('metric_date', startDate)
          .lte('metric_date', endDate)
          .limit(1000)

        // Fetch GA4 data for date range
        const { data: ga4, error: ga4Err } = await supabase
          .from('seo_ga4_daily')
          .select('*')
          .gte('metric_date', startDate)
          .lte('metric_date', endDate)
          .limit(1000)

        // Fetch regressions
        const { data: regs, error: regsErr } = await supabase
          .from('seo_regression_alerts')
          .select('*')
          .eq('alert_level', 'critical')
          .order('created_at', { ascending: false })
          .limit(10)

        // Fetch opportunities
        const { data: opps, error: oppsErr } = await supabase
          .from('seo_opportunities')
          .select('*, products(id, title_en, sku)')
          .is('resolved_at', null)
          .order('priority', { ascending: false })
          .limit(50)

        // Fetch sync logs
        const { data: logs, error: logsErr } = await supabase
          .from('seo_sync_log')
          .select('*')
          .order('completed_at', { ascending: false })
          .limit(5)

        if (gscErr) throw gscErr
        if (ga4Err) throw ga4Err
        if (regsErr) throw regsErr
        if (oppsErr) throw oppsErr
        if (logsErr) throw logsErr

        setGscData(gsc || [])
        setGa4Data(ga4 || [])
        setRegressions(regs || [])
        setOpportunities(opps || [])
        setSyncLogs(logs || [])

        // Calculate trend data
        if (gsc && ga4) {
          calculateTrends(gsc, ga4)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [startDate, endDate])

  const calculateTrends = (gsc: GSCData[], ga4: GA4Data[]) => {
    const trendMap: {[key: string]: {position: number[], ctr: number[], count: number}} = {}

    // Aggregate GSC by date
    gsc.forEach((row) => {
      const date = row.metric_date
      if (!trendMap[date]) {
        trendMap[date] = { position: [], ctr: [], count: 0 }
      }
      if (row.position) trendMap[date].position.push(row.position)
    })

    // Aggregate GA4 by date
    ga4.forEach((row) => {
      const date = row.metric_date
      if (!trendMap[date]) {
        trendMap[date] = { position: [], ctr: [], count: 0 }
      }
      if (row.ctr) trendMap[date].ctr.push(row.ctr)
    })

    // Calculate averages
    const trend = Object.entries(trendMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        avgPosition: data.position.length > 0
          ? Math.round((data.position.reduce((a, b) => a + b, 0) / data.position.length) * 10) / 10
          : 0,
        avgCtr: data.ctr.length > 0
          ? Math.round((data.ctr.reduce((a, b) => a + b, 0) / data.ctr.length) * 100) / 100
          : 0
      }))

    setTrendData(trend)
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  if (loading) {
    return (
      <main>
        <div className="loading">Loading dashboard...</div>
      </main>
    )
  }

  if (error) {
    return (
      <main>
        <div className="error">
          <strong>Error loading data:</strong> {error}
        </div>
      </main>
    )
  }

  // Filter opportunities by search term
  const filteredOpportunities = opportunities.filter((opp) => {
    const searchLower = opportunitySearch.toLowerCase()
    return (
      opp.keyword?.toLowerCase().includes(searchLower) ||
      opp.topic?.toLowerCase().includes(searchLower)
    )
  })

  // Export opportunities to CSV
  const handleExportCSV = () => {
    if (filteredOpportunities.length === 0) {
      alert('No opportunities to export')
      return
    }

    const headers = ['Keyword', 'Topic', 'Impressions', 'CTR %', 'Priority', 'Product URL']
    const rows = filteredOpportunities.map((opp) => [
      opp.keyword || '',
      opp.topic || '',
      opp.impressions || 0,
      ((opp.ctr || 0) * 100).toFixed(2),
      opp.priority || '',
      opp.product_url || ''
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `seo-opportunities-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <main>
      <div className="dashboard-header">
        <h1>SEO Automation Dashboard</h1>
        <button onClick={handleRefresh} className="refresh-btn">🔄 Refresh</button>
      </div>

      {/* Date Range Picker */}
      <div className="date-range-section">
        <div className="date-range-controls">
          <label>
            Start Date:
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label>
            End Date:
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
        </div>
        <div className="date-range-info">
          Showing {gscData.length} GSC metrics and {ga4Data.length} GA4 metrics
        </div>
      </div>

      <MetricsOverview gscCount={gscData.length} ga4Count={ga4Data.length} />
      <SyncStatus logs={syncLogs} />

      {/* Trend Charts */}
      {trendData.length > 0 && (
        <div className="trend-section">
          <h2>7-Day Trends</h2>
          <TrendChart data={trendData} />
        </div>
      )}

      <RegressionAlerts regressions={regressions} />

      {/* Opportunities with Search */}
      <div className="opportunities-section">
        <div className="opportunities-header">
          <h2>SEO Opportunities</h2>
          <div className="opportunities-controls">
            <input
              type="text"
              placeholder="🔍 Search keywords..."
              value={opportunitySearch}
              onChange={(e) => setOpportunitySearch(e.target.value)}
              className="search-box"
            />
            <button onClick={handleExportCSV} className="export-btn">
              📥 Export CSV ({filteredOpportunities.length})
            </button>
          </div>
        </div>
        <Opportunities opportunities={filteredOpportunities} />
      </div>
    </main>
  )
}
