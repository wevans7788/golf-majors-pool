import React, { useState } from 'react';
import Layout from './components/Layout/Layout';
import SheetSetup from './components/Dashboard/SheetSetup';
import PoolStandings from './components/Dashboard/PoolStandings';
import Leaderboard from './components/Dashboard/Leaderboard';
import TournamentInfo from './components/Dashboard/TournamentInfo';
import AIInsights from './components/Dashboard/AIInsights';
import ScheduleStatus from './components/Dashboard/ScheduleStatus';
import Analytics from './pages/Analytics';

function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'setup', 'dashboard', or 'analytics'

  const handleSetupComplete = () => {
    setCurrentView('dashboard');
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  return (
    <Layout>
      <div className="space-y-8">
        {currentView === 'setup' ? (
          <>
            {/* Welcome Section */}
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to Golf Majors Pool 2026
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Track your picks, follow live leaderboards, and compete with friends
                through AI-powered analysis and insights.
              </p>
            </div>

            {/* Setup Component */}
            <SheetSetup onConfigured={handleSetupComplete} />

            {/* Feature Preview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="golf-card">
                <div className="text-2xl mb-3">🏆</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Tournament Data</h3>
                <p className="text-gray-600">
                  Real-time leaderboards and player statistics from major championships.
                </p>
              </div>

              <div className="golf-card">
                <div className="text-2xl mb-3">📊</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Pool Standings</h3>
                <p className="text-gray-600">
                  Track your performance against friends with dynamic scoring.
                </p>
              </div>

              <div className="golf-card">
                <div className="text-2xl mb-3">🤖</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Insights</h3>
                <p className="text-gray-600">
                  Get weekly summaries and tournament analysis powered by AI.
                </p>
              </div>
            </div>
          </>
        ) : currentView === 'dashboard' ? (
          <>
            {/* Dashboard Header with Navigation */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h1 className="text-3xl font-bold text-gray-900">
                🏌️ Golf Majors Pool Dashboard
              </h1>
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewChange('analytics')}
                  className="golf-button text-sm"
                >
                  📊 Analytics
                </button>
                <button
                  onClick={() => handleViewChange('setup')}
                  className="text-golf-green hover:text-golf-accent font-medium text-sm px-3 py-2"
                >
                  ⚙️ Settings
                </button>
              </div>
            </div>

            {/* Tournament Info & Schedule Status */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <TournamentInfo />
              </div>
              <div className="lg:col-span-1">
                <ScheduleStatus />
              </div>
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Pool Standings - Left Column */}
              <div className="xl:col-span-1">
                <PoolStandings />
              </div>

              {/* Tournament Leaderboard - Right Two Columns */}
              <div className="xl:col-span-2">
                <Leaderboard />
              </div>
            </div>

            {/* AI Insights */}
            <AIInsights />
          </>
        ) : (
          <>
            {/* Analytics Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h1 className="text-3xl font-bold text-gray-900">
                📊 Pool Analytics & Charts
              </h1>
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewChange('dashboard')}
                  className="golf-button text-sm"
                >
                  🏌️ Dashboard
                </button>
                <button
                  onClick={() => handleViewChange('setup')}
                  className="text-golf-green hover:text-golf-accent font-medium text-sm px-3 py-2"
                >
                  ⚙️ Settings
                </button>
              </div>
            </div>

            {/* Analytics Page */}
            <Analytics />
          </>
        )}
      </div>
    </Layout>
  );
}

export default App;
