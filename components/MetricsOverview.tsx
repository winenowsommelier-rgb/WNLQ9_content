export function MetricsOverview({ gscCount, ga4Count }: { gscCount: number; ga4Count: number }) {
  return (
    <div className="metrics-grid">
      <div className="metric-card">
        <h3>GSC Keywords</h3>
        <div className="value">{gscCount}</div>
        <div className="label">Tracked today</div>
      </div>

      <div className="metric-card">
        <h3>GA4 Pages</h3>
        <div className="value">{ga4Count}</div>
        <div className="label">Tracked today</div>
      </div>

      <div className="metric-card">
        <h3>Status</h3>
        <div className="value" style={{ color: '#388e3c' }}>●</div>
        <div className="label">All systems operational</div>
      </div>
    </div>
  )
}
