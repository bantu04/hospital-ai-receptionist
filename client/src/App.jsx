import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import VoiceAgent from './components/VoiceAgent.jsx';
import CallMonitor from './components/CallMonitor.jsx';
import { Phone, BarChart3 } from 'lucide-react';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState('voice');
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeCalls, setActiveCalls] = useState([]);

  useEffect(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
    const s = io(serverUrl);
    setSocket(s);

    s.on('connect', () => {
      setIsConnected(true);
    });
    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('call-incoming', (callData) => {
      setActiveCalls((prev) => [...prev, { ...callData, status: 'ringing', conversation: [] }]);
    });

    s.on('call-ended', (data) => {
      setActiveCalls((prev) => prev.filter((c) => c.callId !== data.callId));
    });

    s.on('conversation-message', (data) => {
      setActiveCalls((prev) =>
        prev.map((call) =>
          call.callId === data.callId
            ? { ...call, conversation: [...(call.conversation || []), data.message] }
            : call
        )
      );
    });

    return () => {
      s.disconnect();
    };
  }, []);

  const views = [
    { id: 'voice', label: 'AI Voice Agent', icon: Phone, component: VoiceAgent },
    { id: 'monitor', label: 'Call Monitor', icon: BarChart3, component: CallMonitor }
  ];

  const ActiveComponent =
    views.find((v) => v.id === activeView)?.component || VoiceAgent;

  return (
    <div className="app">
      <nav className="app-sidebar">
        <div className="sidebar-header">
          <div className="app-logo">
            <div className="logo-icon">🏥</div>
            <div className="logo-text">
              <h1>Aditya AI</h1>
              <span>Hospital Receptionist</span>
            </div>
          </div>
        </div>

        <div className="sidebar-nav">
          {views.map((view) => {
            const Icon = view.icon;
            return (
              <button
                key={view.id}
                className={`nav-item ${activeView === view.id ? 'active' : ''}`}
                onClick={() => setActiveView(view.id)}
              >
                <Icon size={20} />
                <span>{view.label}</span>
              </button>
            );
          })}
        </div>

        <div className="sidebar-footer">
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            <div className="status-dot"></div>
            <span>{isConnected ? 'Connected to server' : 'Disconnected'}</span>
          </div>
          <div className="active-calls">
            <span>{activeCalls.length} Active Calls</span>
          </div>
        </div>
      </nav>

      <main className="app-main">
        <ActiveComponent socket={socket} isConnected={isConnected} activeCalls={activeCalls} />
      </main>
    </div>
  );
}

export default App;
