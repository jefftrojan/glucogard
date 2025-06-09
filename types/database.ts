export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          role: 'patient' | 'doctor'
          full_name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'patient' | 'doctor'
          full_name: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'patient' | 'doctor'
          full_name?: string
          created_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          user_id: string
          age: number | null
          gender: string | null
          weight: number | null
          height: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          age?: number | null
          gender?: string | null
          weight?: number | null
          height?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          age?: number | null
          gender?: string | null
          weight?: number | null
          height?: number | null
          created_at?: string
        }
      }
      doctors: {
        Row: {
          id: string
          user_id: string
          specialization: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          specialization?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          specialization?: string | null
          created_at?: string
        }
      }
      health_submissions: {
        Row: {
          id: string
          patient_id: string
          answers: Json
          status: 'pending' | 'reviewed'
          submitted_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          answers: Json
          status?: 'pending' | 'reviewed'
          submitted_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          answers?: Json
          status?: 'pending' | 'reviewed'
          submitted_at?: string
        }
      }
      risk_predictions: {
        Row: {
          id: string
          submission_id: string
          risk_score: number
          risk_category: 'low' | 'moderate' | 'critical'
          generated_at: string
        }
        Insert: {
          id?: string
          submission_id: string
          risk_score: number
          risk_category: 'low' | 'moderate' | 'critical'
          generated_at?: string
        }
        Update: {
          id?: string
          submission_id?: string
          risk_score?: number
          risk_category?: 'low' | 'moderate' | 'critical'
          generated_at?: string
        }
      }
      recommendations: {
        Row: {
          id: string
          submission_id: string
          doctor_id: string | null
          content: string
          type: 'lifestyle' | 'clinical'
          created_at: string
        }
        Insert: {
          id?: string
          submission_id: string
          doctor_id?: string | null
          content: string
          type: 'lifestyle' | 'clinical'
          created_at?: string
        }
        Update: {
          id?: string
          submission_id?: string
          doctor_id?: string | null
          content?: string
          type?: 'lifestyle' | 'clinical'
          created_at?: string
        }
      }
    }
  }
}