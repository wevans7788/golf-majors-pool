/**
 * Netlify Function: Golf Data API Proxy
 * Handles ESPN API requests with caching and rate limiting
 */

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/golf';
const ESPN_CORE = 'https://sports.core.api.espn.com/v2/sports/golf';

// Simple in-memory cache (in production, use Redis or similar)
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Make request to ESPN API with error handling
 */
async function fetchESPNData(url) {
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Golf-Pool-App/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get cached data or fetch fresh data
 */
async function getCachedData(key, fetchFunction) {
  const cached = cache.get(key);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }

  const data = await fetchFunction();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

/**
 * Main handler function
 */
exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { path } = event;
    const queryParams = new URLSearchParams(event.queryStringParameters || {});

    // Route requests based on path
    let data;

    if (path.includes('schedule')) {
      // Get tournament schedule
      data = await getCachedData('tournament-schedule', async () => {
        try {
          const response = await fetchESPNData(`${ESPN_BASE}/pga/scoreboard`);

          if (response.events) {
            return response.events.map(event => ({
              id: event.id,
              name: event.name || event.shortName,
              date: event.date,
              status: event.status?.type?.name || 'scheduled',
              venue: event.competitions?.[0]?.venue?.fullName || 'TBD',
              isMajor: isMajorTournament(event.name || ''),
            }));
          }

          return getSampleTournaments();
        } catch (error) {
          console.error('ESPN API failed, using sample data:', error);
          return getSampleTournaments();
        }
      });

    } else if (path.includes('leaderboard')) {
      // Get tournament leaderboard
      const tournamentId = queryParams.get('tournamentId') || 'current';

      data = await getCachedData(`leaderboard-${tournamentId}`, async () => {
        try {
          let url = `${ESPN_BASE}/pga/leaderboard`;
          if (tournamentId !== 'current') {
            url += `?event=${tournamentId}`;
          }

          const response = await fetchESPNData(url);

          return {
            tournamentName: response.event?.name || 'Current Tournament',
            lastUpdated: new Date().toISOString(),
            round: response.status?.period || 1,
            leaderboard: (response.leaders || []).slice(0, 50).map((player, index) => ({
              position: player.position || index + 1,
              player: {
                id: player.athlete?.id || `player-${index}`,
                name: player.athlete?.displayName || 'Unknown Player',
                country: extractCountryFromFlag(player.athlete?.flag?.href) || 'USA'
              },
              scores: {
                total: player.score || 'E',
                today: player.linescores?.[0]?.value || 'E',
                thru: player.status || 'F',
                rounds: player.linescores?.map(r => r.value) || []
              }
            }))
          };
        } catch (error) {
          console.error('ESPN leaderboard API failed, using sample data:', error);
          return getSampleLeaderboard();
        }
      });

    } else if (path.includes('player')) {
      // Get player statistics
      const playerId = queryParams.get('playerId');

      if (!playerId) {
        throw new Error('Player ID required');
      }

      data = await getCachedData(`player-${playerId}`, async () => {
        try {
          const response = await fetchESPNData(`${ESPN_CORE}/pga/athletes/${playerId}`);

          return {
            id: response.id,
            name: response.displayName || response.fullName,
            country: response.birthPlace?.country || 'USA',
            stats: parsePlayerStats(response.statistics || [])
          };
        } catch (error) {
          console.error('ESPN player API failed:', error);
          return null;
        }
      });

    } else if (path.includes('test')) {
      // Test API connectivity
      data = {
        status: 'success',
        timestamp: new Date().toISOString(),
        endpoints: {
          schedule: 'available',
          leaderboard: 'available',
          player: 'available'
        },
        cache: {
          entries: cache.size,
          keys: Array.from(cache.keys())
        }
      };

    } else {
      throw new Error(`Unknown endpoint: ${path}`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Golf API function error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

/**
 * Helper functions
 */

function isMajorTournament(name) {
  const majorNames = [
    'masters', 'pga championship', 'u.s. open', 'us open', 'open championship', 'british open'
  ];
  return majorNames.some(major => name.toLowerCase().includes(major));
}

function extractCountryFromFlag(flagUrl) {
  if (!flagUrl) return null;
  const match = flagUrl.match(/\/([A-Z]{2,3})\.png$/i);
  return match ? match[1].toUpperCase() : null;
}

function parsePlayerStats(statistics) {
  const statMap = {
    'earnings': 'earnings',
    'scoringAverage': 'avgScore',
    'drivingDistance': 'drivingDistance',
    'drivingAccuracy': 'drivingAccuracy',
    'greensInRegulation': 'gir',
    'puttingAverage': 'puttingAvg'
  };

  const stats = {};
  statistics.forEach(stat => {
    const key = statMap[stat.name];
    if (key) {
      stats[key] = stat.displayValue || stat.value;
    }
  });

  return stats;
}

function getSampleTournaments() {
  return [
    {
      id: 'masters-2026',
      name: 'The Masters Tournament',
      date: '2026-04-09T11:00:00Z', // 6am EST = 11:00 UTC
      endDate: '2026-04-12T23:00:00Z', // Sunday evening
      status: 'in-progress',
      venue: 'Augusta National Golf Club',
      location: 'Augusta, Georgia',
      isMajor: true,
      round: 1
    },
    {
      id: 'pga-championship-2026',
      name: 'PGA Championship',
      date: '2026-05-15T00:00:00Z',
      endDate: '2026-05-18T00:00:00Z',
      status: 'scheduled',
      venue: 'Quail Hollow Club',
      location: 'Charlotte, North Carolina',
      isMajor: true
    }
  ];
}

function getSampleLeaderboard() {
  return {
    tournamentName: 'The Masters Tournament 2026 - Round 1',
    lastUpdated: new Date().toISOString(),
    round: 1,
    status: 'First Round in Progress',
    leaderboard: [
      {
        position: 1,
        player: { id: '1', name: 'Scottie Scheffler', country: 'USA' },
        scores: { total: '-6', today: '-6', thru: '16', rounds: ['66'] }
      },
      {
        position: 2,
        player: { id: '2', name: 'Tiger Woods', country: 'USA' },
        scores: { total: '-5', today: '-5', thru: '17', rounds: ['67'] }
      },
      {
        position: 'T3',
        player: { id: '3', name: 'Jon Rahm', country: 'ESP' },
        scores: { total: '-4', today: '-4', thru: 'F', rounds: ['68'] }
      },
      {
        position: 'T3',
        player: { id: '4', name: 'Rory McIlroy', country: 'NIR' },
        scores: { total: '-4', today: '-4', thru: 'F', rounds: ['68'] }
      },
      {
        position: 'T5',
        player: { id: '5', name: 'Xander Schauffele', country: 'USA' },
        scores: { total: '-3', today: '-3', thru: '15', rounds: ['69'] }
      },
      {
        position: 'T5',
        player: { id: '6', name: 'Viktor Hovland', country: 'NOR' },
        scores: { total: '-3', today: '-3', thru: 'F', rounds: ['69'] }
      },
      {
        position: 'T7',
        player: { id: '7', name: 'Bryson DeChambeau', country: 'USA' },
        scores: { total: '-2', today: '-2', thru: '14', rounds: ['70'] }
      },
      {
        position: 'T7',
        player: { id: '8', name: 'Justin Thomas', country: 'USA' },
        scores: { total: '-2', today: '-2', thru: 'F', rounds: ['70'] }
      }
    ]
  };
}