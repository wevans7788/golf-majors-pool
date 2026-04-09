import React, { useEffect } from 'react';
import { useSheetsData } from '../../hooks/useSheetsData';

const PoolStandings = () => {
  const {
    poolStandings,
    poolRules,
    loading,
    error,
    lastUpdated,
    fetchData,
    isConfigured
  } = useSheetsData();

  // Fetch data on component mount
  useEffect(() => {
    if (isConfigured) {
      fetchData();
    }
  }, [isConfigured]);

  // Auto-fetch data since sheets are now hardcoded
  // Removed configuration check - sheets URLs are built into the app

  if (loading) {
    return (
      <div className="golf-card">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="golf-card">
        <h2 className="text-xl font-semibold text-red-600 mb-2">
          ❌ Error Loading Pool Data
        </h2>
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={fetchData} className="golf-button">
          Retry
        </button>
      </div>
    );
  }

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return 'bg-masters-gold/20 border-masters-gold/30 text-masters-dark';
      case 2: return 'bg-gray-50 border-gray-200 text-gray-800';
      case 3: return 'bg-orange-50 border-orange-200 text-orange-800';
      default: return 'bg-white border-masters-green/10 text-masters-dark';
    }
  };

  const getRankDisplay = (rank) => {
    switch (rank) {
      case 1: return <span className="position-badge position-1">1</span>;
      case 2: return <span className="position-badge position-2">2</span>;
      case 3: return <span className="position-badge position-3">3</span>;
      default: return <span className="position-badge position-other">{rank}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="golf-card masters-gradient-subtle">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-masters-dark mb-1">
              Pool Standings
            </h2>
            {poolStandings.length > 0 && (
              <p className="text-masters-green text-sm">
                {poolStandings.length} participants • Masters Tournament 2026
              </p>
            )}
          </div>
          <div className="text-xs text-masters-green/70">
            {lastUpdated && (
              <>Updated: {lastUpdated.toLocaleTimeString()}</>
            )}
          </div>
        </div>
      </div>

      {/* Pool Rules Summary (if available) */}
      {poolRules && (
        <div className="golf-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            📋 Scoring System
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(poolRules.scoringSystem).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="text-sm font-medium text-gray-700">{key}</div>
                <div className="text-lg font-bold text-golf-green">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Standings Table */}
      <div className="golf-card">
        {poolStandings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No pool data available yet.</p>
            <button onClick={fetchData} className="golf-button mt-4">
              Refresh Data
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Rank</th>
                  <th className="text-left py-3 px-4">Participant</th>
                  <th className="text-center py-3 px-4">Total Score</th>
                  <th className="text-center py-3 px-4">Weekly Score</th>
                  <th className="text-left py-3 px-4">Current Picks</th>
                </tr>
              </thead>
              <tbody>
                {poolStandings
                  .sort((a, b) => a.currentRank - b.currentRank)
                  .map((participant, index) => (
                  <tr
                    key={participant.name || index}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${getRankColor(participant.currentRank)}`}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center">
                        {getRankDisplay(participant.currentRank)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">
                        {participant.name || `Participant ${index + 1}`}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-2xl font-bold text-masters-green">
                        {participant.totalScore}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-lg text-masters-green/70 font-medium">
                        +{participant.weeklyScore || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-600">
                        {Object.entries(participant.picks)
                          .filter(([_, pick]) => pick)
                          .map(([tournament, pick]) => (
                            <div key={tournament} className="mb-1">
                              <span className="font-medium capitalize">
                                {tournament}:
                              </span> {pick}
                            </div>
                          ))
                        }
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex justify-between items-center pt-4 border-t border-masters-green/10">
          <button
            onClick={fetchData}
            disabled={loading}
            className="golf-button-secondary text-sm disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Refresh Data'}
          </button>

          <div className="text-xs text-masters-green/70">
            Auto-updates every 4 hours
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoolStandings;