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
   * Auto-fetch data on hook initialization since URLs are hardcoded
   */
  useEffect(() => {
    // Since sheets URLs are now hardcoded, automatically fetch data
    fetchData();

    // Set up auto-refresh every 4 hours (14400000 ms)
    const interval = setInterval(fetchData, 4 * 60 * 60 * 1000);

    return () => clearInterval(interval);
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
    isConfigured: true // Always configured since sheet URLs are hardcoded
  };
}

export default useSheetsData;