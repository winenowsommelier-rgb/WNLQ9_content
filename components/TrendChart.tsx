import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface TrendDataPoint {
  date: string
  avgPosition: number
  avgCtr: number
}

interface TrendChartProps {
  data: TrendDataPoint[]
}

export function TrendChart({ data }: TrendChartProps) {
  // Format dates for display
  const chartData = data.map((point) => ({
    ...point,
    dateLabel: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }))

  return (
    <div className="trend-chart-container">
      <div className="chart-grid">
        <div className="chart-wrapper">
          <h3>Average Search Position</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="dateLabel"
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
                reversed
              />
              <Tooltip
                formatter={(value: number) => {
                  const label = arguments[2].dataKey === 'avgPosition'
                    ? `Position: ${value.toFixed(1)}`
                    : `CTR: ${(value * 100).toFixed(2)}%`
                  return label
                }}
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #4B5563',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
              />
              <Line
                type="monotone"
                dataKey="avgPosition"
                stroke="#10B981"
                dot={{ fill: '#10B981', r: 4 }}
                activeDot={{ r: 6 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-wrapper">
          <h3>Average Click-Through Rate (CTR %)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="dateLabel"
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
                tickFormatter={(value: number) => `${(value * 100).toFixed(1)}%`}
              />
              <Tooltip
                formatter={(value: number) => `${(value * 100).toFixed(2)}%`}
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #4B5563',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
              />
              <Line
                type="monotone"
                dataKey="avgCtr"
                stroke="#3B82F6"
                dot={{ fill: '#3B82F6', r: 4 }}
                activeDot={{ r: 6 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#10B981' }}></span>
          <span>Lower position = Better ranking</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#3B82F6' }}></span>
          <span>Higher CTR = More clicks from search results</span>
        </div>
      </div>
    </div>
  )
}
