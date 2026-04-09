import { useState, useEffect } from 'react';
import golfApi from '../services/golfApi';

/**
 * Custom hook for managing golf tournament data
 */
export function useGolfData() {
  const [tournaments, setTournaments] = useState([]);
  const [currentLeaderboard, setCurrentLeaderboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  /**
   * Fetch tournament schedule
   */
  const fetchTournaments = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await golfApi.getTournamentSchedule();
      setTournaments(data || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(`Failed to fetch tournaments: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch leaderboard for specific tournament
   */
  const fetchLeaderboard = async (tournamentId = 'current') => {
    setLoading(true);
    setError(null);

    try {
      const data = await golfApi.getTournamentLeaderboard(tournamentId);
      setCurrentLeaderboard(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(`Failed to fetch leaderboard: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get player statistics
   */
  const getPlayerStats = async (playerId) => {
    try {
      return await golfApi.getPlayerStats(playerId);
    } catch (err) {
      console.error('Failed to fetch player stats:', err);
      return null;
    }
  };

  /**
   * Test API connection
   */
  const testConnection = async () => {
    setLoading(true);
    try {
      const results = await golfApi.testGolfApiConnection();
      return results;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Find current major tournament
   */
  const getCurrentMajor = () => {
    const now = new Date();
    console.log('🏌️ Finding current major. Today is:', now.toISOString());

    const currentMajor = tournaments.find(t => {
      if (!t.isMajor) return false;

      const startDate = new Date(t.date);
      const endDate = t.endDate ? new Date(t.endDate) : new Date(startDate.getTime() + 4 * 24 * 60 * 60 * 1000); // 4 days later if no end date

      console.log(`📅 Checking ${t.name}: ${startDate.toISOString()} to ${endDate.toISOString()}`);

      // Tournament is current if we're within 2 days before start or during the tournament
      const daysBefore = (startDate - now) / (1000 * 60 * 60 * 24);
      const daysAfter = (now - endDate) / (1000 * 60 * 60 * 24);

      const isCurrent = daysBefore <= 2 && daysAfter <= 1;
      console.log(`   Days before start: ${daysBefore.toFixed(1)}, Days after end: ${daysAfter.toFixed(1)}, Is current: ${isCurrent}`);

      return isCurrent;
    });

    console.log('🎯 Current major found:', currentMajor?.name || 'None');
    return currentMajor;
  };

  /**
   * Get upcoming major tournaments
   */
  const getUpcomingMajors = () => {
    const now = new Date();
    return tournaments
      .filter(t => t.isMajor && new Date(t.date) > now)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  /**
   * Auto-refresh data on component mount
   */
  useEffect(() => {
    fetchTournaments();
    fetchLeaderboard(); // Fetch current tournament leaderboard
  }, []);

  return {
    // Data
    tournaments,
    currentLeaderboard,
    lastUpdated,

    // State
    loading,
    error,

    // Actions
    fetchTournaments,
    fetchLeaderboard,
    getPlayerStats,
    testConnection,

    // Computed values
    currentMajor: getCurrentMajor(),
    upcomingMajors: getUpcomingMajors(),
    hasMajorInProgress: tournaments.some(t => t.isMajor && t.status === 'in-progress'),
    totalTournaments: tournaments.length
  };
}

export default useGolfData;