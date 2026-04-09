import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts';

/**
 * Pool Standings Trend Chart - Shows position changes over time
 */
export const PoolTrendChart = ({ data, height = 300 }) => {
  const colors = ['#2e7d32', '#388e3c', '#4caf50', '#66bb6a', '#81c784'];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="week"
          stroke="#666"
          fontSize={12}
        />
        <YAxis
          stroke="#666"
          fontSize={12}
          reversed={true} // Lower position numbers are better
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        />
        <Legend />

        {/* Top 5 participants' trend lines */}
        {data.length > 0 && Object.keys(data[0])
          .filter(key => key !== 'week')
          .slice(0, 5)
          .map((participant, index) => (
            <Line
              key={participant}
              type="monotone"
              dataKey={participant}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

/**
 * Score Distribution Bar Chart
 */
export const ScoreDistributionChart = ({ data, height = 300 }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="participant"
          stroke="#666"
          fontSize={12}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis stroke="#666" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '8px'
          }}
        />
        <Bar
          dataKey="totalScore"
          fill="#2e7d32"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="weeklyScore"
          fill="#81c784"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

/**
 * Tournament Performance Pie Chart
 */
export const TournamentPerformanceChart = ({ data, height = 300 }) => {
  const colors = ['#2e7d32', '#388e3c', '#4caf50', '#66bb6a', '#81c784', '#a5d6a7'];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};

/**
 * Player Pick Analysis Radial Chart
 */
export const PlayerPickChart = ({ data, height = 300 }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={data}>
        <RadialBar
          dataKey="picks"
          cornerRadius={10}
          fill="#2e7d32"
          label={{ position: 'insideStart', fill: '#fff' }}
        />
        <Legend
          iconSize={18}
          wrapperStyle={{
            top: '50%',
            right: 0,
            transform: 'translate(0, -50%)',
            lineHeight: '24px'
          }}
        />
        <Tooltip />
      </RadialBarChart>
    </ResponsiveContainer>
  );
};

/**
 * Weekly Progress Chart - Stacked bar showing cumulative progress
 */
export const WeeklyProgressChart = ({ data, height = 300 }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="week" stroke="#666" fontSize={12} />
        <YAxis stroke="#666" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '8px'
          }}
        />
        <Legend />
        <Bar dataKey="weeklyPoints" stackId="a" fill="#81c784" name="Weekly Points" />
        <Bar dataKey="cumulativePoints" stackId="a" fill="#2e7d32" name="Total Points" />
      </BarChart>
    </ResponsiveContainer>
  );
};

/**
 * Custom Tooltip Component
 */
export const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.dataKey}: ${formatter ? formatter(entry.value) : entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * Chart Container Component with Loading and Error States
 */
export const ChartContainer = ({
  title,
  children,
  loading = false,
  error = null,
  className = ""
}) => {
  if (loading) {
    return (
      <div className={`golf-card ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-golf-green border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`golf-card ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="text-2xl mb-2">📊</div>
            <p>Chart data unavailable</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`golf-card ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
};

export default {
  PoolTrendChart,
  ScoreDistributionChart,
  TournamentPerformanceChart,
  PlayerPickChart,
  WeeklyProgressChart,
  ChartContainer,
  CustomTooltip
};