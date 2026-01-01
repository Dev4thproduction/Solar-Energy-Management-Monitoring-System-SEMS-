import { useState } from 'react';
import SidebarTree from './components/SidebarTree';
import { fileSources } from './data/fileData';
import './index.css';

function App() {
  const [activeApp, setActiveApp] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const apps = [
    {
      id: 'weathermeter',
      name: 'WeatherMeter',
      icon: '🌤️',
      description: 'Weather monitoring and data visualization application',
      port: 3001,
      url: 'http://localhost:3001',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      embedded: false,
    },
    {
      id: 'solarpowermeter',
      name: 'SolarPowerMeter',
      icon: '☀️',
      description: 'Solar power monitoring and analytics platform',
      port: 5174,
      url: 'http://localhost:5174',
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      embedded: false,
    },
    {
      id: 'inverterdetails',
      name: 'Inverter Details',
      icon: '⚡',
      description: 'Dynamic inverter data management and monitoring',
      port: 5175,
      url: 'http://localhost:5175',
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      embedded: false,
    },
    {
      id: 'finalsubmission',
      name: 'Final Submission',
      icon: '📋',
      description: 'Solar power generation submission management',
      port: 5176,
      url: 'http://localhost:5176',
      color: 'from-cyan-500 to-blue-600',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
      embedded: false,
    },
  ];

  const handleAppSelect = (app) => {
    setActiveApp(app);
  };

  const openInNewTab = (url) => {
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              App Launcher
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {activeApp && (
              <button
                onClick={() => openInNewTab(activeApp.url)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open in New Tab
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${sidebarOpen ? 'w-80' : 'w-0'
            } h-[calc(100vh-73px)] overflow-hidden transition-all duration-300 ease-in-out border-r border-slate-700/50 flex flex-col`}
        >
          {/* App Selector */}
          <div className="p-4 border-b border-slate-700/50 bg-slate-800/50">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              🚀 Applications
            </h2>
            <div className="space-y-2">
              {apps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => handleAppSelect(app)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${activeApp?.id === app.id
                    ? `${app.bgColor} ${app.borderColor} border-2`
                    : 'bg-slate-700/30 border-2 border-transparent hover:bg-slate-700/50'
                    }`}
                >
                  <span className="text-2xl">{app.icon}</span>
                  <div className="text-left">
                    <span className="block font-semibold text-white text-sm">{app.name}</span>
                    <span className="block text-xs text-slate-400">Port {app.port}</span>
                  </div>
                  {activeApp?.id === app.id && (
                    <div className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* File Tree */}
          <div className="flex-1 overflow-y-auto">
            <SidebarTree
              sources={fileSources}
              defaultExpandedSources={['weathermeter', 'solarpowermeter', 'inverterdetails']}
            />
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 h-[calc(100vh-73px)] overflow-hidden">
          {activeApp ? (
            <div className="h-full flex flex-col">
              {/* App Header */}
              <div className={`px-6 py-4 bg-gradient-to-r ${activeApp.color} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{activeApp.icon}</span>
                  <div>
                    <h2 className="text-xl font-bold text-white">{activeApp.name}</h2>
                    <p className="text-sm text-white/80">Integrated Component</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto">
                <iframe
                  id="app-iframe"
                  src={activeApp.url}
                  className="w-full h-full border-0"
                  title={activeApp.name}
                />
              </div>
            </div>
          ) : (
            /* Welcome State */
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="max-w-2xl">
                <div className="w-32 h-32 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-cyan-500/25">
                  <span className="text-6xl">🚀</span>
                </div>
                <h2 className="text-4xl font-bold text-white mb-4">
                  Welcome to App Launcher
                </h2>
                <p className="text-lg text-slate-400 mb-8">
                  Select an application from the sidebar to get started. All apps are fully integrated as components.
                </p>

                {/* Quick Launch Cards */}
                <div className="grid grid-cols-2 gap-4 mt-8">
                  {apps.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => handleAppSelect(app)}
                      className={`p-6 rounded-2xl border-2 ${app.borderColor} ${app.bgColor} hover:scale-105 transition-all duration-200 text-left group`}
                    >
                      <span className="text-4xl block mb-3">{app.icon}</span>
                      <h3 className="text-xl font-bold text-white mb-1">{app.name}</h3>
                      <p className="text-sm text-slate-400">{app.description}</p>
                      <div className="flex items-center gap-2 mt-4 text-slate-500 group-hover:text-white transition-colors">
                        <span className="text-xs">Launch →</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-12 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <p className="text-sm text-slate-400">
                    <span className="text-green-400">✓ All apps are integrated:</span> No external setup needed!
                  </p>
                  <div className="mt-3 text-left text-xs font-mono text-slate-500 space-y-1">
                    <p>• WeatherMeter: <code className="text-cyan-400">Integrated component - Ready to use</code></p>
                    <p>• SolarPowerMeter: <code className="text-amber-400">Integrated component - Ready to use</code></p>
                    <p>• Inverter Details: <code className="text-purple-400">Integrated component - Ready to use</code></p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
