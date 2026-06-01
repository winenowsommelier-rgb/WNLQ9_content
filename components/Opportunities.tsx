import { Opportunity } from '@/lib/supabase'

export function Opportunities({ opportunities }: { opportunities: Opportunity[] }) {
  if (opportunities.length === 0) {
    return (
      <div className="section">
        <h2>💡 Quick Wins</h2>
        <p style={{ color: '#999' }}>No opportunities detected yet</p>
      </div>
    )
  }

  return (
    <div className="section">
      <h2>💡 Quick Wins ({opportunities.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Keyword</th>
            <th>Product</th>
            <th>Impressions</th>
            <th>CTR</th>
            <th>Priority</th>
          </tr>
        </thead>
        <tbody>
          {opportunities.map((opp) => (
            <tr key={opp.id}>
              <td>{opp.keyword}</td>
              <td>{opp.products?.title_en || 'Unknown'}</td>
              <td>{opp.current_impressions}</td>
              <td>{(opp.current_ctr * 100).toFixed(2)}%</td>
              <td>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  background: opp.priority === 'high' ? '#ffebee' : '#fff3e0',
                  color: opp.priority === 'high' ? '#d32f2f' : '#e65100',
                }}>
                  {opp.priority}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
