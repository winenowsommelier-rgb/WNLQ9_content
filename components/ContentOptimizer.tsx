'use client'

import { useState } from 'react'

interface OptimizationSuggestion {
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

interface ContentOptimizerProps {
  onOptimizationsReady?: (suggestions: OptimizationSuggestion[]) => void
}

export function ContentOptimizer({ onOptimizationsReady }: ContentOptimizerProps) {
  const [loading, setLoading] = useState(false)
  const [optimizations, setOptimizations] = useState<OptimizationSuggestion[]>([])
  const [error, setError] = useState<string | null>(null)
  const [expandedKeyword, setExpandedKeyword] = useState<string | null>(null)

  const generateOptimizations = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/optimize?limit=20')
      const data = await response.json()

      if (data.status === 'error') {
        setError(data.message)
        return
      }

      setOptimizations(data.optimizations || [])
      if (onOptimizationsReady) {
        onOptimizationsReady(data.optimizations || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate optimizations')
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '#DC2626'
      case 'high':
        return '#F97316'
      case 'medium':
        return '#EAB308'
      case 'low':
        return '#6B7280'
      default:
        return '#6B7280'
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  return (
    <div className="content-optimizer-section">
      <div className="optimizer-header">
        <h2>🤖 AI Content Optimizer</h2>
        <p className="optimizer-subtitle">Generate optimized titles & descriptions to boost CTR</p>
      </div>

      {error && (
        <div className="optimizer-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {optimizations.length === 0 ? (
        <div className="optimizer-cta">
          <button
            onClick={generateOptimizations}
            disabled={loading}
            className="optimizer-button"
          >
            {loading ? '⏳ Generating optimizations...' : '✨ Analyze Top Opportunities'}
          </button>
          <p className="optimizer-info">
            Click to analyze your top 20 opportunities and get AI-generated title & description
            variants optimized for CTR improvement.
          </p>
        </div>
      ) : (
        <>
          <div className="optimizer-stats">
            <div className="stat-box">
              <div className="stat-value">{optimizations.length}</div>
              <div className="stat-label">Optimizations Generated</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">
                {optimizations.reduce((sum, o) => sum + o.expectedImpactScore, 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
              <div className="stat-label">Est. Additional Clicks</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">
                {(optimizations.reduce((sum, o) => sum + o.expectedCtrLift, 0) / optimizations.length).toFixed(1)}x
              </div>
              <div className="stat-label">Avg CTR Lift</div>
            </div>
          </div>

          <div className="optimizations-list">
            {optimizations.map((opt) => (
              <div
                key={opt.keyword}
                className="optimization-card"
                style={{
                  borderLeftColor: getPriorityColor(opt.priority),
                  borderLeftWidth: '4px'
                }}
              >
                <div className="card-header">
                  <button
                    className="expand-btn"
                    onClick={() =>
                      setExpandedKeyword(expandedKeyword === opt.keyword ? null : opt.keyword)
                    }
                  >
                    {expandedKeyword === opt.keyword ? '▼' : '▶'}
                  </button>
                  <div className="card-title-section">
                    <h3>{opt.keyword}</h3>
                    <span
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(opt.priority) }}
                    >
                      {opt.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className="card-metrics">
                    <span className="metric">
                      📊 {opt.currentImpressions.toLocaleString()} impr
                    </span>
                    <span className="metric">
                      📈 {(opt.expectedCtrLift * 100 - 100).toFixed(0)}% CTR lift
                    </span>
                    <span className="metric">👆 Rank {opt.currentRank}</span>
                  </div>
                </div>

                {expandedKeyword === opt.keyword && (
                  <div className="card-content">
                    <div className="current-state">
                      <h4>Current State</h4>
                      <div className="field">
                        <label>Title ({opt.currentTitle.length}/58)</label>
                        <div className="value-box">{opt.currentTitle}</div>
                      </div>
                      <div className="field">
                        <label>Description ({opt.currentDescription.length}/160)</label>
                        <div className="value-box">{opt.currentDescription}</div>
                      </div>
                      <div className="metric-display">
                        <span>Current CTR: {(opt.currentCtr * 100).toFixed(2)}%</span>
                        <span>→</span>
                        <span style={{ fontWeight: 'bold', color: '#10B981' }}>
                          Expected: {(opt.currentCtr * opt.expectedCtrLift * 100).toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    <div className="suggestions">
                      <div className="suggestion-group">
                        <h4>📝 Suggested Titles</h4>
                        {opt.suggestedTitles.map((title, idx) => (
                          <div key={idx} className="suggestion-item">
                            <div className="suggestion-variant">
                              <button
                                className="copy-btn"
                                onClick={() => copyToClipboard(title.variant)}
                                title="Copy to clipboard"
                              >
                                📋
                              </button>
                              <div className="variant-text">
                                <strong>Option {idx + 1}:</strong> {title.variant}
                                <br />
                                <span className="reasoning">{title.reasoning}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="suggestion-group">
                        <h4>📄 Suggested Descriptions</h4>
                        {opt.suggestedDescriptions.map((desc, idx) => (
                          <div key={idx} className="suggestion-item">
                            <div className="suggestion-variant">
                              <button
                                className="copy-btn"
                                onClick={() => copyToClipboard(desc.variant)}
                                title="Copy to clipboard"
                              >
                                📋
                              </button>
                              <div className="variant-text">
                                <strong>Option {idx + 1}:</strong> {desc.variant}
                                <br />
                                <span className="reasoning">{desc.reasoning}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="card-actions">
                      <button className="action-btn primary">
                        ✓ Apply to Magento
                      </button>
                      <button className="action-btn secondary">
                        📋 Copy All
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="optimizer-footer">
            <button onClick={generateOptimizations} disabled={loading} className="refresh-btn">
              🔄 Re-analyze
            </button>
            <p className="info-text">
              💡 These optimizations are AI-generated based on your opportunity analysis. Test changes
              and monitor CTR improvements in Google Search Console.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
