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
    if (!poolData?.poolStandings?.length) {
      console.log('🤖 No pool data available for AI content generation');
      return;
    }

    console.log('🤖 Auto-generating AI content...');

    // Check if we need new weekly summary
    const lastSummary = content.find(c => c.type === 'weekly_summary');
    const shouldGenerateWeekly = !lastSummary ||
      (Date.now() - new Date(lastSummary.generated_at).getTime()) > 7 * 24 * 60 * 60 * 1000; // 1 week

    if (shouldGenerateWeekly) {
      console.log('📊 Generating weekly summary...');
      setLoading(true);

      try {
        // Try real AI generation with timeout
        const summaryPromise = generateWeeklySummary(poolData, poolRules, tournamentData);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI generation timeout')), 5000) // 5 second timeout
        );

        await Promise.race([summaryPromise, timeoutPromise]);
        console.log('✅ AI summary generated successfully');
      } catch (err) {
        console.log('⚠️ AI generation failed, using hilarious fallback:', err.message);

        // Immediate fallback with entertaining content
        const fallbackSummary = generateFallbackWeeklySummary(poolData, tournamentData);
        addContent(fallbackSummary);
      } finally {
        setLoading(false);
      }
    }

    // Generate tournament content if current major exists
    if (tournamentData?.currentMajor) {
      const currentMajor = tournamentData.currentMajor;
      const hasRecap = content.some(c =>
        c.type === 'tournament_recap' && c.tournament === currentMajor.name
      );

      if (!hasRecap) {
        console.log('🏆 Generating tournament recap...');
        try {
          const fallbackRecap = generateFallbackTournamentRecap(currentMajor, poolData);
          addContent(fallbackRecap);
        } catch (err) {
          console.log('Recap generation failed:', err.message);
        }
      }
    }
  };

  /**
   * Generate entertaining fallback content immediately
   */
  const generateFallbackWeeklySummary = (poolData, tournamentData) => {
    const leader = poolData.poolStandings[0];
    const tournament = tournamentData?.currentMajor;

    const spicyComments = [
      `🔥 ${leader?.name || 'The Mystery Leader'} is absolutely DOMINATING with ${leader?.totalScore || 0} points!`,
      `Meanwhile, everyone else is probably stress-eating and questioning their golf knowledge. 😅`,
      tournament ?
        `The ${tournament.name} is happening right now at ${tournament.venue}, where dreams are made and pool picks go to die! ⛳` :
        'No major tournament active, so we have more time to analyze our questionable life choices! 🤔',
      `Pool participants are either celebrating like they just discovered fire, or crying into their scorecards. 🍻😭`,
      `Next update coming soon with more roasts, hot takes, and pool carnage! Stay tuned! 📺🔥`
    ];

    return {
      type: 'weekly_summary',
      title: 'Weekly Pool Roast (Instant Comedy Edition) 🌶️',
      content: spicyComments.join(' '),
      generated_at: new Date().toISOString(),
      tournament: tournament?.name || 'Off-Season Shenanigans',
      metadata: {
        poolLeader: leader?.name || 'TBD',
        totalParticipants: poolData.poolStandings.length,
        activeTournament: tournament?.status === 'in-progress',
        source: 'instant_fallback'
      }
    };
  };

  const generateFallbackTournamentRecap = (tournament, poolData) => {
    const recapLines = [
      `🏆 THE ${tournament.name.toUpperCase()} IS ABSOLUTELY ELECTRIC!`,
      `Augusta National is serving up drama hotter than a Georgia summer! 🌡️`,
      `Pool participants are either buying champagne or buying tissues - no in-between! 🍾😭`,
      `The leaderboard is tighter than a golf grip in a lightning storm! ⚡`,
      `Some folks are looking like geniuses, others like they picked names out of a hat while blindfolded! 🎩👨‍🦯`,
      `Stay tuned for more Masters mayhem and pool pandemonium! 📺🔥`
    ];

    return {
      type: 'tournament_recap',
      title: `${tournament.name} LIVE DRAMA UPDATE! 🎭`,
      content: recapLines.join(' '),
      generated_at: new Date().toISOString(),
      tournament: tournament.name,
      metadata: {
        tournamentStatus: tournament.status,
        round: tournament.round || 2,
        source: 'instant_fallback'
      }
    };
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

    // Fallback generators (exposed for manual use)
    generateFallbackWeeklySummary,
    generateFallbackTournamentRecap,

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