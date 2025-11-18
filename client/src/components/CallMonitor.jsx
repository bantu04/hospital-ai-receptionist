import React from 'react';
import { Phone, User, Clock } from 'lucide-react';
import './CallMonitor.css';

const CallMonitor = ({ activeCalls }) => {
  return (
    <div className="call-monitor">
      <div className="monitor-header">
        <h2>
          <Phone size={22} />
          Active Calls
        </h2>
        <div className="call-stats">
          <span>{activeCalls.length} live</span>
        </div>
      </div>

      <div className="calls-grid">
        {activeCalls.length === 0 ? (
          <div className="empty-state">
            <Phone size={40} />
            <h3>No active calls</h3>
            <p>When patients call your Twilio number, they will appear here in real time.</p>
          </div>
        ) : (
          activeCalls.map((call) => (
            <div key={call.callId} className="call-card">
              <div className="call-header">
                <div className="caller-info">
                  <User size={16} />
                  <span className="caller-number">{call.callerPhone}</span>
                </div>
                <div className="call-duration">
                  <Clock size={14} />
                  <span>Live</span>
                </div>
              </div>

              <div className="call-conversation">
                <h4>Last messages</h4>
                {(call.conversation || []).slice(-3).map((msg, i) => (
                  <div
                    key={i}
                    className={`conversation-message ${msg.role === 'user' ? 'user' : 'assistant'}`}
                  >
                    <span className="message-role">
                      {msg.role === 'user' ? 'Patient' : 'AI'}:
                    </span>
                    <p>{msg.content}</p>
                    <span className="message-time">
                      {msg.timestamp
                        ? new Date(msg.timestamp).toLocaleTimeString()
                        : ''}
                    </span>
                  </div>
                ))}
                {(!call.conversation || call.conversation.length === 0) && (
                  <div className="no-messages">No messages yet...</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CallMonitor;
