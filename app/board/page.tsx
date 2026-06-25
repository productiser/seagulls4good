import { getLeads } from '../../lib/storage';
import { Lead } from '../../lib/types';
import charityConfig from '../../charity-config.json';
import Link from 'next/link';
import LeadsButton from './LeadsButton';

function timeago(ts: string) {
  const m = Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 60000));
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

export default async function BoardPage() {
  let leads: Lead[] = [];
  try { leads = await getLeads(); } catch {}
  leads.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const voices = leads.filter(l => l.outcome_type === 'voice');
  const actions = leads.filter(l => l.outcome_type === 'action');
  const charity = charityConfig;

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Hanken Grotesk', sans-serif", color: '#20323E', background: 'linear-gradient(#bfe0ec 0%, #cfe6ef 38%, #f3e6c6 100%)' }}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '22px 14px 40px' }}>
        <div style={{ width: '100%', maxWidth: '430px', background: '#FFFDF7', border: '3px solid #20323E', borderRadius: '22px', boxShadow: '8px 8px 0 rgba(32,50,62,.18)', overflow: 'hidden', minHeight: '660px', display: 'flex', flexDirection: 'column' }}>

          {/* Header */}
          <div style={{ padding: '18px 20px 14px', background: '#20323E', color: '#F3E6C6' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Link href="/" style={{ background: 'none', border: 'none', color: '#F3E6C6', fontSize: '22px', cursor: 'pointer', padding: 0, textDecoration: 'none', lineHeight: 1 }}>‹</Link>
              <span style={{ fontSize: '11px', color: '#9fc6d6', fontWeight: 600 }}>↻ refreshed on load</span>
            </div>
            <div style={{ fontFamily: "'Alfa Slab One', serif", fontSize: '36px', lineHeight: 1, marginTop: '6px' }}>THE BOARD</div>
            <div style={{ fontSize: '13px', color: '#9fc6d6', marginTop: '4px' }}>How Brighton is the flock today?</div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 24px' }}>

            {/* Charity Voices */}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Anton', sans-serif", textTransform: 'uppercase', letterSpacing: '.08em', fontSize: '15px', color: charity.charityAccent }}>🏆 Charity Voices</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#7c8a92' }}>{voices.length} certified</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '11px' }}>
              {voices.length === 0 && (
                <span style={{ fontSize: '14px', color: '#9aa9b0', fontWeight: 600 }}>No voices yet — be the first!</span>
              )}
              {voices.map((v, i) => (
                <span key={i} style={{ padding: '7px 12px', background: '#eafaf2', border: `2px solid ${charity.charityAccent}`, borderRadius: '999px', fontSize: '13.5px', fontWeight: 700, color: '#1c6b48' }}>
                  {v.name}
                </span>
              ))}
            </div>

            {/* Pledged Actions */}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '26px' }}>
              <span style={{ fontFamily: "'Anton', sans-serif", textTransform: 'uppercase', letterSpacing: '.08em', fontSize: '15px', color: '#C8472F' }}>⚡ Pledged Actions</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#7c8a92' }}>{actions.length} on the hook</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginTop: '11px' }}>
              {actions.length === 0 && (
                <span style={{ fontSize: '14px', color: '#9aa9b0', fontWeight: 600 }}>No pledges yet — go get swooped.</span>
              )}
              {actions.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '11px 13px', background: '#FFFDF7', border: '2px solid #e2dcc8', borderRadius: '13px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#f3e0db', border: '2px solid #C8472F', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Anton', sans-serif", color: '#C8472F', fontSize: '14px' }}>
                    {(a.name || '?').trim().charAt(0).toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#20323E' }}>{a.name}</span>
                    <span style={{ fontSize: '13px', color: '#5a6a72' }}>{a.action}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#9aa9b0', fontWeight: 600, flexShrink: 0 }}>{timeago(a.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer CTA */}
          <div style={{ padding: '14px 20px 20px', borderTop: '2px solid #eee3cc' }}>
            <Link href="/" style={{ display: 'block', width: '100%', padding: '14px', fontFamily: "'Anton', sans-serif", letterSpacing: '.04em', textTransform: 'uppercase', fontSize: '15px', background: '#C8472F', color: '#fff', border: '2.5px solid #20323E', borderRadius: '13px', cursor: 'pointer', boxShadow: '3px 3px 0 #20323E', textAlign: 'center', textDecoration: 'none' }}>
              Get Swooped →
            </Link>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <LeadsButton />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
