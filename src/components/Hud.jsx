export function Hud({ hud, lang, onPause }) {
  const dutyMap = {
    knock: 'Knock',
    rebuild: lang === 'id' ? 'Susun' : 'Rebuild',
    tag: 'Tag',
    countdown: '…',
    resolve: '…',
    live: 'Live',
  };
  return (
    <div className="hud">
      <div className="hud-top">
        <div className="pill teal"><span className="dot" />{hud.score.teal}</div>
        <div className="pill">
          R{hud.round}
          {hud.phase === 'live' ? ` · ${hud.timer}s` : ''}
          {hud.phase === 'knock' ? ` · ${hud.knockLeft}` : ''}
          {hud.phase === 'live' ? ` · ${hud.placed}/12` : ''}
        </div>
        <div className="pill mango"><span className="dot" />{hud.score.mango}</div>
        <button type="button" className="pill pause-btn" onClick={onPause} style={{ pointerEvents: 'auto' }}>
          {hud.paused ? '▶' : 'Ⅱ'}
        </button>
      </div>
      {hud.duty && hud.duty !== 'countdown' && (
        <div className="hud-top duty-row">
          <div className={`pill ${hud.duty === 'rebuild' ? 'teal' : 'mango'}`}>
            <span className="dot" />
            {dutyMap[hud.duty] || hud.duty}
            {hud.chain > 0 ? ` · x${hud.chain}` : ''}
            {hud.holdWarn ? (lang === 'id' ? ' · OPER!' : ' · PASS!') : ''}
          </div>
        </div>
      )}
      {hud.toast ? <div className="toast">{hud.toast}</div> : null}
      {hud.paused ? <div className="toast">{lang === 'id' ? 'Jeda' : 'Paused'}</div> : null}
    </div>
  );
}
