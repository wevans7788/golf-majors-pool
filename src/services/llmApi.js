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
    console.log('🤖 Attempting LLM API request to:', LLM_CONFIG.baseUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

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
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`LLM API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.generated_text || data.text || 'Unable to generate content';

    console.log('✅ LLM API response received:', generatedText.substring(0, 100) + '...');
    return generatedText;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('🚨 LLM API timeout - request took too long');
      throw new Error('AI service timeout - using fallback content');
    }

    console.error('🚨 LLM API Error:', error.message);
    throw new Error(`AI service unavailable: ${error.message}`);
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
You are a hilariously sarcastic golf commentator with a sharp wit providing a weekly roast... I mean "summary" for a golf majors pool. You're not afraid to call out bad picks, celebrate lucky breaks, and add some spicy commentary. Use the following information:

POOL RULES:
${JSON.stringify(poolRules.scoringSystem, null, 2)}

CURRENT POOL STANDINGS (aka "The Leaderboard of Dreams and Broken Hopes"):
${poolStandings.slice(0, 10).map(p =>
  `${p.currentRank}. ${p.name}: ${p.totalScore} points`
).join('\n')}

CURRENT TOURNAMENT: ${currentMajor?.name || 'No active major'}
${currentLeaderboard ? `
ACTUAL GOLF LEADERBOARD (The People Who Can Actually Play):
${currentLeaderboard.leaderboard.slice(0, 5).map(p =>
  `${p.position}. ${p.player.name} (${p.scores.total})`
).join('\n')}
` : ''}

Write a HILARIOUSLY ENTERTAINING weekly pool roast (2-3 paragraphs) that:
1. Mercilessly celebrates the pool leader (but with playful backhanded compliments)
2. Throws shade at participants with terrible picks (all in good fun)
3. Makes witty observations about tournament drama and upsets
4. Includes golf puns, sarcastic commentary, and playful trash talk
5. Ends with dramatic predictions for upcoming scoring opportunities

Remember: Be edgy, funny, and entertaining while keeping it friendly competition banter. Think "roast comedy" meets golf commentary. Make people laugh while they check their scores!
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
You are a wildly entertaining sports broadcaster writing a SPICY tournament recap for ${currentMajor.name} - think if a golf commentator had a few too many beers and decided to tell the REAL story!

TOURNAMENT CHAMPION: ${currentLeaderboard.leaderboard[0]?.player?.name || 'Unknown'} (The Absolute Legend!)
FINAL LEADERBOARD (The Good, The Bad, and The "Did They Even Show Up?"):
${currentLeaderboard.leaderboard.slice(0, 8).map(p =>
  `${p.position}. ${p.player.name} (${p.scores.total}) - ${p.player.country}`
).join('\n')}

POOL CARNAGE REPORT:
Some pool participants are now buying drinks, others are crying into their scorecards. The tournament results have DRAMATICALLY shaken up the pool standings like a snow globe in an earthquake!

Write an ABSOLUTELY HILARIOUS 2-3 paragraph recap that:
1. Dramatically celebrates the winner with over-the-top commentary
2. Roasts any major collapses or choke jobs (playfully!)
3. Makes witty observations about which pool participants struck gold vs. struck out
4. Includes golf puns, dramatic metaphors, and cheeky commentary
5. Builds MAXIMUM hype for the next major with comedy

Be outrageously entertaining! Think "drunk golf commentator meets comedy roast." Make it so funny people will share it with friends!
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
You're a hilariously dramatic golf prophet writing a crystal ball preview for the upcoming ${upcomingTournament.name} at ${upcomingTournament.venue}. You see all, know all, and aren't afraid to make bold (and ridiculous) predictions!

TOURNAMENT INTEL:
Date: ${upcomingTournament.date} (Mark your calendars, peasants!)
Venue: ${upcomingTournament.venue} (Where dreams go to die... or soar!)

POOL PARTICIPANT STATUS:
These brave souls have made their picks and are about to find out if they're golf geniuses or complete disasters. The point-scoring potential is MAXIMUM!

Write an OUTRAGEOUSLY ENTERTAINING 2-paragraph preview that:
1. Builds INSANE hype for the tournament with dramatic metaphors and over-the-top descriptions
2. Makes wickedly funny predictions about contenders, dark horses, and inevitable choke artists
3. Playfully roasts pool participants' strategy decisions
4. Uses golf puns, dramatic flair, and cheeky commentary
5. Ends with a BOLD prediction that will either make you look like a genius or a complete fool

Be ridiculously entertaining! Think "WWE announcer meets golf commentator meets comedy central roast." Make people laugh until they cry!
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

  const edgyComments = [
    `${leader?.name || 'Some mysterious pool wizard'} is absolutely CRUSHING IT with ${leader?.totalScore || 0} points! 🔥`,
    `Meanwhile, everyone else is probably questioning their life choices and googling "how to pick better golfers." 😅`,
    `${tournament ? `The ${tournament.name} is happening at ${tournament.venue}, where dreams are made and pool picks go to die!` : 'No major tournament active, which means more time to stress about your terrible picks! 😬'}`,
    `Stay tuned for more pool carnage and questionable decision-making in the majors! ⛳`
  ];

  return {
    type: 'weekly_summary',
    title: 'Weekly Pool Roast (AI Edition)',
    content: edgyComments.join(' '),
    generated_at: new Date().toISOString(),
    tournament: tournament?.name || 'Off-season Shenanigans'
  };
}

function getFallbackRecap(tournamentData) {
  const tournament = tournamentData.currentMajor;
  const winner = tournamentData.currentLeaderboard?.leaderboard[0];

  const spicyRecap = [
    `🏆 LADIES AND GENTLEMEN, ${tournament?.name || 'THE TOURNAMENT'} IS OFFICIALLY IN THE BOOKS!`,
    winner ? `${winner.player.name} just absolutely DOMINATED the field like they were playing against a bunch of weekend hackers! 🔥` : 'Someone won, we think! 🤷‍♂️',
    `Pool participants are either celebrating like they just won the lottery or crying into their scorecards wondering why they thought that long shot would pay off. 😅`,
    `The pool standings have been OFFICIALLY shuffled like a deck of cards in Vegas! Some folks are buying drinks, others are buying tissues. 🍻😭`,
    `Next major can't come fast enough - time to make some NEW questionable picks and pray to the golf gods! ⛳🙏`
  ];

  return {
    type: 'tournament_recap',
    title: `${tournament?.name || 'Epic Tournament'} RECAP (SPICY EDITION) 🌶️`,
    content: spicyRecap.join(' '),
    generated_at: new Date().toISOString(),
    tournament: tournament?.name || 'Tournament of Champions (and Chokers)'
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