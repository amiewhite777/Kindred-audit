import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Check for referral
    let referredBy = null;
    if (referralCode) {
      const { data: referrer } = await supabase
        .from('waitlist')
        .select('id')
        .ilike('referral_code', referralCode)
        .single();

      if (referrer) {
        referredBy = referrer.id;
        await supabase
          .from('waitlist')
          .update({ 
            referral_count: supabase.rpc('increment_referral_count', { user_id: referrer.id })
          });
      }
    }

    const newReferralCode = email.split('@')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');

    await supabase.from('waitlist').insert({
      email: email.toLowerCase(),
      referral_code: newReferralCode,
      referred_by: referredBy,
      created_at: new Date().toISOString(),
    });

    const { count } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

    // Send notification email to you
    await resend.emails.send({
      from: 'Kindred <onboarding@resend.dev>',
      to: 'amie.white777@gmail.com',
      subject: '🟢 New Node Joined Kindred',
      html: `
        <h2>New Waitlist Signup!</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Referral Code:</strong> ${newReferralCode}</p>
        <p><strong>Referred By:</strong> ${referralCode || 'Direct signup'}</p>
        <p><strong>Total Nodes:</strong> ${4102 + (count || 0)}</p>
      `,
    });

    return res.status(200).json({
      success: true,
      referralCode: newReferralCode,
      position: 4102 + (count || 0),
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to join' });
  }
}