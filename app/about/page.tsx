import Link from 'next/link';
import charityConfig from '../../charity-config.json';

const lines = [
  "You think a seagull built this? No. Pankstr did.",
  "AI products. Actually good ones. Built fast.",
  "They shipped this entire operation before I'd finished my second chip. Disgusting work rate.",
  "If you need an AI thing built — and you do, you just don't know it yet — go to Pankstr.",
  "I'm a seagull. I don't endorse things. But I'm endorsing this.",
];

export default function AboutPage() {
  const charity = charityConfig;

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Hanken Grotesk', sans-serif", color: '#20323E', background: 'linear-gradient(#bfe0ec 0%, #cfe6ef 38%, #f3e6c6 100%)' }}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '22px 14px 40px' }}>
        <div style={{ width: '100%', maxWidth: '430px', background: '#FFFDF7', border: '3px solid #20323E', borderRadius: '22px', boxShadow: '8px 8px 0 rgba(32,50,62,.18)', overflow: 'hidden', minHeight: '660px', display: 'flex', flexDirection: 'column' }}>

          {/* Header */}
          <div style={{ padding: '18px 20px 14px', background: '#20323E', color: '#F3E6C6' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Link href="/" style={{ color: '#F3E6C6', fontSize: '22px', textDecoration: 'none', lineHeight: 1 }}>‹</Link>
              <span style={{ fontFamily: "'Caveat', cursive", fontSize: '18px', color: '#9fc6d6', transform: 'rotate(-3deg)', display: 'inline-block' }}>unsolicited testimonial</span>
            </div>
            <div style={{ fontFamily: "'Alfa Slab One', serif", fontSize: '32px', lineHeight: 1, marginTop: '8px' }}>THE FLOCK<br />SPEAKS.</div>
          </div>

          {/* Seagull pitch */}
          <div style={{ flex: 1, padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Seagull avatar + intro */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: '#3E94BD', border: '2.5px solid #20323E', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="26" height="15" viewBox="0 0 24 14">
                  <path d="M1 11 Q6 1 11 9 Q17 1 23 11" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
              </div>
              <div style={{ fontFamily: "'Caveat', cursive", fontSize: '22px', color: '#C8472F', lineHeight: 1.2, paddingTop: '4px' }}>
                The Seagull · Official Endorser
              </div>
            </div>

            {/* Lines */}
            {lines.map((line, i) => (
              <div key={i} style={{ background: i % 2 === 0 ? '#FFFDF7' : '#eaf3f6', border: '2.5px solid #20323E', borderRadius: i === 0 ? '4px 16px 16px 16px' : '16px', padding: '13px 15px', fontSize: '15.5px', fontWeight: 600, lineHeight: 1.4, color: '#20323E', boxShadow: '2px 2px 0 rgba(32,50,62,.12)', animation: 'pop .25s ease' }}>
                {line}
              </div>
            ))}

            {/* CTA */}
            <div style={{ marginTop: '8px', textAlign: 'center' }}>
              <a
                href="https://pankstr.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-block', padding: '15px 32px', fontFamily: "'Anton', sans-serif", textTransform: 'uppercase', letterSpacing: '.06em', fontSize: '17px', background: charity.charityAccent, color: '#fff', border: '2.5px solid #20323E', borderRadius: '14px', boxShadow: '4px 4px 0 #20323E', textDecoration: 'none', cursor: 'pointer' }}
              >
                pankstr.com →
              </a>
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#9aa9b0', fontWeight: 600 }}>
                (the seagull gets nothing from this. he's just a fan.)
              </div>
            </div>

          </div>

          {/* Footer */}
          <div style={{ padding: '14px 20px 20px', borderTop: '2px solid #eee3cc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/" style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '13px', fontWeight: 700, color: '#3E94BD', textDecoration: 'underline' }}>← Back to the swoop</Link>
            <Link href="/board" style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '13px', fontWeight: 700, color: '#7c8a92', textDecoration: 'underline' }}>The board →</Link>
          </div>

        </div>
      </div>
    </div>
  );
}
