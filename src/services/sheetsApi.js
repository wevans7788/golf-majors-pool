/**
 * Google Sheets API service for public sheet access
 * Reads data from published Google Sheets (no authentication required)
 */

// Hardcoded sheet URLs for golf majors pool
const SHEET_CONFIG = {
  // Main pool data with participant scores, picks, and standings
  poolData: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR4Ymy1FkaujhEJ68z8_6rnroO0z9O9fcyRNPo8qNOSZNL6qR4wDVfud79ejaR9CijcBis4O_-29Uw-/pub?gid=0&single=true&output=csv',
  // Pool rules (same sheet for now, can be updated to different tab/sheet if needed)
  poolRules: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR4Ymy1FkaujhEJ68z8_6rnroO0z9O9fcyRNPo8qNOSZNL6qR4wDVfud79ejaR9CijcBis4O_-29Uw-/pub?gid=0&single=true&output=csv',
  // Participants data (same as poolData)
  participants: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR4Ymy1FkaujhEJ68z8_6rnroO0z9O9fcyRNPo8qNOSZNL6qR4wDVfud79ejaR9CijcBis4O_-29Uw-/pub?gid=0&single=true&output=csv'
};

/**
 * Parse CSV text into array of objects
 */
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    data.push(row);
  }

  return data;
}

/**
 * Fetch data from a published Google Sheet
 */
async function fetchSheetData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw new Error(`Failed to fetch sheet data: ${error.message}`);
  }
}

/**
 * Get pool participants and their current scores
 */
export async function getPoolStandings() {
  const data = await fetchSheetData(SHEET_CONFIG.poolData);

  // Transform the data to our expected format
  return data.map(row => ({
    name: row.Name || row.Participant || '',
    totalScore: parseInt(row['Total Score'] || row.Total || 0),
    currentRank: parseInt(row.Rank || row.Position || 0),
    picks: {
      masters: row.Masters || '',
      pga: row['PGA Championship'] || row.PGA || '',
      usOpen: row['US Open'] || row['U.S. Open'] || '',
      british: row['British Open'] || row.British || row.Open || ''
    },
    weeklyScore: parseInt(row['Weekly Score'] || row.Week || 0)
  }));
}

/**
 * Get pool rules and scoring system
 */
export async function getPoolRules() {
  try {
    const data = await fetchSheetData(SHEET_CONFIG.poolRules);

    // Extract rules from the sheet data
    const rules = {
      scoringSystem: {},
      generalRules: [],
      tournamentInfo: {},
      lastUpdated: new Date().toISOString()
    };

    // Parse rules data (format may vary - this is adaptable)
    data.forEach(row => {
      if (row.Rule || row.Category) {
        const category = row.Category || row.Rule || '';
        const description = row.Description || row.Details || row.Value || '';

        if (category.toLowerCase().includes('scoring')) {
          rules.scoringSystem[category] = description;
        } else if (category.toLowerCase().includes('tournament')) {
          rules.tournamentInfo[category] = description;
        } else {
          rules.generalRules.push({ category, description });
        }
      }
    });

    return rules;
  } catch (error) {
    console.error('Error fetching pool rules:', error);
    // Return default rules structure if fetch fails
    return {
      scoringSystem: {
        'Winner': '10 points',
        'Top 5': '5 points',
        'Top 10': '2 points',
        'Made Cut': '1 point'
      },
      generalRules: [
        { category: 'Picks Due', description: 'Before tournament starts' },
        { category: 'Scoring', description: 'Based on final tournament position' }
      ],
      tournamentInfo: {
        '2026 Masters': 'April 10-13, Augusta National',
        '2026 PGA Championship': 'May 15-18, TBD',
        '2026 U.S. Open': 'June 12-15, TBD',
        '2026 British Open': 'July 17-20, TBD'
      },
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Get detailed participant information
 */
export async function getParticipants() {
  try {
    const data = await fetchSheetData(SHEET_CONFIG.participants);

    return data.map(row => ({
      id: row.ID || row.ParticipantID || Math.random().toString(36).substr(2, 9),
      name: row.Name || row.Participant || '',
      email: row.Email || '',
      totalScore: parseInt(row['Total Score'] || row.Total || 0),
      rank: parseInt(row.Rank || row.Position || 0),
      joinDate: row['Join Date'] || row.Joined || '',
      picks: {
        masters: row['Masters Pick'] || row.Masters || '',
        pga: row['PGA Pick'] || row.PGA || '',
        usOpen: row['US Open Pick'] || row['U.S. Open'] || '',
        british: row['British Pick'] || row.British || ''
      }
    }));
  } catch (error) {
    console.error('Error fetching participants:', error);
    return [];
  }
}

/**
 * Update sheet configuration with actual URLs
 */
export function updateSheetConfig(newConfig) {
  Object.assign(SHEET_CONFIG, newConfig);
}

/**
 * Test connection to sheets
 */
export async function testSheetConnection() {
  const tests = [];

  for (const [name, url] of Object.entries(SHEET_CONFIG)) {
    try {
      const data = await fetchSheetData(url);
      tests.push({
        sheet: name,
        status: 'success',
        rowCount: data.length,
        columns: data[0] ? Object.keys(data[0]) : []
      });
    } catch (error) {
      tests.push({
        sheet: name,
        status: 'error',
        error: error.message
      });
    }
  }

  return tests;
}

export default {
  getPoolStandings,
  getPoolRules,
  getParticipants,
  updateSheetConfig,
  testSheetConnection
};