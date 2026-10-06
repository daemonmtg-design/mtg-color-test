import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'MTG Color Quiz';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        background: 'white',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
        <div
          style={{
            fontSize: '64px',
            fontWeight: 800,
            color: '#111827',
            letterSpacing: '-0.025em',
          }}
        >
          MTG Color Quiz
        </div>
      </div>
      <div
        style={{
          fontSize: '32px',
          color: '#4B5563',
          textAlign: 'center',
          maxWidth: '800px',
        }}
      >
        Discover your true colors. Analyzes your values, personality traits, internal motivations, and how you resolve dilemmas.
      </div>
    </div>,
    { ...size }
  );
}
