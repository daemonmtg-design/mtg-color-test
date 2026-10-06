import { supabase } from './supabase';
import crypto from 'crypto';

export async function checkRateLimit(req: Request, action: string, limit: number = 10): Promise<boolean> {
  let ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || '127.0.0.1';
  if (ip.includes(',')) ip = ip.split(',')[0];
  ip = ip.trim();

  const salt = new Date().toISOString().split('T')[0];
  const secret = process.env.RATE_LIMIT_SECRET || 'default-secret';
  const hash = crypto.createHash('sha256').update(ip + salt + secret + action).digest('hex');

  if (Math.random() < 0.1) {
    // Fire and forget
    supabase.rpc('clear_old_rate_limits').then(() => {}).catch(() => {});
  }

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.rpc('increment_rate_limit', { p_hash: hash, p_expires_at: expiresAt });
  
  if (error || !data) {
    console.error('Rate limit error:', error);
    return true; // fail open if db error
  }

  return data <= limit;
}
