/**
 * ESPN Golf API Service
 * Integrates with unofficial ESPN API endpoints for golf tournament data
 */

// ESPN API Base URLs (unofficial endpoints)
const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/golf';
const ESPN_CORE = 'https://sports.core.api.espn.com/v2/sports/golf';

// Tournament IDs for major championships (these change annually)
const MAJOR_TOURNAMENTS = {
  masters: {
    name: 'The Masters Tournament',
    venue: 'Augusta National Golf Club',
    // ESPN tournament ID changes each year - needs to be updated
    espnId: null
  },
  pga: {
    name: 'PGA Championship',
    venue: 'TBD',
    espnId: null
  },
  usopen: {
    name: 'U.S. Open',
    venue: 'TBD',
    espnId: null
  },
  open: {
    name: 'The Open Championship',
    venue: 'TBD',
    espnId: null
  }
};

/**
 * Make API request through Netlify function proxy
 */
async function makeRequest(endpoint, params = {}) {
  try {
    const queryString = new URLSearchParams(params).toString();
    const url = `/api/golf-data/${endpoint}${queryString ? `?${queryString}` : ''}`;

    console.log(`Fetching golf data: ${endpoint}`);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Golf API Error for ${endpoint}:`, error);
    throw new Error(`Failed to fetch golf data: ${error.message}`);
  }
}

/**
 * Get current PGA Tour schedule and tournaments
 */
export async function getTournamentSchedule() {
  try {
    const data = await makeRequest('schedule');
    return Array.isArray(data) ? data : getSampleTournaments();
  } catch (error) {
    console.error('Error fetching tournament schedule:', error);
    return getSampleTournaments();
  }
}

/**
 * Get leaderboard for a specific tournament
 */
export async function getTournamentLeaderboard(tournamentId = 'current') {
  try {
    const params = tournamentId !== 'current' ? { tournamentId } : {};
    const data = await makeRequest('leaderboard', params);
    return data || getSampleLeaderboard(tournamentId);
  } catch (error) {
    console.error('Error fetching tournament leaderboard:', error);
    return getSampleLeaderboard(tournamentId);
  }
}

/**
 * Get player statistics and information
 */
export async function getPlayerStats(playerId) {
  try {
    const data = await makeRequest('player', { playerId });
    return data;
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return null;
  }
}

/**
 * Sample tournament data for fallback
 */
function getSampleTournaments() {
  return [
    {
      id: 'sample-masters-2026',
      name: 'The Masters Tournament',
      date: '2026-04-09T00:00:00Z',
      status: 'in-progress',
      venue: 'Augusta National Golf Club',
      isMajor: true
    },
    {
      id: 'sample-pga-2026',
      name: 'PGA Championship',
      date: '2026-05-15T00:00:00Z',
      status: 'scheduled',
      venue: 'TBD',
      isMajor: true
    },
    {
      id: 'sample-usopen-2026',
      name: 'U.S. Open',
      date: '2026-06-12T00:00:00Z',
      status: 'scheduled',
      venue: 'TBD',
      isMajor: true
    },
    {
      id: 'sample-open-2026',
      name: 'The Open Championship',
      date: '2026-07-17T00:00:00Z',
      status: 'scheduled',
      venue: 'TBD',
      isMajor: true
    }
  ];
}

/**
 * Sample leaderboard data for fallback
 */
function getSampleLeaderboard(tournamentId) {
  return {
    tournamentName: 'The Masters Tournament 2026',
    lastUpdated: new Date().toISOString(),
    round: 2,
    leaderboard: [
      {
        position: 1,
        player: { id: '1', name: 'Scottie Scheffler', country: 'USA' },
        scores: { total: '-8', today: '-3', thru: 'F', rounds: ['68', '65'] }
      },
      {
        position: 2,
        player: { id: '2', name: 'Jon Rahm', country: 'ESP' },
        scores: { total: '-6', today: '-2', thru: 'F', rounds: ['70', '66'] }
      },
      {
        position: 3,
        player: { id: '3', name: 'Rory McIlroy', country: 'NIR' },
        scores: { total: '-5', today: '-1', thru: 'F', rounds: ['69', '68'] }
      },
      {
        position: 4,
        player: { id: '4', name: 'Xander Schauffele', country: 'USA' },
        scores: { total: '-4', today: 'E', thru: 'F', rounds: ['67', '69'] }
      },
      {
        position: 5,
        player: { id: '5', name: 'Viktor Hovland', country: 'NOR' },
        scores: { total: '-3', today: '+1', thru: 'F', rounds: ['69', '67'] }
      }
    ]
  };
}

/**
 * Test API connectivity
 */
export async function testGolfApiConnection() {
  try {
    const data = await makeRequest('test');
    return [
      { endpoint: 'Golf API Service', status: 'success', details: data }
    ];
  } catch (error) {
    return [
      { endpoint: 'Golf API Service', status: 'error', error: error.message }
    ];
  }
}

export default {
  getTournamentSchedule,
  getTournamentLeaderboard,
  getPlayerStats,
  testGolfApiConnection
};