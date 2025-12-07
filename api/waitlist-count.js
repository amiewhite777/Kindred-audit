import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { count } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

    const baseCount = 4102;
    const totalCount = baseCount + (count || 0);

    return res.status(200).json({ count: totalCount });

  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch count' });
  }
}