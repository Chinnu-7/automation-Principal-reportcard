
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

let supabase = null;

if (supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_URL_HERE') {
    supabase = createClient(supabaseUrl, supabaseKey);
} else {
    console.warn('Supabase URL is missing or invalid. Please check your .env file.');
}

export { supabase };
