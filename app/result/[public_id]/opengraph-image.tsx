import { ImageResponse } from 'next/og';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge';
export const alt = 'MTG Color Quiz Result';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { public_id: string } }) {
  const { data: response, error } = await supabase
    .from('responses')
    .select('result_name, percentages')
    .eq('public_id', params.public_id)
    .single();

  if (error || !response) {
    return new ImageResponse(
      <div style={{ fontSize: 64, background: 'white', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Result not found
      </div>,
      { ...size }
    );
  }

  const { result_name, percentages } = response;

  const colorMap: Record<string, string> = { 
    'White': '#F8F6D8', 
    'Blue': '#C1D8E9', 
    'Black': '#BAB1AB', 
    'Red': '#E49977', 
    'Green': '#A3C095' 
  };

  const order = ['White', 'Blue', 'Black', 'Red', 'Green'];
  
  const sortedColors = order.map(c => ({
    name: c,
    value: percentages[c] || 0
  }));

  return new ImageResponse(
    <div style={{
      background: '#1a202c',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px',
      fontFamily: 'sans-serif',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '80px', color: 'white', margin: 0, textAlign: 'center' }}>
          {result_name}
        </h1>
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'center', alignItems: 'flex-end', height: '300px' }}>
        {sortedColors.map((color) => (
          <div key={color.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '40px' }}>
            <div style={{
              background: colorMap[color.name] || '#ccc',
              width: '100px',
              height: `${Math.max(10, color.value * 250)}px`,
              borderRadius: '8px 8px 0 0',
            }} />
            <div style={{ color: 'white', fontSize: '32px', marginTop: '10px' }}>{color.name}</div>
            <div style={{ color: '#cbd5e1', fontSize: '24px', marginTop: '10px' }}>{Math.round(color.value * 100)}%</div>
          </div>
        ))}
      </div>
    </div>,
    { ...size }
  );
}
