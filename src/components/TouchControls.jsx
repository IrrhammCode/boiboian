import { useRef } from 'react';

export function TouchControls({ onMove, onCharge, onPass, onAction, onSwap, onBoi, duty }) {
  const baseRef = useRef(null);
  const knobRef = useRef(null);
  const active = useRef(null);

  const setKnob = (x, y) => {
    const knob = knobRef.current;
    if (!knob) return;
    knob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  };

  const onStick = (e) => {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const t = e.touches?.[0] || e;
    let dx = t.clientX - cx;
    let dy = t.clientY - cy;
    const max = rect.width * 0.38;
    const len = Math.hypot(dx, dy) || 1;
    if (len > max) { dx = (dx / len) * max; dy = (dy / len) * max; }
    setKnob(dx, dy);
    // jam harness drags "up" on stick — map screen up to world -Z forward
    onMove(dx / max, dy / max);
  };

  const endStick = () => {
    setKnob(0, 0);
    onMove(0, 0);
    active.current = null;
  };

  return (
    <div className="touch">
      <div
        id="stick"
        className="stick-zone"
        onPointerDown={(e) => {
          active.current = 'stick';
          e.currentTarget.setPointerCapture(e.pointerId);
          onStick(e);
        }}
        onPointerMove={(e) => { if (active.current === 'stick') onStick(e); }}
        onPointerUp={endStick}
        onPointerCancel={endStick}
      >
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
