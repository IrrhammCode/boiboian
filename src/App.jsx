import { useCallback, useEffect, useRef, useState } from 'react';
import { BoiGame } from './game/BoiGame.js';
import { TitleScreen } from './components/TitleScreen.jsx';
import { Hud } from './components/Hud.jsx';
import { TouchControls } from './components/TouchControls.jsx';

const COPY = {
  en: {
    tagline: 'Neo-street court sports. Knock the stack. Pass — don’t run. Rebuild under fire. Shout Boi.',
    playTeal: 'Play Rebuild',
    playTealSub: 'Teal · stack under fire',
    playMango: 'Play Tag',
    playMangoSub: 'Mango · pass & hunt',
    how: 'How it works',
    howClose: 'Got it',
    rules: [
      'Knock the ceramic stack from the throw line.',
      'Whoever knocks it rebuilds. The other side tags with the ball.',
      'Holding the ball? You can’t run — pass.',
      'Finish the stack and shout Boi. First to 2 wins.',
    ],
  },
  id: {
    tagline: 'Olahraga lapangan neo-street. Robohkan susunan. Oper — jangan lari. Susun di bawah tembakan. Teriak Boi.',
    playTeal: 'Main Susun',
    playTealSub: 'Teal · susun di bawah tembakan',
    playMango: 'Main Tag',
    playMangoSub: 'Mango · oper & buru',
    how: 'Cara main',
    howClose: 'Mengerti',
    rules: [
      'Robohkan susunan keramik dari garis lempar.',
      'Yang merobohkan wajib menyusun. Lawan menag dengan bola.',
      'Pegang bola? Tidak boleh lari — oper.',
      'Selesai susun, teriak Boi. First to 2 menang.',
    ],
  },
};

export default function App() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const [lang, setLang] = useState('en');
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState('title'); // title | how | play | matchover
  const [hud, setHud] = useState(null);
  const [flash, setFlash] = useState(false);
  const [result, setResult] = useState(null);
  const copy = COPY[lang];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameRef.current) return undefined;
    const game = new BoiGame(canvas, {
      onReady: () => setReady(true),
      onStart: () => setScreen('play'),
      onHud: (h) => setHud(h),
      onFlash: (t) => {
        setFlash(true);
        setTimeout(() => setFlash(false), (t || 0.5) * 1000);
      },
      onMatchOver: (score) => {
        setResult(score);
        setScreen('matchover');
      },
    });
    gameRef.current = game;
    game.init().catch((e) => console.error(e));
    return () => { /* keep running for jam harness */ };
  }, []);

  useEffect(() => {
    gameRef.current?.setLang(lang);
  }, [lang]);

  const start = useCallback((side) => {
    setScreen('play');
    setResult(null);
    gameRef.current?.startMatch(side);
  }, []);

  const onMove = useCallback((x, z) => gameRef.current?.setMove(x, z), []);
  const onCharge = useCallback((on) => gameRef.current?.setTouchCharge(on), []);

  return (
    <div className="app">
      <canvas ref={canvasRef} className="game-canvas" id="game" />
      <div className={`flash${flash ? ' on' : ''}`} aria-hidden />

      <div className="overlay">
        {screen === 'title' && (
          <TitleScreen
            copy={copy}
            ready={ready}
            lang={lang}
            onLang={() => setLang((l) => (l === 'en' ? 'id' : 'en'))}
            onPlayTeal={() => start('teal')}
            onPlayMango={() => start('mango')}
            onHow={() => setScreen('how')}
          />
        )}

        {screen === 'how' && (
          <div className="screen">
            <div className="sheet">
              <button type="button" className="close" onClick={() => setScreen('title')}>×</button>
              <h2>{copy.how}</h2>
              <ol>
                {copy.rules.map((r) => <li key={r}>{r}</li>)}
              </ol>
              <button type="button" className="btn primary" style={{ marginTop: 16, width: '100%' }} onClick={() => setScreen('title')}>
                {copy.howClose}
              </button>
            </div>
          </div>
        )}

        {screen === 'matchover' && result && (
          <div className="screen">
            <div className="brand">
              <h1>{result.teal >= 2 ? 'TEAL' : 'MANGO'}</h1>
              <p>{lang === 'id' ? 'Menang' : 'Wins'} — {result.teal} : {result.mango}</p>
            </div>
            <div className="actions">
              <button type="button" className="btn primary" onClick={() => start('teal')}>
                {lang === 'id' ? 'Main lagi' : 'Rematch'}
              </button>
              <button type="button" className="btn ghost" onClick={() => setScreen('title')}>
                {lang === 'id' ? 'Judul' : 'Title'}
              </button>
            </div>
          </div>
        )}

        {screen === 'play' && hud && <Hud hud={hud} lang={lang} />}
        {screen === 'play' && (
          <TouchControls
            onMove={onMove}
            onCharge={onCharge}
            onPass={() => gameRef.current?.tapPass()}
            onAction={() => gameRef.current?.tapAction()}
            onSwap={() => gameRef.current?.tapSwap()}
            onBoi={() => gameRef.current?.tapBoi()}
            duty={hud?.duty}
          />
        )}
      </div>
    </div>
  );
}
