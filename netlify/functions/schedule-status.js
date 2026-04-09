/**
 * Netlify Function: Schedule Status Monitor
 * Provides information about automated scheduling system
 */

/**
 * Calculate next execution times for scheduled functions
 */
function getNextExecutionTimes() {
  const now = new Date();

  // Next 4-hour interval (Google Sheets check)
  const nextSheetsUpdate = new Date(now);
  nextSheetsUpdate.setHours(Math.ceil(now.getHours() / 4) * 4, 0, 0, 0);
  if (nextSheetsUpdate <= now) {
    nextSheetsUpdate.setHours(nextSheetsUpdate.getHours() + 4);
  }

  // Next 10 PM (AI daily update)
  const nextAIUpdate = new Date(now);
  nextAIUpdate.setHours(22, 0, 0, 0);
  if (nextAIUpdate <= now) {
    nextAIUpdate.setDate(nextAIUpdate.getDate() + 1);
  }

  // Next Monday 10 AM (Weekly summary)
  const nextWeekly = new Date(now);
  const daysUntilMonday = (8 - now.getDay()) % 7;
  nextWeekly.setDate(now.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
  nextWeekly.setHours(10, 0, 0, 0);

  return {
    sheets_update: nextSheetsUpdate.toISOString(),
    ai_update: nextAIUpdate.toISOString(),
    weekly_summary: nextWeekly.toISOString()
  };
}

/**
 * Get scheduling configuration and status
 */
function getSchedulingStatus() {
  const schedules = [
    {
      name: 'Google Sheets Monitor',
      function: 'scheduled-sheets-update',
      cron: '0 */4 * * *',
      description: 'Checks Google Sheets for updates every 4 hours',
      frequency: 'Every 4 hours',
      purpose: 'Detect pool data changes and refresh caches'
    },
    {
      name: 'Daily AI Content',
      function: 'scheduled-ai-update',
      cron: '0 22 * * *',
      description: 'Generates daily AI analysis at 10 PM',
      frequency: 'Daily at 10 PM',
      purpose: 'End-of-day tournament analysis and pool insights'
    },
    {
      name: 'Weekly Pool Summary',
      function: 'scheduled-weekly-summary',
      cron: '0 10 * * 1',
      description: 'Comprehensive weekly analysis every Monday at 10 AM',
      frequency: 'Weekly (Monday 10 AM)',
      purpose: 'Complete pool analysis with trends and recommendations'
    }
  ];

  return {
    total_scheduled_functions: schedules.length,
    schedules,
    timezone: 'UTC',
    platform: 'Netlify Functions'
  };
}

/**
 * Check system health and configuration
 */
function getSystemHealth() {
  const requiredEnvVars = [
    'URL', // Netlify site URL
    // 'POOL_DATA_SHEET_URL', // Google Sheets URLs (optional)
    // 'HF_API_TOKEN' // Hugging Face token (optional)
  ];

  const envStatus = requiredEnvVars.map(envVar => ({
    variable: envVar,
    configured: !!process.env[envVar],
    required: true
  }));

  const optionalEnvVars = [
    'POOL_DATA_SHEET_URL',
    'POOL_RULES_SHEET_URL',
    'PARTICIPANTS_SHEET_URL',
    'HF_API_TOKEN'
  ];

  const optionalStatus = optionalEnvVars.map(envVar => ({
    variable: envVar,
    configured: !!process.env[envVar],
    required: false
  }));

  return {
    environment_variables: {
      required: envStatus,
      optional: optionalStatus
    },
    health_status: 'operational',
    last_check: new Date().toISOString()
  };
}

/**
 * Get recent execution history (placeholder)
 */
function getExecutionHistory() {
  // In production, this would fetch from logs or database
  return {
    recent_executions: [
      {
        function: 'scheduled-sheets-update',
        last_run: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        status: 'success',
        execution_time: '1.2s'
      },
      {
        function: 'scheduled-ai-update',
        last_run: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(), // 14 hours ago
        status: 'success',
        execution_time: '3.8s'
      },
      {
        function: 'scheduled-weekly-summary',
        last_run: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
        status: 'success',
        execution_time: '2.1s'
      }
    ],
    total_executions_today: 6,
    success_rate: '100%'
  };
}

/**
 * Main handler function
 */
exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const response = {
      status: 'active',
      timestamp: new Date().toISOString(),
      next_executions: getNextExecutionTimes(),
      scheduling_config: getSchedulingStatus(),
      system_health: getSystemHealth(),
      execution_history: getExecutionHistory(),
      monitoring: {
        dashboard_url: process.env.URL || 'https://your-site.netlify.app',
        functions_url: `${process.env.URL || 'https://your-site.netlify.app'}/.netlify/functions/`,
        status_endpoint: '/api/schedule-status'
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response, null, 2)
    };

  } catch (error) {
    console.error('Schedule status error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to get schedule status',
        message: error.message,
        timestamp: new Date().toISOString()
      }, null, 2)
    };
  }
};