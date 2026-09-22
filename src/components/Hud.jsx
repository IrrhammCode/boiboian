export function Hud({ hud, lang }) {
  const dutyMap = {
    knock: lang === 'id' ? 'Knock' : 'Knock',
    rebuild: lang === 'id' ? 'Susun' : 'Rebuild',
    tag: lang === 'id' ? 'Tag' : 'Tag',
    countdown: '…',
    resolve: '…',
    live: lang === 'id' ? 'Live' : 'Live',
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
      </div>
      {hud.duty && hud.duty !== 'countdown' && (
        <div className="hud-top" style={{ top: 'auto', bottom: 'auto', marginTop: 52 }}>
          <div className={`pill ${hud.duty === 'rebuild' ? 'teal' : 'mango'}`}>
            <span className="dot" />
            {dutyMap[hud.duty] || hud.duty}
            {hud.chain > 0 ? ` · x${hud.chain}` : ''}
            {hud.holdWarn ? (lang === 'id' ? ' · OPER!' : ' · PASS!') : ''}
          </div>
        </div>
      )}
      {hud.toast ? <div className="toast">{hud.toast}</div> : null}
    </div>
  );
}
