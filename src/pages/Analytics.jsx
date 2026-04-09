import React, { useState, useEffect } from 'react';
import { useSheetsData } from '../hooks/useSheetsData';
import { useGolfData } from '../hooks/useGolfData';
import {
  PoolTrendChart,
  ScoreDistributionChart,
  TournamentPerformanceChart,
  PlayerPickChart,
  WeeklyProgressChart,
  ChartContainer
} from '../components/UI/Chart';

const Analytics = () => {
  const { poolStandings, poolRules, isConfigured } = useSheetsData();
  const { tournaments, currentMajor } = useGolfData();

  const [analyticsData, setAnalyticsData] = useState({
    trendData: [],
    distributionData: [],
    performanceData: [],
    pickData: [],
    progressData: []
  });

  // Generate analytics data from pool standings
  useEffect(() => {
    if (poolStandings.length > 0) {
      generateAnalyticsData();
    }
  }, [poolStandings, tournaments]);

  const generateAnalyticsData = () => {
    // Generate trend data (position changes over weeks)
    const trendData = generateTrendData(poolStandings);

    // Generate score distribution data
    const distributionData = poolStandings.map(participant => ({
      participant: participant.name?.split(' ')[0] || 'Unknown', // First name only for display
      totalScore: participant.totalScore || 0,
      weeklyScore: participant.weeklyScore || 0,
      rank: participant.currentRank || 0
    }));

    // Generate tournament performance data
    const performanceData = generatePerformanceData(poolStandings);

    // Generate player pick analysis
    const pickData = generatePickAnalysis(poolStandings);

    // Generate weekly progress data
    const progressData = generateProgressData(poolStandings);

    setAnalyticsData({
      trendData,
      distributionData,
      performanceData,
      pickData,
      progressData
    });
  };

  const generateTrendData = (standings) => {
    // Simulate historical trend data (in production, this would come from stored history)
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Current'];
    const topParticipants = standings.slice(0, 5);

    return weeks.map(week => {
      const weekData = { week };

      topParticipants.forEach((participant, index) => {
        // Simulate historical positions with some variation
        const basePosition = participant.currentRank || (index + 1);
        const variation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        weekData[participant.name] = Math.max(1, basePosition + variation);
      });

      return weekData;
    });
  };

  const generatePerformanceData = (standings) => {
    // Analyze tournament performance categories
    const categories = [
      { name: 'Top 3', value: 0 },
      { name: 'Top 10', value: 0 },
      { name: 'Made Cut', value: 0 },
      { name: 'Missed Cut', value: 0 }
    ];

    standings.forEach(participant => {
      const score = participant.totalScore || 0;
      if (score >= 20) categories[0].value++;
      else if (score >= 10) categories[1].value++;
      else if (score >= 5) categories[2].value++;
      else categories[3].value++;
    });

    return categories.filter(cat => cat.value > 0);
  };

  const generatePickAnalysis = (standings) => {
    // Analyze most popular picks
    const playerCounts = {};

    standings.forEach(participant => {
      if (participant.picks) {
        Object.values(participant.picks).forEach(pick => {
          if (pick) {
            playerCounts[pick] = (playerCounts[pick] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(playerCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([player, picks]) => ({
        player,
        picks,
        percentage: Math.round((picks / standings.length) * 100)
      }));
  };

  const generateProgressData = (standings) => {
    // Simulate weekly progress for top participants
    const weeks = ['W1', 'W2', 'W3', 'W4'];

    return weeks.map((week, index) => ({
      week,
      weeklyPoints: Math.floor(Math.random() * 8) + 2,
      cumulativePoints: (index + 1) * 6 + Math.floor(Math.random() * 10)
    }));
  };

  const getInsightsSummary = () => {
    if (analyticsData.distributionData.length === 0) return null;

    const topScore = Math.max(...analyticsData.distributionData.map(p => p.totalScore));
    const avgScore = analyticsData.distributionData.reduce((sum, p) => sum + p.totalScore, 0) / analyticsData.distributionData.length;
    const leader = analyticsData.distributionData.find(p => p.totalScore === topScore);

    return {
      topScore,
      avgScore: Math.round(avgScore * 10) / 10,
      leader: leader?.participant,
      competitiveness: topScore - avgScore,
      totalParticipants: analyticsData.distributionData.length
    };
  };

  // Analytics are always available since sheets are hardcoded
  // Removed configuration check - data will load automatically

  const insights = getInsightsSummary();

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="golf-card masters-gradient-subtle">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-masters-dark mb-2">Pool Analytics & Insights</h1>
            <p className="text-masters-green">
              Comprehensive analysis and performance trends
            </p>
          </div>
          {currentMajor && (
            <div className="text-right">
              <div className="text-sm text-masters-green/70">Live Tournament</div>
              <div className="font-semibold text-masters-green text-lg">{currentMajor.name}</div>
            </div>
          )}
        </div>
      </div>

      {/* Key Insights Summary */}
      {insights && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="golf-card text-center bg-masters-gold/5 border-masters-gold/20">
            <div className="text-3xl font-bold text-masters-gold">{insights.topScore}</div>
            <div className="text-sm text-masters-dark/70 font-medium">Leading Score</div>
            <div className="text-xs text-masters-green mt-1">{insights.leader}</div>
          </div>
          <div className="golf-card text-center">
            <div className="text-3xl font-bold text-masters-green">{insights.avgScore}</div>
            <div className="text-sm text-masters-dark/70 font-medium">Average Score</div>
          </div>
          <div className="golf-card text-center">
            <div className="text-3xl font-bold text-masters-light">{insights.totalParticipants}</div>
            <div className="text-sm text-masters-dark/70 font-medium">Participants</div>
          </div>
          <div className="golf-card text-center">
            <div className="text-3xl font-bold text-masters-dark">
              {Math.round(insights.competitiveness)}
            </div>
            <div className="text-sm text-masters-dark/70 font-medium">Lead Margin</div>
          </div>
        </div>
      )}

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pool Standings Trend */}
        <ChartContainer
          title="🏆 Position Trends"
          loading={analyticsData.trendData.length === 0}
        >
          {analyticsData.trendData.length > 0 && (
            <PoolTrendChart data={analyticsData.trendData} />
          )}
        </ChartContainer>

        {/* Score Distribution */}
        <ChartContainer
          title="📊 Score Distribution"
          loading={analyticsData.distributionData.length === 0}
        >
          {analyticsData.distributionData.length > 0 && (
            <ScoreDistributionChart data={analyticsData.distributionData} />
          )}
        </ChartContainer>

        {/* Tournament Performance */}
        <ChartContainer
          title="🎯 Performance Categories"
          loading={analyticsData.performanceData.length === 0}
        >
          {analyticsData.performanceData.length > 0 && (
            <TournamentPerformanceChart data={analyticsData.performanceData} />
          )}
        </ChartContainer>

        {/* Popular Picks */}
        <ChartContainer
          title="👥 Popular Player Picks"
          loading={analyticsData.pickData.length === 0}
        >
          {analyticsData.pickData.length > 0 ? (
            <div className="space-y-2">
              {analyticsData.pickData.map((pick, index) => (
                <div key={pick.player} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-medium">{pick.player}</span>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-600">{pick.picks} picks</div>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-golf-green h-2 rounded-full"
                        style={{ width: `${pick.percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-sm font-medium">{pick.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Pick analysis will show when player selections are available
            </div>
          )}
        </ChartContainer>
      </div>

      {/* Weekly Progress Chart - Full Width */}
      <ChartContainer
        title="📈 Weekly Progress Tracking"
        loading={analyticsData.progressData.length === 0}
      >
        {analyticsData.progressData.length > 0 && (
          <WeeklyProgressChart data={analyticsData.progressData} height={250} />
        )}
      </ChartContainer>

      {/* Performance Insights */}
      <div className="golf-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Competitive Analysis</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Pool shows {insights?.competitiveness > 10 ? 'high' : 'moderate'} competitiveness</li>
              <li>• {Math.round(((insights?.topScore - insights?.avgScore) / insights?.avgScore) * 100)}% gap between leader and average</li>
              <li>• Multiple participants remain in contention</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Strategic Recommendations</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Monitor player form before major championships</li>
              <li>• Consider course history and playing conditions</li>
              <li>• Balance high-upside picks with consistent performers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;