'use client'

import { useEffect, useState } from 'react'
import { supabase, type GSCData, type GA4Data, type Regression, type Opportunity, type SyncLog } from '@/lib/supabase'
import { MetricsOverview } from '@/components/MetricsOverview'
import { RegressionAlerts } from '@/components/RegressionAlerts'
import { Opportunities } from '@/components/Opportunities'
import { SyncStatus } from '@/components/SyncStatus'

export default function Dashboard() {
  const [gscData, setGscData] = useState<GSCData[]>([])
  const [ga4Data, setGa4Data] = useState<GA4Data[]>([])
  const [regressions, setRegressions] = useState<Regression[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const today = new Date().toISOString().split('T')[0]

        // Fetch GSC data
        const { data: gsc, error: gscErr } = await supabase
          .from('seo_gsc_daily')
          .select('*')
          .eq('metric_date', today)
          .limit(100)

        // Fetch GA4 data
        const { data: ga4, error: ga4Err } = await supabase
          .from('seo_ga4_daily')
          .select('*')
          .eq('metric_date', today)
          .limit(100)

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
          .limit(5)

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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

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

  return (
    <main>
      <MetricsOverview gscCount={gscData.length} ga4Count={ga4Data.length} />
      <SyncStatus logs={syncLogs} />
      <RegressionAlerts regressions={regressions} />
      <Opportunities opportunities={opportunities} />
    </main>
  )
}
