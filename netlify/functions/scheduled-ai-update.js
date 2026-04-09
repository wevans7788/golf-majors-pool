/**
 * Netlify Scheduled Function: Daily AI Content Generation
 * Runs daily at 10 PM to generate end-of-day analysis and insights
 */

/**
 * Fetch current pool data from Google Sheets
 */
async function fetchPoolData() {
  try {
    const baseUrl = process.env.URL || 'http://localhost:8888';

    // This would call our sheets API to get current data
    // For now, we'll simulate the data structure
    return {
      poolStandings: [
        { name: 'Player 1', totalScore: 25, currentRank: 1 },
        { name: 'Player 2', totalScore: 22, currentRank: 2 },
        { name: 'Player 3', totalScore: 20, currentRank: 3 }
      ],
      poolRules: {
        scoringSystem: {
          'Winner': '10 points',
          'Top 5': '5 points',
          'Top 10': '2 points',
          'Made Cut': '1 point'
        }
      }
    };
  } catch (error) {
    console.error('Failed to fetch pool data:', error);
    return null;
  }
}

/**
 * Fetch current tournament data
 */
async function fetchTournamentData() {
  try {
    const baseUrl = process.env.URL || 'http://localhost:8888';

    // Call our golf API to get current tournament info
    // For now, simulate the response
    return {
      currentMajor: {
        id: 'masters-2026',
        name: 'The Masters Tournament',
        venue: 'Augusta National Golf Club',
        status: 'in-progress',
        date: '2026-04-09'
      },
      currentLeaderboard: {
        tournamentName: 'The Masters Tournament',
        round: 2,
        leaderboard: [
          {
            position: 1,
            player: { name: 'Scottie Scheffler', country: 'USA' },
            scores: { total: '-8', today: '-3' }
          },
          {
            position: 2,
            player: { name: 'Jon Rahm', country: 'ESP' },
            scores: { total: '-6', today: '-2' }
          }
        ]
      }
    };
  } catch (error) {
    console.error('Failed to fetch tournament data:', error);
    return null;
  }
}

/**
 * Generate AI content based on current data
 */
async function generateDailyAIContent(poolData, tournamentData) {
  const results = {
    generated: [],
    errors: [],
    timestamp: new Date().toISOString()
  };

  try {
    // Determine what type of content to generate based on tournament status
    const contentTypes = [];

    if (tournamentData?.currentMajor) {
      if (tournamentData.currentMajor.status === 'in-progress') {
        contentTypes.push('daily_update');
      } else if (tournamentData.currentMajor.status === 'completed') {
        contentTypes.push('tournament_recap');
      }
    } else {
      contentTypes.push('weekly_summary');
    }

    // Generate content for each type
    for (const contentType of contentTypes) {
      try {
        const content = await generateContentByType(contentType, poolData, tournamentData);
        results.generated.push(content);
        console.log(`✅ Generated ${contentType} content`);
      } catch (error) {
        console.error(`❌ Failed to generate ${contentType}:`, error);
        results.errors.push({
          type: contentType,
          error: error.message
        });
      }
    }

  } catch (error) {
    console.error('AI content generation failed:', error);
    results.errors.push({
      type: 'general',
      error: error.message
    });
  }

  return results;
}

/**
 * Generate specific content type using our LLM API
 */
async function generateContentByType(contentType, poolData, tournamentData) {
  const baseUrl = process.env.URL || 'http://localhost:8888';

  // Create appropriate prompt based on content type
  let prompt = '';

  switch (contentType) {
    case 'daily_update':
      prompt = createDailyUpdatePrompt(poolData, tournamentData);
      break;
    case 'tournament_recap':
      prompt = createTournamentRecapPrompt(poolData, tournamentData);
      break;
    case 'weekly_summary':
      prompt = createWeeklySummaryPrompt(poolData, tournamentData);
      break;
    default:
      throw new Error(`Unknown content type: ${contentType}`);
  }

  try {
    // Call our LLM API
    const response = await fetch(`${baseUrl}/api/llm-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        parameters: {
          max_new_tokens: 400,
          temperature: 0.8
        }
      })
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }

    const result = await response.json();

    return {
      type: contentType,
      title: getTitleForContentType(contentType, tournamentData),
      content: result.generated_text,
      generated_at: new Date().toISOString(),
      source: result.source || 'ai'
    };

  } catch (error) {
    // Return fallback content if AI fails
    return {
      type: contentType,
      title: getTitleForContentType(contentType, tournamentData),
      content: getFallbackContent(contentType, poolData, tournamentData),
      generated_at: new Date().toISOString(),
      source: 'fallback'
    };
  }
}

/**
 * Create prompts for different content types
 */
function createDailyUpdatePrompt(poolData, tournamentData) {
  const leader = poolData?.poolStandings?.[0];
  const tournament = tournamentData?.currentMajor;

  return `
Daily Golf Pool Update for ${tournament?.name || 'Current Tournament'}:

POOL STANDINGS:
${poolData?.poolStandings?.slice(0, 5).map(p =>
  `${p.currentRank}. ${p.name}: ${p.totalScore} points`
).join('\n') || 'No standings available'}

TOURNAMENT STATUS: ${tournament?.status || 'Unknown'}
CURRENT LEADER: ${tournamentData?.currentLeaderboard?.leaderboard?.[0]?.player?.name || 'TBD'}

Write a brief daily update (1-2 paragraphs) highlighting:
1. Key tournament developments today
2. How it affects pool standings
3. What to watch for tomorrow

Keep it engaging for pool participants.
`;
}

function createTournamentRecapPrompt(poolData, tournamentData) {
  return `Write a tournament recap for ${tournamentData?.currentMajor?.name || 'the tournament'} focusing on pool implications and final results.`;
}

function createWeeklySummaryPrompt(poolData, tournamentData) {
  return `Write a weekly pool summary with current standings and upcoming opportunities for pool participants.`;
}

/**
 * Get appropriate title for content type
 */
function getTitleForContentType(contentType, tournamentData) {
  const titles = {
    'daily_update': `Daily Update: ${tournamentData?.currentMajor?.name || 'Tournament'}`,
    'tournament_recap': `Recap: ${tournamentData?.currentMajor?.name || 'Tournament'}`,
    'weekly_summary': 'Weekly Pool Summary'
  };
  return titles[contentType] || 'Golf Pool Update';
}

/**
 * Fallback content when AI generation fails
 */
function getFallbackContent(contentType, poolData, tournamentData) {
  const leader = poolData?.poolStandings?.[0];
  const tournament = tournamentData?.currentMajor;

  const fallbacks = {
    'daily_update': `Daily Update: ${tournament?.name || 'Tournament'} action continues with ${leader?.name || 'the current leader'} holding the pool lead. Tournament developments are being closely watched by pool participants for scoring opportunities.`,
    'tournament_recap': `Tournament Recap: ${tournament?.name || 'The tournament'} has concluded with exciting results that have impacted pool standings. Participants should review the final leaderboard for point calculations.`,
    'weekly_summary': `Weekly Summary: Pool competition remains active with ${leader?.name || 'participants'} leading the standings. New tournament opportunities are approaching for additional scoring chances.`
  };

  return fallbacks[contentType] || 'Pool update: Competition continues with exciting developments ahead.';
}

/**
 * Store generated content (placeholder for database storage)
 */
async function storeGeneratedContent(contentResults) {
  // In production, this would store content in a database
  // For now, we'll just log the results

  const storedCount = contentResults.generated.length;

  console.log(`📝 Would store ${storedCount} pieces of generated content`);

  return {
    stored_content_count: storedCount,
    storage_method: 'placeholder',
    content_types: contentResults.generated.map(c => c.type)
  };
}

/**
 * Main scheduled function handler
 */
exports.handler = async (event, context) => {
  console.log('🤖 Starting scheduled AI content generation...');

  const startTime = Date.now();

  try {
    // Fetch current data
    console.log('📊 Fetching current pool and tournament data...');
    const [poolData, tournamentData] = await Promise.all([
      fetchPoolData(),
      fetchTournamentData()
    ]);

    if (!poolData) {
      throw new Error('Failed to fetch pool data');
    }

    // Generate AI content
    console.log('🎯 Generating AI content...');
    const contentResults = await generateDailyAIContent(poolData, tournamentData);

    // Store the generated content
    const storageResults = await storeGeneratedContent(contentResults);

    // Prepare response
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      execution_time: Date.now() - startTime,
      content_generation: contentResults,
      storage: storageResults,
      next_generation: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
    };

    console.log('✅ Scheduled AI generation completed:', {
      generated_count: contentResults.generated.length,
      error_count: contentResults.errors.length,
      execution_time: `${Date.now() - startTime}ms`
    });

    return {
      statusCode: 200,
      body: JSON.stringify(response, null, 2),
      headers: {
        'Content-Type': 'application/json'
      }
    };

  } catch (error) {
    console.error('❌ Scheduled AI generation failed:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        execution_time: Date.now() - startTime
      }, null, 2),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
};

// Helper function to test the scheduled function locally
if (require.main === module) {
  exports.handler({}, {})
    .then(result => {
      console.log('Test result:', JSON.parse(result.body));
    })
    .catch(console.error);
}