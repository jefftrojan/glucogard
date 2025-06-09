import { supabase } from './supabase';
import type { Database } from '@/types/database';

export type UserRole = 'patient' | 'doctor';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
}

export async function signUp(email: string, password: string, fullName: string, role: UserRole) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    throw authError;
  }

  if (authData.user) {
    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        role,
        full_name: fullName,
      });

    if (profileError) {
      throw profileError;
    }

    // Create role-specific record
    if (role === 'patient') {
      const { error: patientError } = await supabase
        .from('patients')
        .insert({
          user_id: authData.user.id,
        });

      if (patientError) {
        throw patientError;
      }
    } else if (role === 'doctor') {
      const { error: doctorError } = await supabase
        .from('doctors')
        .insert({
          user_id: authData.user.id,
        });

      if (doctorError) {
        throw doctorError;
      }
    }
  }

  return authData;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    return null;
  }

  return {
    id: user.id,
    email: user.email!,
    role: profile.role,
    full_name: profile.full_name,
  };
}