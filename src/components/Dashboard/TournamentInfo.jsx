import React from 'react';
import { useGolfData } from '../../hooks/useGolfData';

const TournamentInfo = () => {
  const {
    currentMajor,
    upcomingMajors,
    hasMajorInProgress,
    tournaments,
    loading
  } = useGolfData();

  if (loading) {
    return (
      <div className="golf-card animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-3"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntil = (dateString) => {
    const now = new Date();
    const eventDate = new Date(dateString);
    const diffTime = eventDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'in-progress': return '🔴';
      case 'completed': return '✅';
      case 'scheduled': return '📅';
      default: return '⏳';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in-progress': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Current/Active Tournament
  if (currentMajor) {
    return (
      <div className="golf-card bg-gradient-to-r from-golf-green to-golf-accent text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🏆</span>
              <h2 className="text-xl font-bold">Current Major Championship</h2>
            </div>
            <h3 className="text-2xl font-bold mb-2">{currentMajor.name}</h3>
            <p className="text-lg opacity-90 mb-1">{currentMajor.venue}</p>
            <p className="opacity-80">{formatDate(currentMajor.date)}</p>
          </div>
          <div className="text-right">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              currentMajor.status === 'in-progress'
                ? 'bg-white bg-opacity-20 text-white'
                : 'bg-white text-golf-green'
            }`}>
              {getStatusIcon(currentMajor.status)} {currentMajor.status.toUpperCase()}
            </div>
          </div>
        </div>

        {currentMajor.status === 'in-progress' && (
          <div className="mt-4 p-3 bg-white bg-opacity-10 rounded-lg">
            <p className="text-sm font-medium">🔴 LIVE TOURNAMENT IN PROGRESS</p>
            <p className="text-xs opacity-90 mt-1">
              Check the leaderboard for real-time updates
            </p>
          </div>
        )}
      </div>
    );
  }

  // Upcoming Majors
  return (
    <div className="space-y-4">
      {/* Next Major */}
      {upcomingMajors.length > 0 && (
        <div className="golf-card">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">⏳</span>
            <h2 className="text-xl font-bold text-gray-900">Next Major Championship</h2>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              {upcomingMajors[0].name}
            </h3>
            <p className="text-blue-700 mb-1">{upcomingMajors[0].venue}</p>
            <p className="text-blue-600 text-sm mb-3">{formatDate(upcomingMajors[0].date)}</p>

            {(() => {
              const daysUntil = getDaysUntil(upcomingMajors[0].date);
              return (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {daysUntil > 0 ? `${daysUntil} days to go` : 'Starting soon!'}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* All Major Championships */}
      <div className="golf-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🏌️ 2026 Major Championships
        </h3>

        <div className="space-y-3">
          {tournaments.filter(t => t.isMajor).length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <div className="text-3xl mb-2">📅</div>
              <p>Major tournament schedule will be available soon</p>
            </div>
          ) : (
            tournaments.filter(t => t.isMajor).map((tournament, index) => (
              <div
                key={tournament.id}
                className={`flex items-center justify-between p-4 border rounded-lg ${getStatusColor(tournament.status)}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{tournament.name}</span>
                    <span>{getStatusIcon(tournament.status)}</span>
                  </div>
                  <div className="text-sm opacity-80">
                    {tournament.venue} • {formatDate(tournament.date)}
                  </div>
                </div>

                <div className="text-right">
                  {tournament.status === 'scheduled' && (
                    <div className="text-sm font-medium">
                      {(() => {
                        const daysUntil = getDaysUntil(tournament.date);
                        return daysUntil > 0 ? `${daysUntil}d` : 'Soon';
                      })()}
                    </div>
                  )}
                  {tournament.status === 'in-progress' && (
                    <div className="text-sm font-bold">LIVE</div>
                  )}
                  {tournament.status === 'completed' && (
                    <div className="text-sm">Complete</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pool Status */}
      <div className="golf-card bg-sand">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🎯</span>
          <h3 className="text-lg font-semibold text-gray-900">Pool Status</h3>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Active Major:</span>
            <span className="font-medium">
              {hasMajorInProgress ? 'In Progress 🔴' : 'None 📅'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Next Major:</span>
            <span className="font-medium">
              {upcomingMajors.length > 0 ? upcomingMajors[0].name : 'TBD'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Pool Updates:</span>
            <span className="font-medium text-golf-green">Every 4 hours ⏰</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentInfo;