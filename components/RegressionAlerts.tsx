import { Regression } from '@/lib/supabase'

export function RegressionAlerts({ regressions }: { regressions: Regression[] }) {
  if (regressions.length === 0) {
    return (
      <div className="section">
        <h2>⚠️ Critical Regressions</h2>
        <div className="alert success">✅ No critical regressions detected</div>
      </div>
    )
  }

  return (
    <div className="section">
      <h2>⚠️ Critical Regressions ({regressions.length})</h2>
      {regressions.slice(0, 5).map((reg) => (
        <div key={reg.id} className="alert">
          <strong>{reg.keyword}</strong> • {reg.regression_type}
          <br />
          <span style={{ fontSize: '0.9rem' }}>
            {Math.abs(reg.change_percent).toFixed(1)}% drop
            {reg.alert_sent_at && ` • Alerted: ${new Date(reg.alert_sent_at).toLocaleDateString()}`}
          </span>
        </div>
      ))}
    </div>
  )
}
