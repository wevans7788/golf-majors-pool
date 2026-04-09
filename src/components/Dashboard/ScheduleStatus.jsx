import React, { useState, useEffect } from 'react';

const ScheduleStatus = () => {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch schedule status
  useEffect(() => {
    const fetchScheduleStatus = async () => {
      try {
        const response = await fetch('/api/schedule-status');
        if (response.ok) {
          const data = await response.json();
          setScheduleData(data);
        } else {
          throw new Error('Failed to fetch schedule status');
        }
      } catch (err) {
        setError(err.message);
        // Set fallback data for demo
        setScheduleData({
          status: 'demo',
          next_executions: {
            sheets_update: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            ai_update: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
            weekly_summary: getNextMonday().toISOString()
          },
          scheduling_config: {
            schedules: [
              { name: 'Google Sheets Monitor', frequency: 'Every 4 hours' },
              { name: 'Daily AI Content', frequency: 'Daily at 10 PM' },
              { name: 'Weekly Pool Summary', frequency: 'Weekly (Monday 10 AM)' }
            ]
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchScheduleStatus();
  }, []);

  const getNextMonday = () => {
    const now = new Date();
    const daysUntilMonday = (8 - now.getDay()) % 7;
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
    nextMonday.setHours(10, 0, 0, 0);
    return nextMonday;
  };

  const formatTimeUntil = (dateString) => {
    const targetDate = new Date(dateString);
    const now = new Date();
    const diff = targetDate - now;

    if (diff < 0) return 'Past due';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="golf-card">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded mb-3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'demo': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '✅';
      case 'demo': return '🚀';
      default: return '⏳';
    }
  };

  return (
    <div className="golf-card bg-gray-50">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">⚡</span>
        <h3 className="text-lg font-semibold text-gray-900">Automated Updates</h3>
        <span className={`text-sm font-medium ${getStatusColor(scheduleData?.status)}`}>
          {getStatusIcon(scheduleData?.status)}
          {scheduleData?.status === 'demo' ? 'Demo Mode' : 'Active'}
        </span>
      </div>

      {error && scheduleData?.status === 'demo' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <strong>Demo Mode:</strong> Showing example scheduling. Deploy to activate automatic updates.
        </div>
      )}

      <div className="space-y-3">
        {/* Google Sheets Updates */}
        <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
          <div>
            <div className="font-medium text-gray-900">📊 Pool Data Sync</div>
            <div className="text-sm text-gray-600">Every 4 hours</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-golf-green">
              Next: {formatTimeUntil(scheduleData?.next_executions?.sheets_update)}
            </div>
            <div className="text-xs text-gray-500">
              {formatTime(scheduleData?.next_executions?.sheets_update)}
            </div>
          </div>
        </div>

        {/* Daily AI Updates */}
        <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
          <div>
            <div className="font-medium text-gray-900">🤖 AI Analysis</div>
            <div className="text-sm text-gray-600">Daily at 10 PM</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-purple-600">
              Next: {formatTimeUntil(scheduleData?.next_executions?.ai_update)}
            </div>
            <div className="text-xs text-gray-500">
              {formatTime(scheduleData?.next_executions?.ai_update)}
            </div>
          </div>
        </div>

        {/* Weekly Summary */}
        <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
          <div>
            <div className="font-medium text-gray-900">📈 Weekly Report</div>
            <div className="text-sm text-gray-600">Monday mornings</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-blue-600">
              Next: {formatTimeUntil(scheduleData?.next_executions?.weekly_summary)}
            </div>
            <div className="text-xs text-gray-500">
              {formatTime(scheduleData?.next_executions?.weekly_summary)}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>Platform:</span>
          <span>Netlify Functions</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Timezone:</span>
          <span>UTC</span>
        </div>
      </div>
    </div>
  );
};

export default ScheduleStatus;