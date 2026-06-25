'use client';

import { useState } from 'react';

export default function LeadsButton() {
  const [mode, setMode] = useState<'idle' | 'prompt'>('idle');
  const [pw, setPw] = useState('');
  const [error, setError] = useState(false);

  const download = async () => {
    const res = await fetch(`/api/leads-export?key=${encodeURIComponent(pw)}`);
    if (res.status === 401) { setError(true); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads.csv';
    a.click();
    URL.revokeObjectURL(url);
    setMode('idle');
    setPw('');
    setError(false);
  };

  if (mode === 'idle') {
    return (
      <button
        onClick={() => setMode('prompt')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '4px', lineHeight: 1, opacity: 0.5 }}
        title="Export leads"
      >
        🔐
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <input
        autoFocus
        type="password"
        placeholder="password"
        value={pw}
        onChange={e => { setPw(e.target.value); setError(false); }}
        onKeyDown={e => e.key === 'Enter' && download()}
        style={{ padding: '6px 10px', fontSize: '13px', fontFamily: "'Hanken Grotesk', sans-serif", border: `2px solid ${error ? '#C8472F' : '#20323E'}`, borderRadius: '8px', outline: 'none', width: '110px', color: '#20323E' }}
      />
      <button
        onClick={download}
        style={{ padding: '6px 10px', fontSize: '12px', fontFamily: "'Anton', sans-serif", textTransform: 'uppercase', letterSpacing: '.04em', background: '#20323E', color: '#F3E6C6', border: '2px solid #20323E', borderRadius: '8px', cursor: 'pointer' }}
      >
        Go
      </button>
      <button
        onClick={() => { setMode('idle'); setPw(''); setError(false); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#9aa9b0', padding: '2px' }}
      >
        ✕
      </button>
    </div>
  );
}
