/**
 * Hugging Face LLM API Service
 * Generates AI-powered golf pool analysis and commentary
 */

// Configuration for LLM API
const LLM_CONFIG = {
  // Free Hugging Face Inference API endpoint
  baseUrl: '/api/llm-analysis',

  // Model options (we'll use fast, reliable models)
  models: {
    primary: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    fallback: 'microsoft/DialoGPT-medium'
  },

  // Generation parameters
  parameters: {
    max_new_tokens: 500,
    temperature: 0.7,
    do_sample: true,
    top_p: 0.9
  }
};

/**
 * Make request to LLM API through Netlify function
 */
async function makeLLMRequest(prompt, options = {}) {
  try {
    const response = await fetch(LLM_CONFIG.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        model: options.model || LLM_CONFIG.models.primary,
        parameters: {
          ...LLM_CONFIG.parameters,
          ...options.parameters
        }
      })
    });

    if (!response.ok) {
      throw new Error(`LLM API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.generated_text || data.text || 'Unable to generate content';
  } catch (error) {
    console.error('LLM API Error:', error);
    throw new Error(`Failed to generate AI content: ${error.message}`);
  }
}

/**
 * Generate weekly pool summary based on current standings and rules
 */
export async function generatePoolSummary(poolData, poolRules, tournamentData) {
  const { poolStandings, participants } = poolData;
  const { currentLeaderboard, currentMajor } = tournamentData;

  // Create context prompt with pool rules and current data
  const prompt = `
You are a golf analyst providing a weekly summary for a golf majors pool. Use the following information:

POOL RULES:
${JSON.stringify(poolRules.scoringSystem, null, 2)}

CURRENT POOL STANDINGS:
${poolStandings.slice(0, 10).map(p =>
  `${p.currentRank}. ${p.name}: ${p.totalScore} points`
).join('\n')}

CURRENT TOURNAMENT: ${currentMajor?.name || 'No active major'}
${currentLeaderboard ? `
GOLF LEADERBOARD:
${currentLeaderboard.leaderboard.slice(0, 5).map(p =>
  `${p.position}. ${p.player.name} (${p.scores.total})`
).join('\n')}
` : ''}

Please write an engaging weekly pool summary (2-3 paragraphs) that:
1. Highlights the current pool leader and their strategy
2. Mentions interesting tournament developments
3. Provides insights about upcoming opportunities
4. Uses a friendly, conversational tone for golf fans

Focus on the pool competition, not just the tournament results.
`;

  try {
    const summary = await makeLLMRequest(prompt, {
      parameters: { max_new_tokens: 400, temperature: 0.8 }
    });

    return {
      type: 'weekly_summary',
      title: 'Weekly Pool Analysis',
      content: summary.trim(),
      generated_at: new Date().toISOString(),
      tournament: currentMajor?.name || 'Off-season',
      metadata: {
        poolLeader: poolStandings[0]?.name || 'TBD',
        totalParticipants: poolStandings.length,
        activeTournament: currentMajor?.status === 'in-progress'
      }
    };
  } catch (error) {
    return getFallbackSummary(poolData, tournamentData);
  }
}

/**
 * Generate tournament recap after a major championship
 */
export async function generateTournamentRecap(tournamentData, poolData) {
  const { currentLeaderboard, currentMajor } = tournamentData;
  const { poolStandings } = poolData;

  if (!currentLeaderboard || !currentMajor) {
    throw new Error('Tournament data required for recap');
  }

  const prompt = `
You are writing a tournament recap for a golf pool after ${currentMajor.name}.

TOURNAMENT WINNER: ${currentLeaderboard.leaderboard[0]?.player?.name || 'Unknown'}
FINAL LEADERBOARD:
${currentLeaderboard.leaderboard.slice(0, 8).map(p =>
  `${p.position}. ${p.player.name} (${p.scores.total}) - ${p.player.country}`
).join('\n')}

POOL IMPACT:
Pool participants had picks on various players. The tournament results affected pool standings.

Write an exciting 2-3 paragraph recap that:
1. Celebrates the tournament winner and key moments
2. Mentions how the results impacted pool standings
3. Highlights any dramatic finishes or surprises
4. Sets up anticipation for the next major

Use an enthusiastic sports commentary tone.
`;

  try {
    const recap = await makeLLMRequest(prompt, {
      parameters: { max_new_tokens: 450, temperature: 0.9 }
    });

    return {
      type: 'tournament_recap',
      title: `${currentMajor.name} Recap`,
      content: recap.trim(),
      generated_at: new Date().toISOString(),
      tournament: currentMajor.name,
      winner: currentLeaderboard.leaderboard[0]?.player?.name
    };
  } catch (error) {
    return getFallbackRecap(tournamentData);
  }
}

/**
 * Generate player analysis and insights
 */
export async function generatePlayerAnalysis(playerName, playerData, poolContext) {
  const prompt = `
Analyze golfer ${playerName} for a golf pool context.

PLAYER PERFORMANCE:
${playerData ? JSON.stringify(playerData, null, 2) : 'Limited data available'}

POOL CONTEXT:
This player has been selected by pool participants. Provide insights about their recent performance, strengths, and tournament outlook.

Write a 1-2 paragraph analysis that:
1. Summarizes their recent form and key strengths
2. Discusses their major championship history
3. Provides pool strategy insights for participants who picked them

Use an informative but accessible tone for casual golf fans.
`;

  try {
    const analysis = await makeLLMRequest(prompt, {
      parameters: { max_new_tokens: 350 }
    });

    return {
      type: 'player_analysis',
      title: `${playerName} Analysis`,
      content: analysis.trim(),
      generated_at: new Date().toISOString(),
      player: playerName
    };
  } catch (error) {
    return {
      type: 'player_analysis',
      title: `${playerName} Analysis`,
      content: `${playerName} is a skilled golfer competing in major championships. Pool participants who selected this player should monitor their performance throughout the tournament for potential scoring opportunities.`,
      generated_at: new Date().toISOString(),
      player: playerName
    };
  }
}

/**
 * Generate predictions for upcoming tournament
 */
export async function generateTournamentPreview(upcomingTournament, poolData) {
  const { poolStandings } = poolData;

  const prompt = `
Write a preview for the upcoming ${upcomingTournament.name} at ${upcomingTournament.venue}.

TOURNAMENT INFO:
Date: ${upcomingTournament.date}
Venue: ${upcomingTournament.venue}

POOL CONTEXT:
Pool participants have made their picks and are competing for points based on player performance.

Write an exciting 2 paragraph preview that:
1. Builds anticipation for the tournament and venue
2. Discusses potential contenders and dark horses
3. Mentions strategy considerations for pool participants
4. Creates excitement about scoring opportunities

Use an enthusiastic preview tone like a sports broadcaster.
`;

  try {
    const preview = await makeLLMRequest(prompt, {
      parameters: { max_new_tokens: 400, temperature: 0.8 }
    });

    return {
      type: 'tournament_preview',
      title: `${upcomingTournament.name} Preview`,
      content: preview.trim(),
      generated_at: new Date().toISOString(),
      tournament: upcomingTournament.name,
      date: upcomingTournament.date
    };
  } catch (error) {
    return {
      type: 'tournament_preview',
      title: `${upcomingTournament.name} Preview`,
      content: `The ${upcomingTournament.name} at ${upcomingTournament.venue} promises to be an exciting major championship. Pool participants should watch closely as their selected players compete for valuable points in the pool standings.`,
      generated_at: new Date().toISOString(),
      tournament: upcomingTournament.name
    };
  }
}

/**
 * Fallback content for when LLM is unavailable
 */
function getFallbackSummary(poolData, tournamentData) {
  const leader = poolData.poolStandings[0];
  const tournament = tournamentData.currentMajor;

  return {
    type: 'weekly_summary',
    title: 'Weekly Pool Update',
    content: `Pool Update: ${leader?.name || 'TBD'} currently leads the pool standings with ${leader?.totalScore || 0} points. ${tournament ? `The ${tournament.name} is ${tournament.status} at ${tournament.venue}.` : 'No major tournament is currently active.'} Pool participants should stay tuned for the next major championship and scoring opportunities. The competition remains tight with several participants in contention for the top spots.`,
    generated_at: new Date().toISOString(),
    tournament: tournament?.name || 'Off-season'
  };
}

function getFallbackRecap(tournamentData) {
  const tournament = tournamentData.currentMajor;
  const winner = tournamentData.currentLeaderboard?.leaderboard[0];

  return {
    type: 'tournament_recap',
    title: `${tournament?.name || 'Tournament'} Recap`,
    content: `${tournament?.name || 'The tournament'} has concluded${winner ? ` with ${winner.player.name} claiming victory` : ''}. This major championship provided exciting moments and impacted pool standings as participants' picks performed throughout the competition. Looking ahead to the next major, pool members should analyze the results and consider their strategies for upcoming tournaments.`,
    generated_at: new Date().toISOString(),
    tournament: tournament?.name || 'Tournament'
  };
}

/**
 * Test LLM API connectivity
 */
export async function testLLMConnection() {
  try {
    const testPrompt = "Write one sentence about golf: ";
    const result = await makeLLMRequest(testPrompt, {
      parameters: { max_new_tokens: 50 }
    });

    return {
      status: 'success',
      message: 'LLM API connected successfully',
      sample_output: result
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.message,
      fallback: 'Fallback content system available'
    };
  }
}

export default {
  generatePoolSummary,
  generateTournamentRecap,
  generatePlayerAnalysis,
  generateTournamentPreview,
  testLLMConnection
};