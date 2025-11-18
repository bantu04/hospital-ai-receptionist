import React, { useEffect, useRef } from 'react';
import './AnimatedAvatar.css';

const AnimatedAvatar = ({ isSpeaking, isListening, audioLevel, voice }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = (canvas.width = 260);
    const height = (canvas.height = 260);

    const particles = [];
    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = width / 2 + (Math.random() - 0.5) * 80;
        this.y = height / 2 + (Math.random() - 0.5) * 80;
        this.size = Math.random() * 30 + 20;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4;
        this.opacity = Math.random() * 0.18 + 0.08;
      }
      update() {
        this.x += this.speedX * (isSpeaking ? 1.6 : 1);
        this.y += this.speedY * (isSpeaking ? 1.6 : 1);
        if (
          this.x < -60 ||
          this.x > width + 60 ||
          this.y < -60 ||
          this.y > height + 60
        ) {
          this.reset();
        }
      }
      draw() {
        const gradient = ctx.createRadialGradient(
          this.x,
          this.y,
          0,
          this.x,
          this.y,
          this.size
        );
        gradient.addColorStop(0, `rgba(129, 140, 248, ${this.opacity})`);
        gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < 14; i++) {
      particles.push(new Particle());
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      animationRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isSpeaking]);

  const getGradient = () => {
    switch (voice) {
      case 'nova':
        return 'linear-gradient(135deg, #fb7185, #facc15)';
      case 'sage':
        return 'linear-gradient(135deg, #22c55e, #14b8a6)';
      default:
        return 'linear-gradient(135deg, #6366f1, #8b5cf6)';
    }
  };

  return (
    <div className="animated-avatar">
      <div
        className={`avatar-glow ${isSpeaking ? 'speaking' : ''} ${
          isListening ? 'listening' : ''
        }`}
        style={{ background: getGradient() }}
      />
      <div className="avatar-circle" style={{ background: getGradient() }}>
        <canvas ref={canvasRef} className="avatar-canvas" />
        <div className="avatar-core">
          <div className="core-glow" />
        </div>
        <div className={`pulse-ring ring-1 ${isSpeaking ? 'active' : ''}`} />
        <div className={`pulse-ring ring-2 ${isSpeaking ? 'active' : ''}`} />
        <div className={`pulse-ring ring-3 ${isListening ? 'active' : ''}`} />
      </div>
      <div className="avatar-status">
        {isSpeaking && <div className="status-speaking">Speaking</div>}
        {isListening && <div className="status-listening">Listening</div>}
        {!isSpeaking && !isListening && <div className="status-ready">Ready</div>}
      </div>
    </div>
  );
};

export default AnimatedAvatar;
