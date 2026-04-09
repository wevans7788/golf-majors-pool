/**
 * Netlify Scheduled Function: Weekly Pool Summary
 * Runs every Monday at 10 AM to generate comprehensive weekly analysis
 */

/**
 * Fetch comprehensive pool data for weekly analysis
 */
async function fetchWeeklyPoolData() {
  try {
    // In production, this would fetch from actual APIs
    // For now, simulate comprehensive pool data
    return {
      poolStandings: [
        {
          name: 'Sarah Johnson',
          totalScore: 28,
          currentRank: 1,
          weeklyScore: 8,
          picks: {
            masters: 'Scottie Scheffler',
            pga: 'Jon Rahm',
            usOpen: 'Rory McIlroy',
            british: 'Xander Schauffele'
          }
        },
        {
          name: 'Mike Chen',
          totalScore: 25,
          currentRank: 2,
          weeklyScore: 5,
          picks: {
            masters: 'Jon Rahm',
            pga: 'Scottie Scheffler',
            usOpen: 'Viktor Hovland',
            british: 'Cameron Smith'
          }
        },
        {
          name: 'Alex Rodriguez',
          totalScore: 23,
          currentRank: 3,
          weeklyScore: 6,
          picks: {
            masters: 'Tiger Woods',
            pga: 'Rory McIlroy',
            usOpen: 'Scottie Scheffler',
            british: 'Jon Rahm'
          }
        }
      ],
      poolRules: {
        scoringSystem: {
          'Winner': '10 points',
          'Top 5': '5 points',
          'Top 10': '2 points',
          'Made Cut': '1 point'
        },
        tournamentInfo: {
          '2026 Masters': 'April 10-13, Augusta National',
          '2026 PGA Championship': 'May 15-18, TBD',
          '2026 U.S. Open': 'June 12-15, TBD',
          '2026 British Open': 'July 17-20, TBD'
        }
      },
      weeklyStats: {
        totalParticipants: 12,
        activeParticipants: 10,
        averageScore: 18.5,
        topWeeklyScore: 8,
        tournaments_completed: 1,
        next_major: '2026 PGA Championship'
      }
    };
  } catch (error) {
    console.error('Failed to fetch weekly pool data:', error);
    return null;
  }
}

/**
 * Fetch tournament history and upcoming schedule
 */
async function fetchTournamentSchedule() {
  try {
    return {
      completed: [
        {
          name: 'The Masters Tournament',
          date: '2026-04-13',
          winner: 'Scottie Scheffler',
          status: 'completed'
        }
      ],
      upcoming: [
        {
          name: 'PGA Championship',
          date: '2026-05-15',
          venue: 'TBD',
          status: 'scheduled'
        },
        {
          name: 'U.S. Open',
          date: '2026-06-12',
          venue: 'TBD',
          status: 'scheduled'
        }
      ]
    };
  } catch (error) {
    console.error('Failed to fetch tournament schedule:', error);
    return { completed: [], upcoming: [] };
  }
}

/**
 * Generate comprehensive weekly summary
 */
async function generateWeeklySummary(poolData, tournamentSchedule) {
  const baseUrl = process.env.URL || 'http://localhost:8888';

  // Create comprehensive weekly prompt
  const prompt = `
WEEKLY GOLF POOL ANALYSIS

CURRENT POOL STANDINGS:
${poolData.poolStandings.slice(0, 5).map((p, i) =>
  `${i + 1}. ${p.name}: ${p.totalScore} points (Week: +${p.weeklyScore})`
).join('\n')}

POOL STATISTICS:
- Total Participants: ${poolData.weeklyStats.totalParticipants}
- Average Score: ${poolData.weeklyStats.averageScore}
- Tournaments Completed: ${poolData.weeklyStats.tournaments_completed}
- Next Major: ${poolData.weeklyStats.next_major}

RECENT TOURNAMENTS:
${tournamentSchedule.completed.slice(0, 2).map(t =>
  `${t.name}: Winner - ${t.winner} (${t.date})`
).join('\n')}

UPCOMING TOURNAMENTS:
${tournamentSchedule.upcoming.slice(0, 2).map(t =>
  `${t.name}: ${t.date} at ${t.venue}`
).join('\n')}

Write a comprehensive weekly pool summary (3-4 paragraphs) that includes:
1. Current leaderboard analysis and key position changes
2. Recent tournament impact on pool standings
3. Strategic outlook for upcoming tournaments
4. Engaging commentary about participant strategies and momentum

Use an enthusiastic but informative tone for golf pool participants.
`;

  try {
    const response = await fetch(`${baseUrl}/api/llm-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        parameters: {
          max_new_tokens: 600,
          temperature: 0.8
        }
      })
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }

    const result = await response.json();

    return {
      type: 'weekly_summary',
      title: `Weekly Pool Report - ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`,
      content: result.generated_text,
      generated_at: new Date().toISOString(),
      source: result.source || 'ai',
      metadata: {
        poolLeader: poolData.poolStandings[0]?.name,
        totalParticipants: poolData.weeklyStats.totalParticipants,
        weekNumber: getWeekNumber(),
        nextMajor: poolData.weeklyStats.next_major
      }
    };

  } catch (error) {
    console.log('AI generation failed, using enhanced fallback');
    return createEnhancedFallbackSummary(poolData, tournamentSchedule);
  }
}

/**
 * Create enhanced fallback summary when AI is unavailable
 */
function createEnhancedFallbackSummary(poolData, tournamentSchedule) {
  const leader = poolData.poolStandings[0];
  const weeklyBest = poolData.poolStandings.reduce((best, current) =>
    current.weeklyScore > best.weeklyScore ? current : best
  );

  const nextTournament = tournamentSchedule.upcoming[0];

  const content = `
Weekly Pool Update - ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}

LEADERBOARD SPOTLIGHT: ${leader.name} continues to lead our pool with ${leader.totalScore} total points, maintaining their position through strategic picks and consistent performance. The competition remains tight with only ${leader.totalScore - poolData.poolStandings[2]?.totalScore} points separating the top three positions.

WEEKLY PERFORMANCE: This week's standout performer was ${weeklyBest.name}, earning ${weeklyBest.weeklyScore} points and showing strong momentum. ${weeklyBest.name === leader.name ? 'Their consistent performance keeps them at the top.' : 'This strong showing moves them up in the overall standings.'}

LOOKING AHEAD: With ${tournamentSchedule.upcoming.length} major championships remaining, there are still plenty of opportunities for participants to make their mark. The upcoming ${nextTournament?.name || 'tournament'} ${nextTournament?.date ? `on ${nextTournament.date}` : ''} will be crucial for pool standings. Participants should review their picks and consider the course characteristics and recent player form.

Current average pool score stands at ${poolData.weeklyStats.averageScore} points with ${poolData.weeklyStats.totalParticipants} total participants competing. The season is far from over, and strategic picks in upcoming majors could significantly shake up the leaderboard.
  `.trim();

  return {
    type: 'weekly_summary',
    title: `Weekly Pool Report - ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`,
    content,
    generated_at: new Date().toISOString(),
    source: 'enhanced_fallback',
    metadata: {
      poolLeader: leader.name,
      totalParticipants: poolData.weeklyStats.totalParticipants,
      weekNumber: getWeekNumber(),
      nextMajor: poolData.weeklyStats.next_major
    }
  };
}

/**
 * Generate participant insights
 */
function generateParticipantInsights(poolData) {
  const insights = [];

  // Identify trends
  const riserOfWeek = poolData.poolStandings
    .filter(p => p.weeklyScore > 0)
    .sort((a, b) => b.weeklyScore - a.weeklyScore)[0];

  if (riserOfWeek) {
    insights.push({
      type: 'riser_of_week',
      participant: riserOfWeek.name,
      points: riserOfWeek.weeklyScore,
      message: `${riserOfWeek.name} had an exceptional week with ${riserOfWeek.weeklyScore} points!`
    });
  }

  // Strategy analysis
  const strategies = poolData.poolStandings.slice(0, 3).map(p => ({
    name: p.name,
    strategy: analyzePickStrategy(p.picks),
    performance: p.totalScore
  }));

  return {
    insights,
    strategies,
    recommendations: generateRecommendations(poolData)
  };
}

/**
 * Analyze pick strategy patterns
 */
function analyzePickStrategy(picks) {
  // Simple strategy analysis based on picks
  const pickValues = Object.values(picks).filter(Boolean);

  if (pickValues.includes('Scottie Scheffler') && pickValues.includes('Jon Rahm')) {
    return 'Conservative - Top Favorites';
  } else if (pickValues.includes('Tiger Woods')) {
    return 'High Risk/Reward - Legend Bet';
  } else {
    return 'Balanced Mix';
  }
}

/**
 * Generate recommendations for participants
 */
function generateRecommendations(poolData) {
  return [
    'Monitor course conditions and weather forecasts for upcoming majors',
    'Consider players with strong recent form and course history',
    'Balance high-ceiling picks with consistent performers',
    'Track injury reports and player status updates'
  ];
}

/**
 * Get current week number of the year
 */
function getWeekNumber() {
  const now = new Date();
  const onejan = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now - onejan) / 86400000 + onejan.getDay() + 1) / 7);
}

/**
 * Store weekly summary and insights
 */
async function storeWeeklySummary(summary, insights) {
  // Placeholder for storing in database/cache
  console.log('📝 Storing weekly summary and insights');

  return {
    summary_stored: true,
    insights_stored: true,
    storage_timestamp: new Date().toISOString(),
    content_id: `weekly-${Date.now()}`
  };
}

/**
 * Main scheduled function handler
 */
exports.handler = async (event, context) => {
  console.log('📊 Starting scheduled weekly summary generation...');

  const startTime = Date.now();

  try {
    // Fetch comprehensive data
    console.log('📥 Fetching weekly pool data and tournament schedule...');
    const [poolData, tournamentSchedule] = await Promise.all([
      fetchWeeklyPoolData(),
      fetchTournamentSchedule()
    ]);

    if (!poolData) {
      throw new Error('Failed to fetch pool data for weekly summary');
    }

    // Generate comprehensive weekly summary
    console.log('🎯 Generating weekly summary...');
    const summary = await generateWeeklySummary(poolData, tournamentSchedule);

    // Generate participant insights
    console.log('💡 Analyzing participant insights...');
    const insights = generateParticipantInsights(poolData);

    // Store results
    const storageResults = await storeWeeklySummary(summary, insights);

    // Prepare response
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      execution_time: Date.now() - startTime,
      weekly_summary: summary,
      participant_insights: insights,
      storage: storageResults,
      next_summary: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Next Monday
    };

    console.log('✅ Weekly summary generation completed:', {
      summary_generated: true,
      insights_count: insights.insights.length,
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
    console.error('❌ Weekly summary generation failed:', error);

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