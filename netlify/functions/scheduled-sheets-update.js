/**
 * Netlify Scheduled Function: Google Sheets Update Monitor
 * Runs every 4 hours to check for Google Sheets updates
 */

// Simple storage for tracking last update times (in production, use a database)
const updateLog = new Map();

/**
 * Fetch and check Google Sheets for changes
 */
async function checkSheetsForUpdates() {
  const results = {
    timestamp: new Date().toISOString(),
    checks: [],
    updates_found: false,
    errors: []
  };

  // Get sheet configuration from environment or default URLs
  const sheetUrls = {
    poolData: process.env.POOL_DATA_SHEET_URL || '',
    poolRules: process.env.POOL_RULES_SHEET_URL || '',
    participants: process.env.PARTICIPANTS_SHEET_URL || ''
  };

  for (const [sheetName, url] of Object.entries(sheetUrls)) {
    if (!url) {
      results.checks.push({
        sheet: sheetName,
        status: 'skipped',
        reason: 'URL not configured'
      });
      continue;
    }

    try {
      console.log(`Checking ${sheetName} for updates...`);

      const response = await fetch(url, {
        method: 'HEAD', // Just check headers, don't download content
        headers: {
          'User-Agent': 'Golf-Pool-Monitor/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check Last-Modified header to detect changes
      const lastModified = response.headers.get('Last-Modified');
      const etag = response.headers.get('ETag');

      const lastCheck = updateLog.get(sheetName);
      const currentFingerprint = `${lastModified}-${etag}`;

      if (!lastCheck || lastCheck !== currentFingerprint) {
        results.updates_found = true;
        updateLog.set(sheetName, currentFingerprint);

        results.checks.push({
          sheet: sheetName,
          status: 'updated',
          last_modified: lastModified,
          previous_check: lastCheck || 'first-check'
        });

        console.log(`✅ Updates found in ${sheetName}`);
      } else {
        results.checks.push({
          sheet: sheetName,
          status: 'no_changes',
          last_modified: lastModified
        });
      }

    } catch (error) {
      console.error(`❌ Error checking ${sheetName}:`, error.message);
      results.errors.push({
        sheet: sheetName,
        error: error.message
      });

      results.checks.push({
        sheet: sheetName,
        status: 'error',
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Trigger cache refresh for updated sheets
 */
async function triggerCacheRefresh() {
  try {
    // Call our own API endpoints to refresh cached data
    const baseUrl = process.env.URL || 'http://localhost:8888';

    const refreshPromises = [
      fetch(`${baseUrl}/api/golf-data/schedule`),
      fetch(`${baseUrl}/api/golf-data/leaderboard`)
    ];

    const results = await Promise.allSettled(refreshPromises);

    return {
      cache_refresh: 'attempted',
      results: results.map((result, index) => ({
        endpoint: index === 0 ? 'schedule' : 'leaderboard',
        status: result.status,
        success: result.status === 'fulfilled' && result.value?.ok
      }))
    };
  } catch (error) {
    console.error('Cache refresh error:', error);
    return {
      cache_refresh: 'error',
      error: error.message
    };
  }
}

/**
 * Send notification about updates (placeholder for future integration)
 */
async function notifyUpdates(updateResults) {
  // Placeholder for future notification system
  // Could integrate with Slack, Discord, email, etc.

  if (updateResults.updates_found) {
    console.log('📢 Pool data updates detected - notifications would go here');

    // Example notification payload
    return {
      notification_sent: false,
      message: `Pool data updates detected at ${updateResults.timestamp}`,
      updated_sheets: updateResults.checks
        .filter(check => check.status === 'updated')
        .map(check => check.sheet)
    };
  }

  return { notification_sent: false, reason: 'no_updates' };
}

/**
 * Main scheduled function handler
 */
exports.handler = async (event, context) => {
  console.log('🔄 Starting scheduled Google Sheets update check...');

  try {
    // Check for sheet updates
    const updateResults = await checkSheetsForUpdates();

    // Refresh caches if updates found
    let cacheResults = null;
    if (updateResults.updates_found) {
      cacheResults = await triggerCacheRefresh();
    }

    // Send notifications if configured
    const notificationResults = await notifyUpdates(updateResults);

    // Prepare response
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      execution_time: Date.now() - new Date(updateResults.timestamp).getTime(),
      update_check: updateResults,
      cache_refresh: cacheResults,
      notifications: notificationResults,
      next_check: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours from now
    };

    console.log('✅ Scheduled update check completed:', {
      updates_found: updateResults.updates_found,
      errors: updateResults.errors.length,
      sheets_checked: updateResults.checks.length
    });

    return {
      statusCode: 200,
      body: JSON.stringify(response, null, 2),
      headers: {
        'Content-Type': 'application/json'
      }
    };

  } catch (error) {
    console.error('❌ Scheduled update check failed:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }, null, 2),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
};

// Helper function to test the scheduled function locally
if (require.main === module) {
  // Test function when run directly
  exports.handler({}, {})
    .then(result => {
      console.log('Test result:', JSON.parse(result.body));
    })
    .catch(console.error);
}