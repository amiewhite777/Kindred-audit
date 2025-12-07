import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, referralCode } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  try {
    const { data: existing } = await supabase
      .from('waitlist')
      .select('email')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Already registered' });
    }

    const newReferralCode = email.split('@')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');

    await supabase.from('waitlist').insert({
      email: email.toLowerCase(),
      referral_code: newReferralCode,
      created_at: new Date().toISOString(),
    });

    const { count } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

    return res.status(200).json({
      success: true,
      referralCode: newReferralCode,
      position: 4102 + (count || 0),
    });

  } catch (error) {
    return res.status(500).json({ error: 'Failed to join' });
  }
}