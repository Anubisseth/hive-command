import { useEffect, useRef, memo } from 'react';

const CHARS = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレゲゼデベペオォコソトノホモヨョロゴゾドボポヴッン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%^&*';
const FONT_SIZE = 14;
const FADE_ALPHA = 0.05;
const FRAME_INTERVAL = 38; // ms between frames

function MatrixRain({ color = '#00FF88', opacity = 0.15 }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    // Respect prefers-reduced-motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let rafId;
    let lastFrame = 0;
    let columns;
    let drops;

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      columns = Math.floor(canvas.width / FONT_SIZE);
      drops = Array.from({ length: columns }, () => Math.random() * -100);
    }

    function draw(timestamp) {
      rafId = requestAnimationFrame(draw);

      // Throttle to save performance
      if (timestamp - lastFrame < FRAME_INTERVAL) return;
      lastFrame = timestamp;

      // Semi-transparent black to create the fade trail
      ctx.fillStyle = `rgba(5, 8, 10, ${FADE_ALPHA})`; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${FONT_SIZE}px 'JetBrains Mono', monospace`;
      
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (let i = 0; i < columns; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const x = i * FONT_SIZE;
        const y = drops[i] * FONT_SIZE;

        const dist = Math.hypot(x - mx, y - my);
        const isNearMouse = dist < 120;

        if (isNearMouse) {
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#00D4FF';
        } else {
          ctx.shadowBlur = 0;
        }

        // Bright head character
        ctx.globalAlpha = isNearMouse ? 1 : 0.9;
        ctx.fillStyle = isNearMouse ? '#00D4FF' : '#FFFFFF';
        ctx.fillText(char, x, y);

        // Trail characters
        ctx.globalAlpha = isNearMouse ? 0.9 : 0.5;
        ctx.fillStyle = isNearMouse ? '#00FF88' : color;
        if (isNearMouse) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#00FF88';
        }
        ctx.fillText(char, x, y);

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        
        // Mouse interaction: accelerate drops if mouse is above them
        if (isNearMouse && my > y && my - y < 150) {
          drops[i] += 1.8;
        } else {
          drops[i] += 0.9; // Base speed
        }
      }
    }

    const handleMouseMove = (e) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        mouseRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      }
    };

    resize();
    rafId = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [color]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

export default memo(MatrixRain);
