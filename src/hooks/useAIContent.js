import { useState, useEffect } from 'react';
import llmApi from '../services/llmApi';

/**
 * Custom hook for managing AI-generated content
 */
export function useAIContent() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastGenerated, setLastGenerated] = useState(null);

  /**
   * Add new AI content to the collection
   */
  const addContent = (newContent) => {
    setContent(prev => [newContent, ...prev.slice(0, 9)]); // Keep only last 10 items
    setLastGenerated(new Date());

    // Store in localStorage for persistence
    try {
      const stored = JSON.parse(localStorage.getItem('golfPoolAIContent') || '[]');
      const updated = [newContent, ...stored.slice(0, 9)];
      localStorage.setItem('golfPoolAIContent', JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to store AI content:', err);
    }
  };

  /**
   * Generate weekly pool summary
   */
  const generateWeeklySummary = async (poolData, poolRules, tournamentData) => {
    setLoading(true);
    setError(null);

    try {
      const summary = await llmApi.generatePoolSummary(poolData, poolRules, tournamentData);
      addContent(summary);
      return summary;
    } catch (err) {
      setError(`Failed to generate summary: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate tournament recap
   */
  const generateTournamentRecap = async (tournamentData, poolData) => {
    setLoading(true);
    setError(null);

    try {
      const recap = await llmApi.generateTournamentRecap(tournamentData, poolData);
      addContent(recap);
      return recap;
    } catch (err) {
      setError(`Failed to generate recap: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate player analysis
   */
  const generatePlayerAnalysis = async (playerName, playerData, poolContext) => {
    setLoading(true);
    setError(null);

    try {
      const analysis = await llmApi.generatePlayerAnalysis(playerName, playerData, poolContext);
      addContent(analysis);
      return analysis;
    } catch (err) {
      setError(`Failed to generate analysis: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate tournament preview
   */
  const generateTournamentPreview = async (upcomingTournament, poolData) => {
    setLoading(true);
    setError(null);

    try {
      const preview = await llmApi.generateTournamentPreview(upcomingTournament, poolData);
      addContent(preview);
      return preview;
    } catch (err) {
      setError(`Failed to generate preview: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Test LLM connection
   */
  const testConnection = async () => {
    setLoading(true);
    try {
      const result = await llmApi.testLLMConnection();
      return result;
    } catch (err) {
      setError(err.message);
      return { status: 'error', message: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear all content
   */
  const clearContent = () => {
    setContent([]);
    localStorage.removeItem('golfPoolAIContent');
  };

  /**
   * Get content by type
   */
  const getContentByType = (type) => {
    return content.filter(item => item.type === type);
  };

  /**
   * Get latest content
   */
  const getLatestContent = (limit = 5) => {
    return content.slice(0, limit);
  };

  /**
   * Load stored content on mount
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem('golfPoolAIContent');
      if (stored) {
        const parsed = JSON.parse(stored);
        setContent(parsed);
      }
    } catch (err) {
      console.warn('Failed to load stored AI content:', err);
    }
  }, []);

  /**
   * Auto-generate content based on data availability
   */
  const autoGenerateContent = async (poolData, tournamentData, poolRules) => {
    if (!poolData?.poolStandings?.length) return;

    // Check if we need new weekly summary (generate weekly)
    const lastSummary = content.find(c => c.type === 'weekly_summary');
    const shouldGenerateWeekly = !lastSummary ||
      (Date.now() - new Date(lastSummary.generated_at).getTime()) > 7 * 24 * 60 * 60 * 1000; // 1 week

    if (shouldGenerateWeekly) {
      try {
        await generateWeeklySummary(poolData, poolRules, tournamentData);
      } catch (err) {
        console.log('Auto-generation failed, will use fallback content');
      }
    }

    // Generate tournament preview if upcoming major
    if (tournamentData?.upcomingMajors?.length > 0) {
      const nextMajor = tournamentData.upcomingMajors[0];
      const hasPreview = content.some(c =>
        c.type === 'tournament_preview' && c.tournament === nextMajor.name
      );

      if (!hasPreview) {
        try {
          await generateTournamentPreview(nextMajor, poolData);
        } catch (err) {
          console.log('Preview generation failed');
        }
      }
    }
  };

  return {
    // Data
    content,
    lastGenerated,

    // State
    loading,
    error,

    // Actions
    generateWeeklySummary,
    generateTournamentRecap,
    generatePlayerAnalysis,
    generateTournamentPreview,
    testConnection,
    clearContent,
    autoGenerateContent,

    // Getters
    getContentByType,
    getLatestContent,

    // Computed values
    totalContent: content.length,
    hasWeeklySummary: content.some(c => c.type === 'weekly_summary'),
    hasRecap: content.some(c => c.type === 'tournament_recap'),
    contentTypes: [...new Set(content.map(c => c.type))]
  };
}

export default useAIContent;