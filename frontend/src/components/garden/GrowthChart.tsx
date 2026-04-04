// 성장 통계 차트 컴포넌트

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { GardenFlower } from '../../types/garden'

interface GrowthChartProps {
  flowers: GardenFlower[]
  type?: 'line' | 'area' | 'bar'
}

export const GrowthChart: React.FC<GrowthChartProps> = ({
  flowers,
  type = 'area',
}) => {
  // 일별 읽은 구절 수 집계
  const dailyData = useMemo(() => {
    const dataMap = new Map<string, number>()

    flowers.forEach((flower) => {
      const date = new Date(flower.bloomDate).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
      })
      dataMap.set(date, (dataMap.get(date) || 0) + 1)
    })

    return Array.from(dataMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        return dateA.getTime() - dateB.getTime()
      })
      .slice(-30) // 최근 30일
  }, [flowers])

  // 누적 데이터
  const cumulativeData = useMemo(() => {
    let cumulative = 0
    return dailyData.map((item) => {
      cumulative += item.count
      return {
        ...item,
        cumulative,
      }
    })
  }, [dailyData])

  if (dailyData.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
        아직 데이터가 없습니다
      </div>
    )
  }

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={cumulativeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                background: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="cumulative"
              name="누적 구절"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        )

      case 'bar':
        return (
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                background: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="count" name="읽은 구절" fill="#10b981" radius={[8, 8, 0, 0]} />
          </BarChart>
        )

      case 'area':
      default:
        return (
          <AreaChart data={cumulativeData}>
            <defs>
              <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                background: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="cumulative"
              name="누적 구절"
              stroke="#8b5cf6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCumulative)"
            />
          </AreaChart>
        )
    }
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>{renderChart()}</ResponsiveContainer>
    </div>
  )
}
