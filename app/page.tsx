'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import charityConfig from '../charity-config.json';
import triviaData from '../trivia.json';

type Screen = 'landing' | 'chat' | 'outcome';
type Message = { id: string; role: 'seagull' | 'user'; text: string };
type ShuffledOpt = { text: string; isCorrect: boolean };
type PendingQ = { slot: number; question: string; shuffled: ShuffledOpt[] };

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// Seagull wing SVG
function GullIcon({ size = 24 }: { size?: number }) {
  const h = Math.round(size * 0.58);
  return (
    <svg width={size} height={h} viewBox="0 0 24 14">
      <path d="M1 11 Q6 1 11 9 Q17 1 23 11" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export default function GamePage() {
  const router = useRouter();
  const charity = charityConfig;

  // UI state
  const [screen, setScreen] = useState<Screen>('landing');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [pending, setPending] = useState<PendingQ | null>(null);
  const [outcomeType, setOutcomeType] = useState<'voice' | 'action' | null>(null);
  const [roastLine, setRoastLine] = useState('');
  const [assignedAction, setAssignedAction] = useState(charity.actions[0]);
  const [pledged, setPledged] = useState(false);
  const [shared, setShared] = useState(false);
  const [readyCTA, setReadyCTA] = useState(false);
  const [chatError, setChatError] = useState(false);

  // Refs for async game flow (avoids stale closures)
  const nameRef = useRef('');
  const emailRef = useRef('');
  const questionsRef = useRef<typeof triviaData.questions>([]);
  const resultsRef = useRef<boolean[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);
  const gameActive = useRef(false);
  const pendingRef = useRef<PendingQ | null>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, typing]);

  const addMessage = useCallback((role: 'seagull' | 'user', text: string) => {
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role, text }]);
  }, []);

  const SEAGULL_ERRORS = [
    "The wifi's gone. Even seagulls have off days. Try again.",
    "Signal dropped off the pier. Refresh and we'll pretend this never happened.",
    "Something went wrong on my end. Blame the gulls, not the internet.",
  ];

  const fetchSeagull = async (phase: string, extra?: Record<string, unknown>): Promise<string | null> => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase, name: nameRef.current, ...extra }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      return (data.text || 'Caw.').trim();
    } catch {
      return null;
    }
  };

  const say = async (text: string) => {
    addMessage('seagull', text);
    await sleep(300);
  };

  const setPendingQ = (p: PendingQ | null) => {
    pendingRef.current = p;
    setPending(p);
  };

  const askQuestion = async (slot: number) => {
    const q = questionsRef.current[slot];
    if (!q) return;
    const opts: ShuffledOpt[] = q.options.map((o, i) => ({ text: o, isCorrect: i === q.correct }));
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    await say(`Q${slot + 1}. ${q.question}`);
    setPendingQ({ slot, question: q.question, shuffled: opts });
  };

  const handleAnswer = async (opt: ShuffledOpt) => {
    const p = pendingRef.current;
    if (!p) return;
    setPendingQ(null);
    const isCorrect = opt.isCorrect;
    resultsRef.current.push(isCorrect);
    const q = questionsRef.current[p.slot];

    addMessage('user', opt.text);
    await sleep(300);

    setTyping(true);
    const reaction = await fetchSeagull(isCorrect ? 'react-correct' : 'react-wrong', {
      question: q.question,
      answer: opt.text,
      correctAnswer: q.options[q.correct],
    });
    setTyping(false);

    if (reaction === null) { setChatError(true); return; }
    await say(reaction);

    if (resultsRef.current.length < 2) {
      await askQuestion(resultsRef.current.length);
    } else {
      const allCorrect = resultsRef.current.every(Boolean);
      setTyping(true);
      const finishText = await fetchSeagull(allCorrect ? 'finish-win' : 'finish-lose', { allCorrect });
      setTyping(false);
      if (finishText === null) { setChatError(true); return; }
      await say(finishText);
      setRoastLine(finishText);
      setOutcomeType(allCorrect ? 'voice' : 'action');
      await sleep(400);
      setReadyCTA(true);
    }
    gameActive.current = false;
  };

  const startGame = async () => {
    if (!nameRef.current.trim() || gameActive.current) return;
    gameActive.current = true;

    const allQ = triviaData.questions;
    const indices = [...Array(allQ.length).keys()].sort(() => Math.random() - 0.5).slice(0, 2);
    questionsRef.current = indices.map(i => allQ[i]);
    resultsRef.current = [];

    setScreen('chat');
    setMessages([]);
    setPendingQ(null);
    setOutcomeType(null);
    setRoastLine('');
    setReadyCTA(false);
    setPledged(false);
    setShared(false);
    setChatError(false);

    setTyping(true);
    const introText = await fetchSeagull('intro');
    setTyping(false);

    if (introText === null) { setChatError(true); return; }
    const lines = introText.split('\n').filter((l: string) => l.trim());
    for (const line of lines) {
      await say(line);
      await sleep(150);
    }

    await askQuestion(0);
    gameActive.current = true;
  };

  const goToOutcome = async () => {
    if (outcomeType === 'voice') {
      fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameRef.current, email: emailRef.current, outcome_type: 'voice', action: null }),
      }).catch(() => {});
    }
    setScreen('outcome');
  };

  const pledge = () => {
    if (pledged) return;
    fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameRef.current, email: emailRef.current, outcome_type: 'action', action: assignedAction }),
    }).catch(() => {});
    setPledged(true);
  };

  const handleShare = async () => {
    const shareText = `I'm a ${charity.charityName} Voice! Brighton's seagull certified me — can you beat the quiz? 🪶`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: 'Brighton Seagulls for Good', text: shareText }); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(shareText);
      setShared(true);
      setTimeout(() => setShared(false), 2200);
    } catch {}
  };

  const restart = () => {
    gameActive.current = false;
    setScreen('landing');
    setMessages([]);
    setPendingQ(null);
    setOutcomeType(null);
    setReadyCTA(false);
    setPledged(false);
    setShared(false);
    nameRef.current = '';
    emailRef.current = '';
    setName('');
    setEmail('');
  };

  const handleNameChange = (v: string) => { nameRef.current = v; setName(v); };
  const handleEmailChange = (v: string) => { emailRef.current = v; setEmail(v); };

  const canStart = name.trim().length > 0;
  const displayName = name.trim() || 'You';
  const revealCtaLabel = outcomeType === 'voice' ? 'Claim your Voice card 🏆' : 'Get your assignment ⚡';

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Hanken Grotesk', sans-serif", color: '#20323E', background: 'linear-gradient(#bfe0ec 0%, #cfe6ef 38%, #f3e6c6 100%)' }}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '22px 14px 40px' }}>
        <div style={{ width: '100%', maxWidth: '430px', background: '#FFFDF7', border: '3px solid #20323E', borderRadius: '22px', boxShadow: '8px 8px 0 rgba(32,50,62,.18)', overflow: 'hidden', minHeight: '660px', display: 'flex', flexDirection: 'column', position: 'relative' }}>

          {/* ── LANDING ── */}
          {screen === 'landing' && (
            <div style={{ padding: '30px 26px 26px', display: 'flex', flexDirection: 'column', flex: 1, background: 'radial-gradient(120% 80% at 80% -10%, #bfe0ec 0%, transparent 55%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: "'Anton', sans-serif", textTransform: 'uppercase', letterSpacing: '.12em', fontSize: '12px', color: '#3E94BD' }}>Brighton Seagulls</span>
                <span style={{ fontFamily: "'Caveat', cursive", fontSize: '24px', color: '#C8472F', transform: 'rotate(-6deg)', display: 'inline-block' }}>for good</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                <span style={{ fontFamily: "'Anton', sans-serif", textTransform: 'uppercase', letterSpacing: '.08em', fontSize: '10px', color: '#7c8a92' }}>Swooping for</span>
                <img src="/otm-logo.avif" alt="Over the Moon" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
              </div>

              <div style={{ marginTop: '34px' }}>
                <div style={{ fontFamily: "'Alfa Slab One', serif", fontSize: '54px', lineHeight: '.92', color: '#20323E', textShadow: '3px 3px 0 #bfe0ec' }}>GET<br />SWOOPED.</div>
                <p style={{ fontSize: '16px', lineHeight: 1.45, color: '#3a4a54', margin: '16px 2px 0', fontWeight: 500 }}>
                  Brighton&apos;s seagulls don&apos;t want your chips anymore. Two questions stand between you and glory. Get them right, you&apos;re a <strong style={{ color: charity.charityAccent }}>{charity.charityName}</strong> Voice. Get one wrong… you owe us.
                </p>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <span style={{ fontFamily: "'Anton', sans-serif", textTransform: 'uppercase', letterSpacing: '.1em', fontSize: '11px', color: '#20323E' }}>Your name</span>
                  <input
                    value={name}
                    onChange={e => handleNameChange(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && canStart && startGame()}
                    placeholder="e.g. Sam from Hove"
                    style={{ padding: '13px 14px', fontSize: '16px', fontFamily: "'Hanken Grotesk', sans-serif", border: '2.5px solid #20323E', borderRadius: '12px', background: '#fff', outline: 'none', color: '#20323E', width: '100%' }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <span style={{ fontFamily: "'Anton', sans-serif", textTransform: 'uppercase', letterSpacing: '.1em', fontSize: '11px', color: '#7c8a92' }}>
                    Email <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— optional, for the flock newsletter</span>
                  </span>
                  <input
                    value={email}
                    onChange={e => handleEmailChange(e.target.value)}
                    placeholder="you@brighton.co.uk"
                    style={{ padding: '13px 14px', fontSize: '16px', fontFamily: "'Hanken Grotesk', sans-serif", border: '2.5px solid #cdd6d1', borderRadius: '12px', background: '#fff', outline: 'none', color: '#20323E', width: '100%' }}
                  />
                </label>
              </div>

              <button
                onClick={startGame}
                disabled={!canStart}
                style={{ marginTop: '20px', padding: '15px', width: '100%', fontFamily: "'Anton', sans-serif", textTransform: 'uppercase', letterSpacing: '.05em', fontSize: '17px', borderRadius: '14px', border: '2.5px solid #20323E', cursor: canStart ? 'pointer' : 'not-allowed', background: canStart ? '#C8472F' : '#d8cdb4', color: canStart ? '#fff' : '#9a8f76', boxShadow: canStart ? '4px 4px 0 #20323E' : 'none', transition: 'all .12s' }}
              >
                Get Swooped 🪶
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px' }}>
                <button onClick={() => router.push('/about')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '12.5px', fontWeight: 600, color: '#7c8a92', textDecoration: 'underline', padding: 0 }}>
                  Built by Pankstr 🪶
                </button>
                <button onClick={() => router.push('/board')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '13px', fontWeight: 700, color: '#3E94BD', textDecoration: 'underline', padding: 0 }}>
                  Peek the board →
                </button>
              </div>
            </div>
          )}

          {/* ── CHAT ── */}
          {screen === 'chat' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '660px', background: '#eaf3f6' }}>
              {/* Chat header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '12px 14px', background: '#20323E', color: '#F3E6C6' }}>
                <button onClick={restart} style={{ background: 'none', border: 'none', color: '#F3E6C6', fontSize: '22px', cursor: 'pointer', lineHeight: 1, padding: '0 4px 0 0' }}>‹</button>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3E94BD', border: '2px solid #F3E6C6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GullIcon size={24} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                  <span style={{ fontFamily: "'Anton', sans-serif", letterSpacing: '.04em', fontSize: '16px' }}>THE SEAGULL</span>
                  <span style={{ fontSize: '11.5px', color: '#9fc6d6' }}>swooping for {charity.charityName}</span>
                </div>
                <span style={{ marginLeft: 'auto', width: '9px', height: '9px', borderRadius: '50%', background: charity.charityAccent, boxShadow: `0 0 0 3px ${charity.charityAccent}40` }} />
              </div>

              {/* Messages */}
              <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 8px', display: 'flex', flexDirection: 'column' }}>
                {messages.map(m => {
                  const isUser = m.role === 'user';
                  return (
                    <div key={m.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', justifyContent: isUser ? 'flex-end' : 'flex-start', margin: '0 0 11px' }}>
                      {!isUser && (
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#3E94BD', border: '2px solid #20323E', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <GullIcon size={18} />
                        </div>
                      )}
                      <div style={{ maxWidth: '76%', padding: '10px 13px', fontSize: '15px', lineHeight: 1.4, borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isUser ? '#3E94BD' : '#FFFDF7', color: isUser ? '#fff' : '#20323E', border: `2.5px solid ${isUser ? '#2c6f92' : '#20323E'}`, boxShadow: '2px 2px 0 rgba(32,50,62,.15)', fontWeight: 500, animation: 'pop .25s ease' }}>
                        {m.text}
                      </div>
                    </div>
                  );
                })}

                {typing && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', margin: '0 0 10px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#3E94BD', border: '2px solid #20323E', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <GullIcon size={18} />
                    </div>
                    <div style={{ background: '#FFFDF7', border: '2px solid #20323E', borderRadius: '16px 16px 16px 4px', padding: '12px 14px', display: 'flex', gap: '5px', boxShadow: '2px 2px 0 rgba(32,50,62,.15)' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#20323E', animation: 'blink 1.2s infinite', display: 'inline-block' }} />
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#20323E', animation: 'blink 1.2s .2s infinite', display: 'inline-block' }} />
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#20323E', animation: 'blink 1.2s .4s infinite', display: 'inline-block' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Answer chips / CTA */}
              <div style={{ padding: '10px 14px 16px', borderTop: '2px solid #d6e2e6', background: '#eaf3f6' }}>
                {pending && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {pending.shuffled.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleAnswer(opt)}
                        style={{ textAlign: 'left', padding: '12px 14px', fontSize: '15px', fontWeight: 600, fontFamily: "'Hanken Grotesk', sans-serif", background: '#FFFDF7', color: '#20323E', border: '2.5px solid #20323E', borderRadius: '13px', cursor: 'pointer', boxShadow: '2px 2px 0 rgba(32,50,62,.18)' }}
                      >
                        {opt.text}
                      </button>
                    ))}
                  </div>
                )}
                {!pending && readyCTA && outcomeType && (
                  <button
                    onClick={goToOutcome}
                    style={{ width: '100%', padding: '14px', fontFamily: "'Anton', sans-serif", textTransform: 'uppercase', letterSpacing: '.04em', fontSize: '15px', cursor: 'pointer', borderRadius: '13px', border: '2.5px solid #20323E', boxShadow: '3px 3px 0 #20323E', background: outcomeType === 'voice' ? charity.charityAccent : '#C8472F', color: '#fff', animation: 'pop .3s ease' }}
                  >
                    {revealCtaLabel}
                  </button>
                )}
                {!pending && !readyCTA && typing && (
                  <div style={{ textAlign: 'center', fontSize: '12.5px', color: '#9aa9b0', fontWeight: 600, padding: '4px' }}>
                    The seagull is composing its next insult…
                  </div>
                )}
                {chatError && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ textAlign: 'center', fontSize: '14px', color: '#C8472F', fontWeight: 600, padding: '8px 4px', lineHeight: 1.4 }}>
                      {SEAGULL_ERRORS[Math.floor(Math.random() * SEAGULL_ERRORS.length)]}
                    </div>
                    <button
                      onClick={() => { setChatError(false); restart(); }}
                      style={{ width: '100%', padding: '13px', fontFamily: "'Anton', sans-serif", textTransform: 'uppercase', letterSpacing: '.04em', fontSize: '14px', background: '#20323E', color: '#F3E6C6', border: '2.5px solid #20323E', borderRadius: '13px', cursor: 'pointer', boxShadow: '3px 3px 0 rgba(32,50,62,.3)' }}
                    >
                      Start over →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── OUTCOME: WIN ── */}
          {screen === 'outcome' && outcomeType === 'voice' && (
            <div style={{ flex: 1, minHeight: '660px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '26px 22px 24px', background: 'radial-gradient(120% 70% at 50% 0%, #bfe0ec 0%, #FFFDF7 60%)' }}>
              <div style={{ fontFamily: "'Caveat', cursive", fontSize: '26px', color: '#C8472F', transform: 'rotate(-4deg)', display: 'inline-block' }}>two from two!</div>

              {/* Share card */}
              <div style={{ marginTop: '14px', width: '100%', maxWidth: '330px', background: '#FFFDF7', border: '3px solid #20323E', borderRadius: '18px', boxShadow: '7px 7px 0 rgba(32,50,62,.2)', padding: '26px 22px 22px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '10px', right: '12px', width: '38px', height: '38px', border: '2px dashed #c9b487', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#b09a66', fontFamily: "'Anton', sans-serif", transform: 'rotate(8deg)', lineHeight: 1, textAlign: 'center' }}>BTN<br />HFG</div>
                {/* Seal */}
                <div style={{ width: '96px', height: '96px', margin: '0 auto', borderRadius: '50%', background: charity.charityAccent, border: '4px solid #20323E', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 5px #FFFDF7, 0 0 0 8px ${charity.charityAccent}` }}>
                  <GullIcon size={46} />
                </div>
                <div style={{ fontFamily: "'Anton', sans-serif", textTransform: 'uppercase', letterSpacing: '.18em', fontSize: '12px', color: charity.charityAccent, marginTop: '16px' }}>★ Official Voice ★</div>
                <div style={{ fontFamily: "'Alfa Slab One', serif", fontSize: '34px', lineHeight: 1, color: '#20323E', marginTop: '6px', wordBreak: 'break-word' }}>{displayName}</div>
                <div style={{ fontFamily: "'Anton', sans-serif", textTransform: 'uppercase', letterSpacing: '.06em', fontSize: '15px', color: '#3E94BD', marginTop: '8px' }}>is a {charity.charityName} Voice</div>
                <div style={{ height: '2px', background: 'repeating-linear-gradient(90deg, #20323E 0 6px, transparent 6px 12px)', margin: '16px 0 12px', opacity: .4 }} />
                <div style={{ fontSize: '11.5px', color: '#7c8a92', fontWeight: 600 }}>Verified by the flock · Brighton · est. 2026</div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', width: '100%', maxWidth: '330px' }}>
                <button onClick={handleShare} style={{ flex: 1, padding: '14px', fontFamily: "'Anton', sans-serif", letterSpacing: '.04em', fontSize: '15px', textTransform: 'uppercase', background: charity.charityAccent, color: '#fff', border: '2.5px solid #20323E', borderRadius: '13px', cursor: 'pointer', boxShadow: '3px 3px 0 #20323E' }}>Share it</button>
                <button onClick={() => router.push('/board')} style={{ flex: 1, padding: '14px', fontFamily: "'Anton', sans-serif", letterSpacing: '.04em', fontSize: '15px', textTransform: 'uppercase', background: '#FFFDF7', color: '#20323E', border: '2.5px solid #20323E', borderRadius: '13px', cursor: 'pointer', boxShadow: '3px 3px 0 rgba(32,50,62,.2)' }}>The Board</button>
              </div>
              <button onClick={restart} style={{ marginTop: '14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#7c8a92', textDecoration: 'underline' }}>Swoop someone else</button>
            </div>
          )}

          {/* ── OUTCOME: LOSE ── */}
          {screen === 'outcome' && outcomeType === 'action' && (
            <div style={{ flex: 1, minHeight: '660px', display: 'flex', flexDirection: 'column', padding: '26px 24px 24px', background: 'radial-gradient(120% 70% at 50% 0%, #f6d2cb 0%, #FFFDF7 62%)' }}>
              <div style={{ fontFamily: "'Caveat', cursive", fontSize: '26px', color: '#C8472F', transform: 'rotate(-3deg)', display: 'inline-block' }}>ohhh dear.</div>
              <div style={{ fontFamily: "'Alfa Slab One', serif", fontSize: '50px', lineHeight: '.92', color: '#C8472F', textShadow: '3px 3px 0 #20323E', marginTop: '4px' }}>YOU OWE<br />THE GULLS.</div>

              <div style={{ marginTop: '18px', background: '#FFFDF7', border: '2.5px solid #20323E', borderRadius: '4px 16px 16px 16px', padding: '15px 16px', boxShadow: '3px 3px 0 rgba(32,50,62,.18)', fontSize: '16px', lineHeight: 1.45, fontWeight: 600, color: '#20323E' }}>
                &ldquo;{roastLine}&rdquo;
              </div>

              <div style={{ marginTop: '24px' }}>
                <div style={{ fontFamily: "'Anton', sans-serif", textTransform: 'uppercase', letterSpacing: '.1em', fontSize: '12px', color: charity.charityAccent }}>⚡ Your assignment</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginTop: '10px' }}>
                  {charity.actions.map(a => {
                    const active = a === assignedAction;
                    return (
                      <button
                        key={a}
                        onClick={() => { setAssignedAction(a); setPledged(false); }}
                        style={{ textAlign: 'left', padding: '13px 15px', fontSize: '14.5px', fontWeight: 700, fontFamily: "'Hanken Grotesk', sans-serif", borderRadius: '13px', cursor: 'pointer', background: active ? '#eafaf2' : '#FFFDF7', color: '#20323E', border: `2.5px solid ${active ? charity.charityAccent : '#cdd6d1'}`, boxShadow: active ? `2px 2px 0 ${charity.charityAccent}` : 'none' }}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                <button
                  onClick={pledge}
                  style={{ width: '100%', padding: '15px', fontFamily: "'Anton', sans-serif", textTransform: 'uppercase', letterSpacing: '.04em', fontSize: '16px', borderRadius: '13px', cursor: 'pointer', border: '2.5px solid #20323E', boxShadow: '3px 3px 0 #20323E', background: pledged ? charity.charityAccent : '#20323E', color: '#fff' }}
                >
                  {pledged ? "Pledged ✓ — you're on the board" : "I'm in — pledge it"}
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '13px' }}>
                  <button onClick={restart} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#7c8a92', textDecoration: 'underline' }}>Try again</button>
                  <button onClick={() => router.push('/board')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#3E94BD', textDecoration: 'underline' }}>See the board →</button>
                </div>
              </div>
            </div>
          )}

          {/* Toast */}
          {shared && (
            <div style={{ position: 'absolute', left: '50%', bottom: '20px', transform: 'translateX(-50%)', background: '#20323E', color: '#F3E6C6', padding: '11px 18px', borderRadius: '999px', fontSize: '13.5px', fontWeight: 700, boxShadow: '0 6px 18px rgba(0,0,0,.25)', zIndex: 30, whiteSpace: 'nowrap' }}>
              🔗 Share link copied — go forth and brag
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
