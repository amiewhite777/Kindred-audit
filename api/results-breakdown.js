import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { data, error } = await supabase
    .from('audit_results')
    .select('result_type');

  if (error) return res.status(500).json({ error: error.message });

  const counts = {};
  data.forEach(r => {
    counts[r.result_type] = (counts[r.result_type] || 0) + 1;
  });

  return res.status(200).json({ total: data.length, breakdown: counts });
}