import { useState, useEffect } from 'react';
import sheetsApi from '../services/sheetsApi';

/**
 * Custom hook for managing Google Sheets data
 */
export function useSheetsData() {
  const [poolStandings, setPoolStandings] = useState([]);
  const [poolRules, setPoolRules] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  /**
   * Fetch all sheet data
   */
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [standingsData, rulesData, participantsData] = await Promise.allSettled([
        sheetsApi.getPoolStandings(),
        sheetsApi.getPoolRules(),
        sheetsApi.getParticipants()
      ]);

      if (standingsData.status === 'fulfilled') {
        setPoolStandings(standingsData.value);
      } else {
        console.error('Failed to fetch pool standings:', standingsData.reason);
      }

      if (rulesData.status === 'fulfilled') {
        setPoolRules(rulesData.value);
      } else {
        console.error('Failed to fetch pool rules:', rulesData.reason);
      }

      if (participantsData.status === 'fulfilled') {
        setParticipants(participantsData.value);
      } else {
        console.error('Failed to fetch participants:', participantsData.reason);
      }

      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Test sheet connection
   */
  const testConnection = async () => {
    setLoading(true);
    try {
      const results = await sheetsApi.testSheetConnection();
      return results;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update sheet configuration
   */
  const updateConfig = (config) => {
    sheetsApi.updateSheetConfig(config);
    // Store config in localStorage for persistence
    localStorage.setItem('golfPoolSheetConfig', JSON.stringify(config));
  };

  /**
   * Load configuration from localStorage
   */
  useEffect(() => {
    const savedConfig = localStorage.getItem('golfPoolSheetConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        sheetsApi.updateSheetConfig(config);
      } catch (err) {
        console.error('Failed to load saved sheet config:', err);
      }
    }
  }, []);

  return {
    // Data
    poolStandings,
    poolRules,
    participants,
    lastUpdated,

    // State
    loading,
    error,

    // Actions
    fetchData,
    testConnection,
    updateConfig,

    // Computed values
    totalParticipants: participants.length,
    isConfigured: poolStandings.length > 0 || participants.length > 0
  };
}

export default useSheetsData;