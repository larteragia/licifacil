const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey?.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    const { data, error } = await supabase.from('bids').select('count');
    if (error) {
      console.error('❌ Erro ao conectar:', error.message);
      process.exit(1);
    }
    console.log('✅ Supabase conectado com sucesso!', data);
  } catch (e) {
    console.error('❌ Exceção:', e.message);
    process.exit(1);
  }
}

test();
