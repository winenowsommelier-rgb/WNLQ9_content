import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface GSCData {
  id: string
  product_id: number
  keyword: string
  rank_position: number
  impressions: number
  clicks: number
  ctr: number
  metric_date: string
}

export interface GA4Data {
  id: string
  product_id: number
  page_path: string
  users: number
  sessions: number
  pageviews: number
  bounce_rate: number
  avg_session_duration: number
  goal_completions: number
  conversion_rate: number
  metric_date: string
}

export interface Regression {
  id: string
  keyword: string
  regression_type: string
  change_percent: number
  alert_level: string
  alert_sent_at: string | null
}

export interface Opportunity {
  id: string
  keyword: string
  current_impressions: number
  current_ctr: number
  priority: string
  detected_at: string
  products: {
    title_en: string
  } | null
}

export interface SyncLog {
  id: string
  sync_type: string
  records_imported: number
  records_updated: number
  status: string
  completed_at: string
  error_message: string | null
}
