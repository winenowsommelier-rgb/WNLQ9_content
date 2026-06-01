import { SyncLog } from '@/lib/supabase'

export function SyncStatus({ logs }: { logs: SyncLog[] }) {
  const lastSync = logs[0]
  const gscLog = logs.find(l => l.sync_type === 'gsc')
  const ga4Log = logs.find(l => l.sync_type === 'ga4')

  return (
    <div className="section">
      <h2>🔄 Sync Status</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {gscLog && (
          <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
            <div style={{ fontWeight: 600 }}>Google Search Console</div>
            <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
              Status: <span style={{ color: gscLog.status === 'completed' ? '#388e3c' : '#d32f2f' }}>
                {gscLog.status === 'completed' ? '✓' : '✗'} {gscLog.status}
              </span>
              <br />
              Records: {gscLog.records_imported} imported, {gscLog.records_updated} updated
              <br />
              {gscLog.completed_at && (
                <>Last: {new Date(gscLog.completed_at).toLocaleTimeString()}</>
              )}
            </div>
          </div>
        )}

        {ga4Log && (
          <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
            <div style={{ fontWeight: 600 }}>Google Analytics 4</div>
            <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
              Status: <span style={{ color: ga4Log.status === 'completed' ? '#388e3c' : '#d32f2f' }}>
                {ga4Log.status === 'completed' ? '✓' : '✗'} {ga4Log.status}
              </span>
              <br />
              Records: {ga4Log.records_imported} imported, {ga4Log.records_updated} updated
              <br />
              {ga4Log.completed_at && (
                <>Last: {new Date(ga4Log.completed_at).toLocaleTimeString()}</>
              )}
            </div>
          </div>
        )}

        {lastSync && (
          <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
            <div style={{ fontWeight: 600 }}>Last Sync</div>
            <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
              {new Date(lastSync.completed_at).toLocaleString()}
              {lastSync.error_message && (
                <div style={{ color: '#d32f2f', marginTop: '0.5rem' }}>
                  Error: {lastSync.error_message}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
