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
      case 1: return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 2: return 'bg-gray-100 border-gray-300 text-gray-800';
      case 3: return 'bg-orange-100 border-orange-300 text-orange-800';
      default: return 'bg-white border-gray-200 text-gray-700';
    }
  };

  const getRankEmoji = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="golf-card">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            🏆 Pool Standings
          </h2>
          <div className="text-sm text-gray-500">
            {lastUpdated && (
              <>Last updated: {lastUpdated.toLocaleTimeString()}</>
            )}
          </div>
        </div>

        {poolStandings.length > 0 && (
          <p className="text-gray-600 mt-2">
            {poolStandings.length} participants competing
          </p>
        )}
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
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <span className="text-lg">
                          {getRankEmoji(participant.currentRank)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">
                        {participant.name || `Participant ${index + 1}`}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xl font-bold text-golf-green">
                        {participant.totalScore}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-lg">
                        {participant.weeklyScore || 0}
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

        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={fetchData}
            disabled={loading}
            className="golf-button text-sm disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Refresh Data'}
          </button>

          <div className="text-xs text-gray-500">
            Updates automatically every 4 hours
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoolStandings;