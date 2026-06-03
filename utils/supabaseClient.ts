/**
 * VigilanteCiudadano - Supabase Safe Client Initializer
 * Location: utils/supabaseClient.ts
 * Role: Principal Software Architect & Full-Stack Frontend Developer
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xiflkokvukptzehkladn.supabase.co';

// Supports both anon key and publishable key variables to avoid project configuration limits
const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  'sb_publishable_NDW9J3eHhjwbbhqdjdsDsA__MgFopjC';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
