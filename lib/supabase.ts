import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Use Constants.expoConfig for Expo environment variables
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Add validation to ensure environment variables are loaded
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file and restart the development server.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);