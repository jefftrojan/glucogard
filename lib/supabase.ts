import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Use Constants.expoConfig for Expo environment variables
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl!;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey!;

// Add validation to ensure environment variables are loaded
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your app.json extra configuration and restart the development server.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);