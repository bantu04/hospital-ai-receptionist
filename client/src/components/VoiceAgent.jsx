import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Volume2, User, Zap, Brain } from 'lucide-react';
import AnimatedAvatar from './AnimatedAvatar.jsx';
import VoiceVisualizer from './VoiceVisualizer.jsx';
import './VoiceAgent.css';

const VoiceAgent = ({ socket, isConnected, activeCalls }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const currentCall = activeCalls[0] || null;

  useEffect(() => {
    if (!socket) return;

    const handler = (data) => {
      if (data.message.role === 'assistant') {
        setIsSpeaking(true);
        const duration = Math.max(2000, data.message.content.length * 40);
        setTimeout(() => setIsSpeaking(false), duration);
      } else {
        setIsListening(true);
        setTimeout(() => setIsListening(false), 800);
      }
    };

    socket.on('conversation-message', handler);
    return () => {
      socket.off('conversation-message', handler);
    };
  }, [socket]);

  useEffect(() => {
    let interval;
    if (isSpeaking || isListening) {
      interval = setInterval(() => {
        setAudioLevel(Math.random() * 0.8 + 0.2);
      }, 120);
    } else {
      setAudioLevel(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSpeaking, isListening]);

  const getCallStatus = () => {
    if (!currentCall) return 'Waiting for calls...';
    if (currentCall.status === 'ringing') return 'Incoming call...';
    if (currentCall.status === 'active') return 'Call in progress';
    return 'Ready';
  };

  return (
    <div className="voice-agent">
      <div className="background-effects">
        <div className="glowing-orbs">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>
        <div className="fog-layer" />
      </div>

      <div className="agent-container">
        <div className="agent-header">
          <div className="connection-status">
            <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
            <span>{isConnected ? 'System online' : 'System offline'}</span>
          </div>

          <div className="call-status">
            <div className={`status-badge ${currentCall ? 'active' : 'idle'}`}>
              {getCallStatus()}
            </div>
          </div>
        </div>

        <div className="avatar-section">
          <AnimatedAvatar
            isSpeaking={isSpeaking}
            isListening={isListening}
            audioLevel={audioLevel}
            voice="spruce"
          />
          <div className="visualizer-container">
            <VoiceVisualizer
              isActive={isSpeaking || isListening}
              audioLevel={audioLevel}
              type={isListening ? 'input' : 'output'}
            />
          </div>
        </div>

        {currentCall && (
          <div className="call-info">
            <div className="caller-details">
              <User size={16} />
              <span className="caller-number">{currentCall.callerPhone}</span>
              <span className="call-time">
                {new Date(currentCall.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <div className="conversation-preview">
              {(currentCall.conversation || []).slice(-2).map((msg, i) => (
                <div key={i} className={`message-preview ${msg.role}`}>
                  <p>{msg.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="system-status">
          <div className="status-item">
            <Zap size={14} />
            <span>Model: Gemini 1.5 Flash</span>
          </div>
          <div className="status-item">
            <Brain size={14} />
            <span>Hospital: Aditya Hospital</span>
          </div>
          <div className="status-item">
            <Volume2 size={14} />
            <span>Twilio voice: en-IN</span>
          </div>
        </div>

        <div className="call-controls">
          {currentCall ? (
            <button className="control-btn danger">
              <PhoneOff size={20} />
              End call (demo only)
            </button>
          ) : (
            <div className="idle-controls">
              <Phone size={24} />
              <p>Waiting for incoming calls...</p>
              <span>
                Twilio Number:{' '}
                {import.meta.env.VITE_TWILIO_PHONE_NUMBER || 'Configure in client .env'}
              </span>
            </div>
          )}
        </div>

        <div className="quick-stats">
          <div className="stat">
            <span className="stat-value">{activeCalls.length}</span>
            <span className="stat-label">Active Calls</span>
          </div>
          <div className="stat">
            <span className="stat-value">24/7</span>
            <span className="stat-label">Availability</span>
          </div>
          <div className="stat">
            <span className="stat-value">Cloud</span>
            <span className="stat-label">Deployment</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAgent;
