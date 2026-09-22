export function TitleScreen({ copy, ready, lang, onLang, onPlayTeal, onPlayMango, onHow }) {
  return (
    <div className="screen title">
      <button type="button" className="lang" onClick={onLang} aria-label="Language">
        {lang === 'en' ? 'EN / ID' : 'ID / EN'}
      </button>
      <div className="brand">
        <h1>Boi-Boian</h1>
        <p>{copy.tagline}</p>
      </div>
      <div className="actions">
        <button
          type="button"
          id="startb"
          className="btn primary"
          disabled={!ready}
          onClick={onPlayTeal}
        >
          <span>{ready ? copy.playTeal : (lang === 'id' ? 'Memuat…' : 'Loading…')}</span>
          <small>{copy.playTealSub}</small>
        </button>
        <button type="button" className="btn mango" disabled={!ready} onClick={onPlayMango}>
          <span>{copy.playMango}</span>
          <small>{copy.playMangoSub}</small>
        </button>
        <button type="button" className="btn ghost" onClick={onHow}>
          <span>{copy.how}</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
