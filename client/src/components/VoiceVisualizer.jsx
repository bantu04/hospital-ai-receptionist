import React, { useEffect, useRef } from 'react';
import './VoiceVisualizer.css';

const VoiceVisualizer = ({ isActive, audioLevel, type = 'input' }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = (canvas.width = 420);
    const height = (canvas.height = 70);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      if (!isActive) {
        drawIdle(ctx, width, height);
      } else {
        drawActive(ctx, width, height, audioLevel, type);
      }
      animationRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, audioLevel, type]);

  const drawIdle = (ctx, width, height) => {
    const bars = 28;
    const bw = (width - (bars - 1) * 2) / bars;
    for (let i = 0; i < bars; i++) {
      const x = i * (bw + 2);
      const h = 8 + Math.sin(Date.now() * 0.002 + i * 0.4) * 3;
      const y = height - h;
      const g = ctx.createLinearGradient(0, y, 0, height);
      g.addColorStop(0, 'rgba(148, 163, 184, 0.4)');
      g.addColorStop(1, 'rgba(30, 64, 175, 0.1)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, bw, h);
    }
  };

  const drawActive = (ctx, width, height, level, type) => {
    const bars = 28;
    const bw = (width - (bars - 1) * 2) / bars;
    for (let i = 0; i < bars; i++) {
      const x = i * (bw + 2);
      const wave = Math.sin(Date.now() * 0.01 + i * 0.5);
      const h = 12 + (wave + 1) * 18 * level;
      const y = height - h;
      const g = ctx.createLinearGradient(0, y, 0, height);
      if (type === 'input') {
        g.addColorStop(0, '#22c55e');
        g.addColorStop(1, '#0ea5e9');
      } else {
        g.addColorStop(0, '#6366f1');
        g.addColorStop(1, '#8b5cf6');
      }
      ctx.fillStyle = g;
      ctx.shadowColor = 'rgba(129, 140, 248, 0.8)';
      ctx.shadowBlur = 12;
      ctx.fillRect(x, y, bw, h);
    }
    ctx.shadowBlur = 0;
  };

  return (
    <div className={`voice-visualizer ${isActive ? 'active' : ''} ${type}`}>
      <canvas ref={canvasRef} className="visualizer-canvas" />
      <div className="visualizer-label">
        {type === 'input' ? 'Listening...' : 'Speaking...'}
      </div>
    </div>
  );
};

export default VoiceVisualizer;
