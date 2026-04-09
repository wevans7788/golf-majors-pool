import React, { useEffect, useState } from 'react';
import { useGolfData } from '../../hooks/useGolfData';

const Leaderboard = () => {
  const {
    currentLeaderboard,
    tournaments,
    currentMajor,
    loading,
    error,
    fetchLeaderboard,
    lastUpdated
  } = useGolfData();

  const [selectedTournament, setSelectedTournament] = useState('current');

  // Auto-select current major if available
  useEffect(() => {
    if (currentMajor && selectedTournament === 'current') {
      setSelectedTournament(currentMajor.id);
      fetchLeaderboard(currentMajor.id);
    }
  }, [currentMajor, selectedTournament, fetchLeaderboard]);

  const handleTournamentChange = (tournamentId) => {
    setSelectedTournament(tournamentId);
    fetchLeaderboard(tournamentId);
  };

  const getPositionColor = (position) => {
    switch (position) {
      case 1: return 'text-yellow-600 font-bold';
      case 2: return 'text-gray-600 font-semibold';
      case 3: return 'text-orange-600 font-semibold';
      default: return 'text-gray-700';
    }
  };

  const getScoreColor = (total) => {
    if (typeof total !== 'string') return 'text-gray-700';

    if (total.startsWith('-')) return 'text-red-600 font-semibold'; // Under par
    if (total.startsWith('+')) return 'text-blue-600'; // Over par
    return 'text-gray-700'; // Even par or other
  };

  const formatCountry = (country) => {
    const countryFlags = {
      'USA': '🇺🇸', 'ESP': '🇪🇸', 'NIR': '🇬🇧', 'NOR': '🇳🇴',
      'AUS': '🇦🇺', 'RSA': '🇿🇦', 'IRL': '🇮🇪', 'ENG': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      'SCO': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'CAN': '🇨🇦', 'JPN': '🇯🇵', 'KOR': '🇰🇷'
    };
    return countryFlags[country] || '🏌️';
  };

  if (loading) {
    return (
      <div className="golf-card">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded w-8"></div>
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Tournament Selector */}
      <div className="golf-card">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🏆 Tournament Leaderboard</h2>
            {currentLeaderboard && (
              <p className="text-gray-600 mt-1">
                {currentLeaderboard.tournamentName} • Round {currentLeaderboard.round}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <select
              value={selectedTournament}
              onChange={(e) => handleTournamentChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-golf-green focus:border-transparent"
            >
              <option value="current">Current Tournament</option>
              {tournaments.filter(t => t.isMajor).map(tournament => (
                <option key={tournament.id} value={tournament.id}>
                  {tournament.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => fetchLeaderboard(selectedTournament)}
              disabled={loading}
              className="golf-button text-sm disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {lastUpdated && (
          <div className="text-sm text-gray-500 mt-2">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Tournament Status */}
      {currentMajor && (
        <div className="golf-card bg-golf-green text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">🏌️ {currentMajor.name}</h3>
              <p className="opacity-90">{currentMajor.venue}</p>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">Status</div>
              <div className="font-semibold capitalize">{currentMajor.status}</div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="golf-card bg-red-50 border-red-200">
          <div className="text-red-600">
            <h3 className="font-semibold">Error Loading Leaderboard</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="golf-card">
        {!currentLeaderboard?.leaderboard?.length ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">No tournament data available</p>
            <p className="text-sm text-gray-500 mt-2">
              {error ? 'Showing sample data for demo purposes' : 'Check back during major tournaments'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Pos
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Today
                  </th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Thru
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Rounds
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentLeaderboard.leaderboard.map((player, index) => (
                  <tr
                    key={player.player.id || index}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-2">
                      <span className={`text-lg ${getPositionColor(player.position)}`}>
                        {player.position === 1 && '🥇'}
                        {player.position === 2 && '🥈'}
                        {player.position === 3 && '🥉'}
                        {player.position > 3 && `T${player.position}`}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">
                          {formatCountry(player.player.country)}
                        </span>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {player.player.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {player.player.country}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`text-lg font-bold ${getScoreColor(player.scores.total)}`}>
                        {player.scores.total}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={getScoreColor(player.scores.today)}>
                        {player.scores.today}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center text-sm text-gray-600">
                      {player.scores.thru}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-600">
                        {player.scores.rounds?.join(' - ') || 'N/A'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tournament Schedule */}
      {tournaments.length > 0 && (
        <div className="golf-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Upcoming Major Championships</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tournaments.filter(t => t.isMajor).map(tournament => (
              <div
                key={tournament.id}
                className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                  selectedTournament === tournament.id
                    ? 'border-golf-green bg-golf-green bg-opacity-10'
                    : 'border-gray-200 hover:border-golf-green'
                }`}
                onClick={() => handleTournamentChange(tournament.id)}
              >
                <div className="font-semibold text-gray-900 text-sm mb-1">
                  {tournament.name}
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  {tournament.venue}
                </div>
                <div className="text-xs">
                  <span className={`px-2 py-1 rounded-full text-white text-xs ${
                    tournament.status === 'in-progress' ? 'bg-red-500' :
                    tournament.status === 'completed' ? 'bg-gray-500' :
                    'bg-blue-500'
                  }`}>
                    {tournament.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;