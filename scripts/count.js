const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: d1 } = await s.from('responses').select('id');
  const { data: d2 } = await s.from('responses').select('id').eq('status', 'completed');
  const { data: d3 } = await s.from('feedback').select('id');
  const { data: d4 } = await s.from('friend_ratings').select('id');
  console.log(`Started: ${d1 ? d1.length : 0}`);
  console.log(`Completed: ${d2 ? d2.length : 0}`);
  console.log(`Feedback: ${d3 ? d3.length : 0}`);
  console.log(`Friend Ratings: ${d4 ? d4.length : 0}`);
}
run();
