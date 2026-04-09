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
 * Sample tournament data for fallback - 2026 Major Championships
 */
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
      round: 1,
      purse: '$18,000,000',
      description: 'The most prestigious tournament in golf - LIVE from Augusta National!',
      currentRound: 'First Round in Progress'
    },
    {
      id: 'pga-championship-2026',
      name: 'PGA Championship',
      date: '2026-05-15T00:00:00Z',
      endDate: '2026-05-18T00:00:00Z',
      status: 'scheduled',
      venue: 'Quail Hollow Club',
      location: 'Charlotte, North Carolina',
      isMajor: true,
      purse: '$15,000,000',
      description: 'The season\'s second major championship'
    },
    {
      id: 'us-open-2026',
      name: 'U.S. Open',
      date: '2026-06-12T00:00:00Z',
      endDate: '2026-06-15T00:00:00Z',
      status: 'scheduled',
      venue: 'Oakmont Country Club',
      location: 'Oakmont, Pennsylvania',
      isMajor: true,
      purse: '$17,500,000',
      description: 'The toughest test in golf returns to Oakmont'
    },
    {
      id: 'open-championship-2026',
      name: 'The Open Championship',
      date: '2026-07-17T00:00:00Z',
      endDate: '2026-07-20T00:00:00Z',
      status: 'scheduled',
      venue: 'Royal Portrush Golf Club',
      location: 'Northern Ireland',
      isMajor: true,
      purse: '$14,200,000',
      description: 'Golf\'s original championship returns to Royal Portrush'
    }
  ];
}

/**
 * Sample leaderboard data for fallback - 2026 Masters Tournament
 */
function getSampleLeaderboard(tournamentId) {
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
      },
      {
        position: 'T7',
        player: { id: '9', name: 'Collin Morikawa', country: 'USA' },
        scores: { total: '-2', today: '-2', thru: '16', rounds: ['70'] }
      },
      {
        position: 'T10',
        player: { id: '10', name: 'Jordan Spieth', country: 'USA' },
        scores: { total: '-1', today: '-1', thru: 'F', rounds: ['71'] }
      },
      {
        position: 'T10',
        player: { id: '11', name: 'Patrick Cantlay', country: 'USA' },
        scores: { total: '-1', today: '-1', thru: '12', rounds: ['71'] }
      },
      {
        position: 'T10',
        player: { id: '12', name: 'Cameron Smith', country: 'AUS' },
        scores: { total: '-1', today: '-1', thru: 'F', rounds: ['71'] }
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