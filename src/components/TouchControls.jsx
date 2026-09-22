import { useEffect, useRef } from 'react';

function writeStick(x, z) {
  window.__STICK__ = { x, z };
}

export function TouchControls({ onMove, onCharge, onPass, onAction, onSwap, onBoi, duty }) {
  const zoneRef = useRef(null);
  const baseRef = useRef(null);
  const knobRef = useRef(null);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  useEffect(() => {
    const zone = zoneRef.current;
    const base = baseRef.current;
    const knob = knobRef.current;
    if (!zone || !base || !knob) return undefined;

    let active = false;
    writeStick(0, 0);

    const setKnob = (x, y) => {
      knob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    };

    const apply = (clientX, clientY) => {
      const rect = base.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const max = Math.max(28, rect.width * 0.45);
      const len = Math.hypot(dx, dy) || 1;
      if (len > max) { dx = (dx / len) * max; dy = (dy / len) * max; }
      setKnob(dx, dy);
      const x = dx / max;
      const z = dy / max;
      writeStick(x, z);
      onMoveRef.current(x, z);
    };

    const clear = () => {
      active = false;
      setKnob(0, 0);
      writeStick(0, 0);
      onMoveRef.current(0, 0);
    };

    const startAt = (x, y) => { active = true; apply(x, y); };

    // Prefer pointer + mouse (Puppeteer phone profile still synthesizes these in some paths)
    const onPointerDown = (e) => {
      try { zone.setPointerCapture?.(e.pointerId); } catch { /* ignore */ }
      startAt(e.clientX, e.clientY);
    };
    const onPointerMove = (e) => { if (active) apply(e.clientX, e.clientY); };
    const onPointerUp = () => clear();

    const onTouchStart = (e) => {
      const t = e.changedTouches?.[0] || e.touches?.[0];
      if (t) startAt(t.clientX, t.clientY);
    };
    const onTouchMove = (e) => {
      if (!active) return;
      const t = e.touches?.[0];
      if (t) apply(t.clientX, t.clientY);
    };

    zone.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    zone.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onPointerUp, { passive: true });
    window.addEventListener('touchcancel', onPointerUp, { passive: true });
    // Mouse fallback for harness / desktop
    zone.addEventListener('mousedown', (e) => startAt(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => { if (active) apply(e.clientX, e.clientY); });
    window.addEventListener('mouseup', onPointerUp);

    return () => {
      clear();
      zone.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      zone.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onPointerUp);
      window.removeEventListener('touchcancel', onPointerUp);
    };
  }, []);

  return (
    <div className="touch">
      <div id="stick" className="stick-zone" ref={zoneRef}>
        <div className="stick-base" ref={baseRef}>
          <div className="stick-knob" ref={knobRef} />
        </div>
      </div>
      <div className="action-pad">
        <button type="button" className="act" onPointerDown={onSwap}>SWAP</button>
        <button type="button" className="act pass" onPointerDown={onPass}>PASS</button>
        <button
          type="button"
          className="act throw"
          onPointerDown={() => onCharge(true)}
          onPointerUp={() => onCharge(false)}
          onPointerLeave={() => onCharge(false)}
        >
          THROW
        </button>
        <button
          type="button"
          className="act primary"
          onPointerDown={() => (duty === 'rebuild' ? onAction() : onBoi())}
        >
          {duty === 'rebuild' ? 'PLACE' : 'BOI'}
        </button>
      </div>
    </div>
  );
}
