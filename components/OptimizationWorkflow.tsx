'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Optimization {
  id: string
  site: string
  keyword: string
  status: 'pending' | 'approved' | 'applied' | 'monitoring' | 'completed'
  current_ctr: number
  current_impressions: number
  current_rank_position: number
  expected_ctr_lift: number
  expected_impact_score: number
  priority: string
  suggested_title_1: string
  suggested_title_2: string
  suggested_title_3: string
  suggested_desc_1: string
  suggested_desc_2: string
  suggested_desc_3: string
  selected_title?: string
  selected_description?: string
  applied_at?: string
  ctr_after?: number
  ctr_improvement_percent?: number
  clicks_gained?: number
}

export function OptimizationWorkflow() {
  const [optimizations, setOptimizations] = useState<Optimization[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    loadOptimizations()
    const interval = setInterval(loadOptimizations, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const loadOptimizations = async () => {
    try {
      let query = supabase
        .from('seo_content_optimizations')
        .select('*')
        .order('expected_impact_score', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query.limit(50)
      if (error) throw error
      setOptimizations(data || [])
    } catch (error) {
      console.error('Failed to load optimizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyOptimization = async (id: string, title: string, desc: string) => {
    try {
      const { error } = await supabase.rpc('apply_optimization', {
        optimization_id: id,
        applied_title: title,
        applied_desc: desc,
        applied_by_user: 'dashboard-user',
      })
      if (error) throw error
      await loadOptimizations()
    } catch (error) {
      alert('Failed to apply optimization: ' + String(error))
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#FCA5A5',
      approved: '#FDBA74',
      applied: '#60A5FA',
      monitoring: '#A78BFA',
      completed: '#86EFAC',
    }
    return colors[status] || '#E5E7EB'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '⏳ Pending Review',
      approved: '✓ Approved',
      applied: '🚀 Applied',
      monitoring: '📊 Monitoring',
      completed: '✅ Completed',
    }
    return labels[status] || status
  }

  const stats = {
    total: optimizations.length,
    pending: optimizations.filter((o) => o.status === 'pending').length,
    applied: optimizations.filter((o) => o.status === 'applied').length,
    completed: optimizations.filter((o) => o.status === 'completed').length,
    totalClicks: optimizations
      .filter((o) => o.clicks_gained)
      .reduce((sum, o) => sum + (o.clicks_gained || 0), 0),
  }

  return (
    <div className="optimization-workflow">
      <div className="workflow-header">
        <h2>🔄 Automated Optimization Workflow</h2>
        <p>Real-time tracking from detection → recommendation → implementation → results</p>
      </div>

      {/* Pipeline Stats */}
      <div className="pipeline-stats">
        <div className="stat pending">
          <div className="stat-num">{stats.pending}</div>
          <div className="stat-label">⏳ Pending</div>
        </div>
        <div className="stat applied">
          <div className="stat-num">{stats.applied}</div>
          <div className="stat-label">🚀 Applied</div>
        </div>
        <div className="stat completed">
          <div className="stat-num">{stats.completed}</div>
          <div className="stat-label">✅ Completed</div>
        </div>
        <div className="stat gain">
          <div className="stat-num">+{stats.totalClicks}</div>
          <div className="stat-label">📈 Total Clicks Gained</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="workflow-filters">
        {['all', 'pending', 'applied', 'monitoring', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f)
              loadOptimizations()
            }}
            className={`filter-tab ${filter === f ? 'active' : ''}`}
          >
            {getStatusLabel(f).split(' ')[0]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state">Loading optimizations...</div>
      ) : optimizations.length === 0 ? (
        <div className="empty-state">
          <p>No optimizations in this category. Check back soon!</p>
        </div>
      ) : (
        <div className="optimizations-pipeline">
          {optimizations.map((opt) => (
            <div key={opt.id} className="optimization-card pipeline">
              <div className="card-header pipeline">
                <button
                  className="expand-btn"
                  onClick={() => setExpandedId(expandedId === opt.id ? null : opt.id)}
                >
                  {expandedId === opt.id ? '▼' : '▶'}
                </button>

                <div className="card-title">
                  <h4>{opt.keyword}</h4>
                  <div className="card-meta">
                    <span className="site-badge">{opt.site}</span>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(opt.status) }}
                    >
                      {getStatusLabel(opt.status)}
                    </span>
                  </div>
                </div>

                <div className="card-metrics">
                  <span>📊 {opt.current_impressions.toLocaleString()} impr</span>
                  <span>📈 {(opt.expected_ctr_lift * 100 - 100).toFixed(0)}% lift</span>
                  <span>👆 Rank {opt.current_rank_position}</span>
                </div>
              </div>

              {expandedId === opt.id && (
                <div className="card-content pipeline">
                  <div className="section">
                    <h5>Current Performance</h5>
                    <div className="metric-pair">
                      <div>CTR: {(opt.current_ctr * 100).toFixed(2)}%</div>
                      <div>Expected: {(opt.current_ctr * opt.expected_ctr_lift * 100).toFixed(2)}%</div>
                    </div>
                  </div>

                  {opt.status === 'pending' && (
                    <div className="section variants">
                      <h5>Choose Best Variant</h5>

                      <div className="variants-group">
                        <h6>Titles</h6>
                        {[opt.suggested_title_1, opt.suggested_title_2, opt.suggested_title_3].map(
                          (title, idx) => (
                            <button
                              key={idx}
                              onClick={() =>
                                applyOptimization(
                                  opt.id,
                                  title,
                                  opt.suggested_desc_1
                                )
                              }
                              className="variant-btn"
                            >
                              ✓ Apply: {title}
                            </button>
                          )
                        )}
                      </div>

                      <div className="variants-group">
                        <h6>Descriptions</h6>
                        {[opt.suggested_desc_1, opt.suggested_desc_2, opt.suggested_desc_3].map(
                          (desc, idx) => (
                            <button
                              key={idx}
                              onClick={() =>
                                applyOptimization(
                                  opt.id,
                                  opt.suggested_title_1,
                                  desc
                                )
                              }
                              className="variant-btn small"
                            >
                              ✓ Apply: {desc.substring(0, 50)}...
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {opt.status === 'applied' && (
                    <div className="section">
                      <h5>✓ Applied</h5>
                      <p>
                        <strong>Title:</strong> {opt.selected_title}
                      </p>
                      <p>
                        <strong>Description:</strong> {opt.selected_description}
                      </p>
                      <p className="timestamp">Applied {opt.applied_at}</p>
                    </div>
                  )}

                  {opt.status === 'completed' && opt.ctr_improvement_percent && (
                    <div className="section results">
                      <h5>📊 Results</h5>
                      <div className="result-stat">
                        <div className="label">CTR Improvement</div>
                        <div className="value positive">
                          +{opt.ctr_improvement_percent.toFixed(1)}%
                        </div>
                      </div>
                      <div className="result-stat">
                        <div className="label">Additional Clicks</div>
                        <div className="value positive">+{opt.clicks_gained}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="workflow-footer">
        <p>⏰ Auto-optimizations run daily at 7 AM UTC</p>
        <p>🔄 Results updated every 24 hours</p>
        <button onClick={loadOptimizations} className="refresh-btn">
          🔄 Refresh Now
        </button>
      </div>
    </div>
  )
}
