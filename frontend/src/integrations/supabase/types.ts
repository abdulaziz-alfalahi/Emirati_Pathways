export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ab_testing_assignments: {
        Row: {
          assigned_at: string
          experiment_id: string
          id: string
          user_id: string
          variant: string
        }
        Insert: {
          assigned_at?: string
          experiment_id: string
          id?: string
          user_id: string
          variant: string
        }
        Update: {
          assigned_at?: string
          experiment_id?: string
          id?: string
          user_id?: string
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "ab_testing_assignments_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "ab_testing_experiments"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_testing_experiments: {
        Row: {
          created_at: string
          created_by: string
          end_date: string | null
          experiment_name: string
          feature_name: string
          hypothesis: string | null
          id: string
          start_date: string
          status: string
          success_metric: string
          variant_a_config: Json
          variant_b_config: Json
        }
        Insert: {
          created_at?: string
          created_by: string
          end_date?: string | null
          experiment_name: string
          feature_name: string
          hypothesis?: string | null
          id?: string
          start_date: string
          status?: string
          success_metric: string
          variant_a_config: Json
          variant_b_config: Json
        }
        Update: {
          created_at?: string
          created_by?: string
          end_date?: string | null
          experiment_name?: string
          feature_name?: string
          hypothesis?: string | null
          id?: string
          start_date?: string
          status?: string
          success_metric?: string
          variant_a_config?: Json
          variant_b_config?: Json
        }
        Relationships: []
      }
      advisory_applications: {
        Row: {
          additional_documents: string[] | null
          cover_letter: string | null
          id: string
          notes: string | null
          position_id: string
          resume_url: string | null
          status: string | null
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_documents?: string[] | null
          cover_letter?: string | null
          id?: string
          notes?: string | null
          position_id: string
          resume_url?: string | null
          status?: string | null
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_documents?: string[] | null
          cover_letter?: string | null
          id?: string
          notes?: string | null
          position_id?: string
          resume_url?: string | null
          status?: string | null
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advisory_applications_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "advisory_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      advisory_positions: {
        Row: {
          application_deadline: string | null
          commitment_hours_per_month: number | null
          compensation_type: string | null
          contact_email: string | null
          created_at: string
          created_by: string | null
          description: string | null
          experience_level: string | null
          id: string
          location: string | null
          organization: string
          remote_allowed: boolean | null
          requirements: string | null
          skills_required: string[] | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          application_deadline?: string | null
          commitment_hours_per_month?: number | null
          compensation_type?: string | null
          contact_email?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          experience_level?: string | null
          id?: string
          location?: string | null
          organization: string
          remote_allowed?: boolean | null
          requirements?: string | null
          skills_required?: string[] | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          application_deadline?: string | null
          commitment_hours_per_month?: number | null
          compensation_type?: string | null
          contact_email?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          experience_level?: string | null
          id?: string
          location?: string | null
          organization?: string
          remote_allowed?: boolean | null
          requirements?: string | null
          skills_required?: string[] | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      advisory_sessions: {
        Row: {
          advisor_id: string
          completed_date: string | null
          created_at: string | null
          details: string | null
          feedback: string | null
          id: string
          notes: string | null
          rating: number | null
          scheduled_date: string
          status: string
          topic: string
          updated_at: string | null
          user_id: string
          video_call_url: string | null
        }
        Insert: {
          advisor_id: string
          completed_date?: string | null
          created_at?: string | null
          details?: string | null
          feedback?: string | null
          id?: string
          notes?: string | null
          rating?: number | null
          scheduled_date: string
          status?: string
          topic: string
          updated_at?: string | null
          user_id: string
          video_call_url?: string | null
        }
        Update: {
          advisor_id?: string
          completed_date?: string | null
          created_at?: string | null
          details?: string | null
          feedback?: string | null
          id?: string
          notes?: string | null
          rating?: number | null
          scheduled_date?: string
          status?: string
          topic?: string
          updated_at?: string | null
          user_id?: string
          video_call_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advisory_sessions_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "career_advisors"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_consent: {
        Row: {
          consent_given_at: string
          consent_updated_at: string
          essential_analytics: boolean
          id: string
          ip_address: unknown | null
          marketing_analytics: boolean
          performance_analytics: boolean
          personalization_analytics: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consent_given_at?: string
          consent_updated_at?: string
          essential_analytics?: boolean
          id?: string
          ip_address?: unknown | null
          marketing_analytics?: boolean
          performance_analytics?: boolean
          personalization_analytics?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consent_given_at?: string
          consent_updated_at?: string
          essential_analytics?: boolean
          id?: string
          ip_address?: unknown | null
          marketing_analytics?: boolean
          performance_analytics?: boolean
          personalization_analytics?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string | null
          hirevue_api_key: string | null
          id: string
          linkedin_client_id: string | null
          linkedin_client_secret: string | null
          mapbox_access_token: string | null
          uaepass_client_id: string | null
          uaepass_client_secret: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          hirevue_api_key?: string | null
          id?: string
          linkedin_client_id?: string | null
          linkedin_client_secret?: string | null
          mapbox_access_token?: string | null
          uaepass_client_id?: string | null
          uaepass_client_secret?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          hirevue_api_key?: string | null
          id?: string
          linkedin_client_id?: string | null
          linkedin_client_secret?: string | null
          mapbox_access_token?: string | null
          uaepass_client_id?: string | null
          uaepass_client_secret?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      assessment_activity_feed: {
        Row: {
          activity_data: Json | null
          activity_type: string
          assessment_id: string
          created_at: string
          criterion_id: string | null
          id: string
          section_id: string | null
          user_id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          assessment_id: string
          created_at?: string
          criterion_id?: string | null
          id?: string
          section_id?: string | null
          user_id: string
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          assessment_id?: string
          created_at?: string
          criterion_id?: string | null
          id?: string
          section_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_activity_feed_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "collaborative_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_activity_feed_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_collaboration_sessions: {
        Row: {
          assessment_id: string
          created_at: string
          current_section_id: string | null
          id: string
          last_activity: string
          session_end: string | null
          session_start: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          current_section_id?: string | null
          id?: string
          last_activity?: string
          session_end?: string | null
          session_start?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          current_section_id?: string | null
          id?: string
          last_activity?: string
          session_end?: string | null
          session_start?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_collaboration_sessions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "collaborative_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_collaboration_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_collaborators: {
        Row: {
          assessment_id: string
          id: string
          invited_at: string
          invited_by: string
          joined_at: string | null
          permissions: Json
          role: string
          status: string
          user_id: string
        }
        Insert: {
          assessment_id: string
          id?: string
          invited_at?: string
          invited_by: string
          joined_at?: string | null
          permissions?: Json
          role: string
          status?: string
          user_id: string
        }
        Update: {
          assessment_id?: string
          id?: string
          invited_at?: string
          invited_by?: string
          joined_at?: string | null
          permissions?: Json
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_collaborators_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "collaborative_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_comments: {
        Row: {
          assessment_id: string
          content: string
          created_at: string
          criterion_id: string | null
          id: string
          parent_comment_id: string | null
          section_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_id: string
          content: string
          created_at?: string
          criterion_id?: string | null
          id?: string
          parent_comment_id?: string | null
          section_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_id?: string
          content?: string
          created_at?: string
          criterion_id?: string | null
          id?: string
          parent_comment_id?: string | null
          section_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_comments_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "collaborative_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "assessment_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_evaluations: {
        Row: {
          assessment_id: string
          comments: string | null
          created_at: string
          criterion_id: string
          evaluator_id: string
          evidence_urls: string[] | null
          id: string
          score: number | null
          section_id: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          assessment_id: string
          comments?: string | null
          created_at?: string
          criterion_id: string
          evaluator_id: string
          evidence_urls?: string[] | null
          id?: string
          score?: number | null
          section_id: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          comments?: string | null
          created_at?: string
          criterion_id?: string
          evaluator_id?: string
          evidence_urls?: string[] | null
          id?: string
          score?: number | null
          section_id?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_evaluations_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "collaborative_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_sessions: {
        Row: {
          assessment_id: string
          coaching_notes: string | null
          coaching_recommended: boolean | null
          completed_date: string | null
          created_at: string | null
          feedback: string | null
          id: string
          results: Json | null
          scheduled_date: string | null
          score: number | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assessment_id: string
          coaching_notes?: string | null
          coaching_recommended?: boolean | null
          completed_date?: string | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          results?: Json | null
          scheduled_date?: string | null
          score?: number | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assessment_id?: string
          coaching_notes?: string | null
          coaching_recommended?: boolean | null
          completed_date?: string | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          results?: Json | null
          scheduled_date?: string | null
          score?: number | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_sessions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_templates: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string | null
          estimated_duration_minutes: number | null
          id: string
          is_public: boolean
          scoring_criteria: Json
          sections: Json
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by: string
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_public?: boolean
          scoring_criteria?: Json
          sections?: Json
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_public?: boolean
          scoring_criteria?: Json
          sections?: Json
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      assessments: {
        Row: {
          assessment_type: Database["public"]["Enums"]["assessment_type"]
          center_id: string
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          eligibility_criteria: Json | null
          id: string
          is_active: boolean | null
          price_amount: number | null
          price_currency: string | null
          requirements: string | null
          skills_tested: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assessment_type: Database["public"]["Enums"]["assessment_type"]
          center_id: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          eligibility_criteria?: Json | null
          id?: string
          is_active?: boolean | null
          price_amount?: number | null
          price_currency?: string | null
          requirements?: string | null
          skills_tested?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assessment_type?: Database["public"]["Enums"]["assessment_type"]
          center_id?: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          eligibility_criteria?: Json | null
          id?: string
          is_active?: boolean | null
          price_amount?: number | null
          price_currency?: string | null
          requirements?: string | null
          skills_tested?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      attendance_certificates: {
        Row: {
          certificate_number: string
          certificate_url: string | null
          completion_percentage: number
          created_at: string
          event_id: string
          id: string
          is_valid: boolean
          issued_date: string
          user_id: string
        }
        Insert: {
          certificate_number: string
          certificate_url?: string | null
          completion_percentage: number
          created_at?: string
          event_id: string
          id?: string
          is_valid?: boolean
          issued_date?: string
          user_id: string
        }
        Update: {
          certificate_number?: string
          certificate_url?: string | null
          completion_percentage?: number
          created_at?: string
          event_id?: string
          id?: string
          is_valid?: boolean
          issued_date?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          category: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          resource: string
          resource_id: string | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          category?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource: string
          resource_id?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          category?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource?: string
          resource_id?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bizdev_resources: {
        Row: {
          created_at: string
          description: string | null
          difficulty_level: string | null
          downloadable_file_url: string | null
          focus_area: string
          id: string
          image_url: string | null
          link_url: string | null
          provider_or_author: string | null
          status: string
          tags: string[] | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          downloadable_file_url?: string | null
          focus_area: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          provider_or_author?: string | null
          status?: string
          tags?: string[] | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          downloadable_file_url?: string | null
          focus_area?: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          provider_or_author?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      blockchain_credentials: {
        Row: {
          block_number: number
          created_at: string
          credential_hash: string
          credential_type: Database["public"]["Enums"]["credential_type"]
          description: string | null
          expiry_date: string | null
          id: string
          issued_date: string
          issuer_id: string
          merkle_proof: string[]
          metadata: Json | null
          recipient_id: string
          revocation_reason: string | null
          revoked_at: string | null
          skills: string[] | null
          title: string
          transaction_hash: string
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          block_number: number
          created_at?: string
          credential_hash: string
          credential_type: Database["public"]["Enums"]["credential_type"]
          description?: string | null
          expiry_date?: string | null
          id?: string
          issued_date?: string
          issuer_id: string
          merkle_proof?: string[]
          metadata?: Json | null
          recipient_id: string
          revocation_reason?: string | null
          revoked_at?: string | null
          skills?: string[] | null
          title: string
          transaction_hash: string
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          block_number?: number
          created_at?: string
          credential_hash?: string
          credential_type?: Database["public"]["Enums"]["credential_type"]
          description?: string | null
          expiry_date?: string | null
          id?: string
          issued_date?: string
          issuer_id?: string
          merkle_proof?: string[]
          metadata?: Json | null
          recipient_id?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          skills?: string[] | null
          title?: string
          transaction_hash?: string
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: []
      }
      booth_interaction_tracking: {
        Row: {
          booth_id: string
          created_at: string
          duration_seconds: number | null
          event_id: string
          id: string
          interaction_data: Json | null
          interaction_type: string
          user_id: string
        }
        Insert: {
          booth_id: string
          created_at?: string
          duration_seconds?: number | null
          event_id: string
          id?: string
          interaction_data?: Json | null
          interaction_type: string
          user_id: string
        }
        Update: {
          booth_id?: string
          created_at?: string
          duration_seconds?: number | null
          event_id?: string
          id?: string
          interaction_data?: Json | null
          interaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      booth_visits: {
        Row: {
          booth_id: string
          created_at: string | null
          duration_minutes: number | null
          event_registration_id: string
          follow_up_requested: boolean | null
          id: string
          interactions: Json | null
          is_lead: boolean | null
          lead_notes: string | null
          visit_end: string | null
          visit_start: string | null
          visitor_id: string
        }
        Insert: {
          booth_id: string
          created_at?: string | null
          duration_minutes?: number | null
          event_registration_id: string
          follow_up_requested?: boolean | null
          id?: string
          interactions?: Json | null
          is_lead?: boolean | null
          lead_notes?: string | null
          visit_end?: string | null
          visit_start?: string | null
          visitor_id: string
        }
        Update: {
          booth_id?: string
          created_at?: string | null
          duration_minutes?: number | null
          event_registration_id?: string
          follow_up_requested?: boolean | null
          id?: string
          interactions?: Json | null
          is_lead?: boolean | null
          lead_notes?: string | null
          visit_end?: string | null
          visit_start?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booth_visits_booth_id_fkey"
            columns: ["booth_id"]
            isOneToOne: false
            referencedRelation: "virtual_booths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booth_visits_event_registration_id_fkey"
            columns: ["event_registration_id"]
            isOneToOne: false
            referencedRelation: "virtual_event_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_templates: {
        Row: {
          career_stage: string
          created_at: string
          created_by: string | null
          description: string | null
          expense_categories: Json
          id: string
          income_categories: Json
          is_system_template: boolean
          title: string
          updated_at: string
        }
        Insert: {
          career_stage: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_categories: Json
          id?: string
          income_categories: Json
          is_system_template?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          career_stage?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_categories?: Json
          id?: string
          income_categories?: Json
          is_system_template?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      camp_enrollments: {
        Row: {
          camp_id: string
          enrolled_at: string
          id: string
          payment_status: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          camp_id: string
          enrolled_at?: string
          id?: string
          payment_status?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          camp_id?: string
          enrolled_at?: string
          id?: string
          payment_status?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "camp_enrollments_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "summer_camps"
            referencedColumns: ["id"]
          },
        ]
      }
      career_advisors: {
        Row: {
          availability: Json | null
          bio: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          specialization: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          availability?: Json | null
          bio?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          specialization: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          availability?: Json | null
          bio?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          specialization?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      career_path_stages: {
        Row: {
          career_path_id: string
          created_at: string
          description: string | null
          duration: string | null
          icon: string | null
          id: string
          order_index: number
          requirements: string[] | null
          skills: string[] | null
          stage_type: string
          title: string
          updated_at: string | null
        }
        Insert: {
          career_path_id: string
          created_at?: string
          description?: string | null
          duration?: string | null
          icon?: string | null
          id?: string
          order_index: number
          requirements?: string[] | null
          skills?: string[] | null
          stage_type: string
          title: string
          updated_at?: string | null
        }
        Update: {
          career_path_id?: string
          created_at?: string
          description?: string | null
          duration?: string | null
          icon?: string | null
          id?: string
          order_index?: number
          requirements?: string[] | null
          skills?: string[] | null
          stage_type?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "career_path_stages_career_path_id_fkey"
            columns: ["career_path_id"]
            isOneToOne: false
            referencedRelation: "career_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      career_paths: {
        Row: {
          created_at: string
          description: string | null
          id: string
          industry: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          industry: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          industry?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      career_transition_resources: {
        Row: {
          content_markdown: string | null
          content_url: string | null
          created_at: string
          description: string | null
          estimated_transition_time: string | null
          id: string
          image_url: string | null
          required_skills_summary: string | null
          source_from_industry: string | null
          status: string
          tags: string[] | null
          target_to_industry: string | null
          title: string
          type: string
        }
        Insert: {
          content_markdown?: string | null
          content_url?: string | null
          created_at?: string
          description?: string | null
          estimated_transition_time?: string | null
          id?: string
          image_url?: string | null
          required_skills_summary?: string | null
          source_from_industry?: string | null
          status?: string
          tags?: string[] | null
          target_to_industry?: string | null
          title: string
          type: string
        }
        Update: {
          content_markdown?: string | null
          content_url?: string | null
          created_at?: string
          description?: string | null
          estimated_transition_time?: string | null
          id?: string
          image_url?: string | null
          required_skills_summary?: string | null
          source_from_industry?: string | null
          status?: string
          tags?: string[] | null
          target_to_industry?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_number: string
          course_id: string
          created_at: string
          enrollment_id: string
          id: string
          issued_at: string
          pdf_url: string | null
          status: Database["public"]["Enums"]["certificate_status"]
          template_data: Json | null
          user_id: string
        }
        Insert: {
          certificate_number: string
          course_id: string
          created_at?: string
          enrollment_id: string
          id?: string
          issued_at?: string
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["certificate_status"]
          template_data?: Json | null
          user_id: string
        }
        Update: {
          certificate_number?: string
          course_id?: string
          created_at?: string
          enrollment_id?: string
          id?: string
          issued_at?: string
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["certificate_status"]
          template_data?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      citizen_journey_profiles: {
        Row: {
          achievements: Json
          created_at: string
          current_phase: string
          id: string
          interests_and_goals: Json
          profile_data: Json
          progress_metrics: Json
          skills_portfolio: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          achievements?: Json
          created_at?: string
          current_phase?: string
          id?: string
          interests_and_goals?: Json
          profile_data?: Json
          progress_metrics?: Json
          skills_portfolio?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          achievements?: Json
          created_at?: string
          current_phase?: string
          id?: string
          interests_and_goals?: Json
          profile_data?: Json
          progress_metrics?: Json
          skills_portfolio?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coaching_recommendations: {
        Row: {
          coach_id: string | null
          created_at: string
          id: string
          reason: string
          scheduled_date: string | null
          session_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          coach_id?: string | null
          created_at?: string
          id?: string
          reason: string
          scheduled_date?: string | null
          session_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          coach_id?: string | null
          created_at?: string
          id?: string
          reason?: string
          scheduled_date?: string | null
          session_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_recommendations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "assessment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborative_assessments: {
        Row: {
          candidate_id: string
          created_at: string
          created_by: string
          due_date: string | null
          id: string
          instructions: string | null
          metadata: Json | null
          status: string
          template_id: string
          title: string
          updated_at: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          created_by: string
          due_date?: string | null
          id?: string
          instructions?: string | null
          metadata?: Json | null
          status?: string
          template_id: string
          title: string
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          created_by?: string
          due_date?: string | null
          id?: string
          instructions?: string | null
          metadata?: Json | null
          status?: string
          template_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborative_assessments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "assessment_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          community_type: string | null
          contact_email: string | null
          created_at: string | null
          description: string | null
          focus_area: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          member_count: number | null
          name: string
          website_url: string | null
        }
        Insert: {
          community_type?: string | null
          contact_email?: string | null
          created_at?: string | null
          description?: string | null
          focus_area?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          member_count?: number | null
          name: string
          website_url?: string | null
        }
        Update: {
          community_type?: string | null
          contact_email?: string | null
          created_at?: string | null
          description?: string | null
          focus_area?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          member_count?: number | null
          name?: string
          website_url?: string | null
        }
        Relationships: []
      }
      community_events: {
        Row: {
          community_id: string
          created_at: string
          description: string | null
          end_date: string | null
          event_type: string
          id: string
          image_url: string | null
          location: string | null
          registration_url: string | null
          start_date: string
          status: string
          title: string
        }
        Insert: {
          community_id: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_type: string
          id?: string
          image_url?: string | null
          location?: string | null
          registration_url?: string | null
          start_date: string
          status?: string
          title: string
        }
        Update: {
          community_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_type?: string
          id?: string
          image_url?: string | null
          location?: string | null
          registration_url?: string | null
          start_date?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "professional_communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_leadership_resources: {
        Row: {
          application_deadline: string | null
          created_at: string
          description: string | null
          difficulty_level: string | null
          duration_hours: number | null
          end_date: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_virtual: boolean | null
          location: string | null
          provider: string | null
          requirements: string | null
          start_date: string | null
          status: string | null
          tags: string[] | null
          title: string
          type: string
          updated_at: string
          url: string | null
        }
        Insert: {
          application_deadline?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          duration_hours?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_virtual?: boolean | null
          location?: string | null
          provider?: string | null
          requirements?: string | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          type: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          application_deadline?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          duration_hours?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_virtual?: boolean | null
          location?: string | null
          provider?: string | null
          requirements?: string | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      course_enrollments: {
        Row: {
          certificate_issued_at: string | null
          completed_at: string | null
          course_id: string
          enrolled_at: string
          id: string
          progress_percentage: number
          status: Database["public"]["Enums"]["enrollment_status"]
          user_id: string
        }
        Insert: {
          certificate_issued_at?: string | null
          completed_at?: string | null
          course_id: string
          enrolled_at?: string
          id?: string
          progress_percentage?: number
          status?: Database["public"]["Enums"]["enrollment_status"]
          user_id: string
        }
        Update: {
          certificate_issued_at?: string | null
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string
          id?: string
          progress_percentage?: number
          status?: Database["public"]["Enums"]["enrollment_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          order_index: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string
          created_at: string
          currency: string | null
          description: string | null
          difficulty_level: string
          duration_hours: number | null
          id: string
          instructor_id: string
          is_featured: boolean
          learning_objectives: string[] | null
          prerequisites: string[] | null
          price: number | null
          status: Database["public"]["Enums"]["course_status"]
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          currency?: string | null
          description?: string | null
          difficulty_level?: string
          duration_hours?: number | null
          id?: string
          instructor_id: string
          is_featured?: boolean
          learning_objectives?: string[] | null
          prerequisites?: string[] | null
          price?: number | null
          status?: Database["public"]["Enums"]["course_status"]
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          difficulty_level?: string
          duration_hours?: number | null
          id?: string
          instructor_id?: string
          is_featured?: boolean
          learning_objectives?: string[] | null
          prerequisites?: string[] | null
          price?: number | null
          status?: Database["public"]["Enums"]["course_status"]
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      credential_disputes: {
        Row: {
          assigned_to: string | null
          created_at: string
          credential_id: string
          dispute_reason: string
          dispute_type: string
          disputed_by: string
          evidence: Json | null
          id: string
          resolution_notes: string | null
          resolved_at: string | null
          smart_contract_dispute_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          credential_id: string
          dispute_reason: string
          dispute_type: string
          disputed_by: string
          evidence?: Json | null
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          smart_contract_dispute_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          credential_id?: string
          dispute_reason?: string
          dispute_type?: string
          disputed_by?: string
          evidence?: Json | null
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          smart_contract_dispute_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credential_disputes_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: false
            referencedRelation: "blockchain_credentials"
            referencedColumns: ["id"]
          },
        ]
      }
      credential_export_formats: {
        Row: {
          created_at: string
          file_extension: string
          format_name: string
          format_version: string
          id: string
          is_active: boolean
          mime_type: string
          schema_definition: Json
        }
        Insert: {
          created_at?: string
          file_extension: string
          format_name: string
          format_version: string
          id?: string
          is_active?: boolean
          mime_type: string
          schema_definition: Json
        }
        Update: {
          created_at?: string
          file_extension?: string
          format_name?: string
          format_version?: string
          id?: string
          is_active?: boolean
          mime_type?: string
          schema_definition?: Json
        }
        Relationships: []
      }
      credential_exports: {
        Row: {
          access_token: string | null
          created_at: string
          credential_id: string
          downloaded_count: number
          expires_at: string | null
          export_format_id: string
          exported_data: Json
          file_url: string | null
          id: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          credential_id: string
          downloaded_count?: number
          expires_at?: string | null
          export_format_id: string
          exported_data: Json
          file_url?: string | null
          id?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          credential_id?: string
          downloaded_count?: number
          expires_at?: string | null
          export_format_id?: string
          exported_data?: Json
          file_url?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credential_exports_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: false
            referencedRelation: "blockchain_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credential_exports_export_format_id_fkey"
            columns: ["export_format_id"]
            isOneToOne: false
            referencedRelation: "credential_export_formats"
            referencedColumns: ["id"]
          },
        ]
      }
      credential_sharing_permissions: {
        Row: {
          access_count: number
          created_at: string
          credential_id: string
          expires_at: string | null
          fields_accessible: string[]
          id: string
          is_active: boolean
          max_access_count: number | null
          owner_id: string
          permission_level: string
          shared_with_id: string | null
          shared_with_type: string
          sharing_token: string | null
          updated_at: string
        }
        Insert: {
          access_count?: number
          created_at?: string
          credential_id: string
          expires_at?: string | null
          fields_accessible?: string[]
          id?: string
          is_active?: boolean
          max_access_count?: number | null
          owner_id: string
          permission_level?: string
          shared_with_id?: string | null
          shared_with_type: string
          sharing_token?: string | null
          updated_at?: string
        }
        Update: {
          access_count?: number
          created_at?: string
          credential_id?: string
          expires_at?: string | null
          fields_accessible?: string[]
          id?: string
          is_active?: boolean
          max_access_count?: number | null
          owner_id?: string
          permission_level?: string
          shared_with_id?: string | null
          shared_with_type?: string
          sharing_token?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credential_sharing_permissions_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: false
            referencedRelation: "blockchain_credentials"
            referencedColumns: ["id"]
          },
        ]
      }
      credential_verification_logs: {
        Row: {
          created_at: string
          credential_id: string
          id: string
          ip_address: unknown | null
          location_data: Json | null
          user_agent: string | null
          verification_details: Json | null
          verification_method: string
          verification_result: boolean
          verification_token: string | null
          verifier_id: string | null
        }
        Insert: {
          created_at?: string
          credential_id: string
          id?: string
          ip_address?: unknown | null
          location_data?: Json | null
          user_agent?: string | null
          verification_details?: Json | null
          verification_method: string
          verification_result: boolean
          verification_token?: string | null
          verifier_id?: string | null
        }
        Update: {
          created_at?: string
          credential_id?: string
          id?: string
          ip_address?: unknown | null
          location_data?: Json | null
          user_agent?: string | null
          verification_details?: Json | null
          verification_method?: string
          verification_result?: boolean
          verification_token?: string | null
          verifier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credential_verification_logs_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: false
            referencedRelation: "blockchain_credentials"
            referencedColumns: ["id"]
          },
        ]
      }
      credential_verification_requests: {
        Row: {
          created_at: string
          database_source: string
          expires_at: string | null
          id: string
          request_data: Json
          response_data: Json | null
          status: string
          updated_at: string
          user_id: string
          verification_type: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          database_source: string
          expires_at?: string | null
          id?: string
          request_data: Json
          response_data?: Json | null
          status?: string
          updated_at?: string
          user_id: string
          verification_type: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          database_source?: string
          expires_at?: string | null
          id?: string
          request_data?: Json
          response_data?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
          verification_type?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      cross_phase_recommendations: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          priority_score: number
          recommendation_data: Json
          recommendation_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          priority_score?: number
          recommendation_data?: Json
          recommendation_type: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          priority_score?: number
          recommendation_data?: Json
          recommendation_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      data_integration_requests: {
        Row: {
          created_at: string
          data_type: string
          id: string
          processed_at: string | null
          request_data: Json
          source_phase: string
          status: string
          target_phase: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_type: string
          id?: string
          processed_at?: string | null
          request_data?: Json
          source_phase: string
          status?: string
          target_phase: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_type?: string
          id?: string
          processed_at?: string | null
          request_data?: Json
          source_phase?: string
          status?: string
          target_phase?: string
          user_id?: string
        }
        Relationships: []
      }
      digital_skills_resources: {
        Row: {
          cost: number | null
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          duration_hours: number | null
          id: string
          is_active: boolean | null
          provider: string
          resource_url: string | null
          skill_category: string
          title: string
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_hours?: number | null
          id?: string
          is_active?: boolean | null
          provider: string
          resource_url?: string | null
          skill_category: string
          title: string
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_hours?: number | null
          id?: string
          is_active?: boolean | null
          provider?: string
          resource_url?: string | null
          skill_category?: string
          title?: string
        }
        Relationships: []
      }
      engagement_analytics: {
        Row: {
          booths_visited: number | null
          created_at: string
          event_id: string
          id: string
          last_activity: string | null
          networking_connections: number | null
          overall_engagement_score: number | null
          polls_participated: number | null
          questions_asked: number | null
          sessions_attended: number | null
          total_session_time: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          booths_visited?: number | null
          created_at?: string
          event_id: string
          id?: string
          last_activity?: string | null
          networking_connections?: number | null
          overall_engagement_score?: number | null
          polls_participated?: number | null
          questions_asked?: number | null
          sessions_attended?: number | null
          total_session_time?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          booths_visited?: number | null
          created_at?: string
          event_id?: string
          id?: string
          last_activity?: string | null
          networking_connections?: number | null
          overall_engagement_score?: number | null
          polls_participated?: number | null
          questions_asked?: number | null
          sessions_attended?: number | null
          total_session_time?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      event_analytics: {
        Row: {
          dimensions: Json | null
          event_id: string
          id: string
          metric_name: string
          metric_type: string
          metric_value: number
          recorded_at: string
        }
        Insert: {
          dimensions?: Json | null
          event_id: string
          id?: string
          metric_name: string
          metric_type: string
          metric_value: number
          recorded_at?: string
        }
        Update: {
          dimensions?: Json | null
          event_id?: string
          id?: string
          metric_name?: string
          metric_type?: string
          metric_value?: number
          recorded_at?: string
        }
        Relationships: []
      }
      event_feedback: {
        Row: {
          content_rating: number
          created_at: string
          event_id: string
          future_interests: string[] | null
          id: string
          improvements: string | null
          networking_rating: number
          overall_rating: number
          platform_rating: number
          recommendations: string | null
          speakers_rating: number
          user_id: string
          would_recommend: boolean
        }
        Insert: {
          content_rating: number
          created_at?: string
          event_id: string
          future_interests?: string[] | null
          id?: string
          improvements?: string | null
          networking_rating: number
          overall_rating: number
          platform_rating: number
          recommendations?: string | null
          speakers_rating: number
          user_id: string
          would_recommend?: boolean
        }
        Update: {
          content_rating?: number
          created_at?: string
          event_id?: string
          future_interests?: string[] | null
          id?: string
          improvements?: string | null
          networking_rating?: number
          overall_rating?: number
          platform_rating?: number
          recommendations?: string | null
          speakers_rating?: number
          user_id?: string
          would_recommend?: boolean
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          event_id: string
          feedback: string | null
          id: string
          rating: number | null
          registration_date: string
          status: string
          user_id: string
        }
        Insert: {
          event_id: string
          feedback?: string | null
          id?: string
          rating?: number | null
          registration_date?: string
          status?: string
          user_id: string
        }
        Update: {
          event_id?: string
          feedback?: string | null
          id?: string
          rating?: number | null
          registration_date?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "networking_events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "group_events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_sessions: {
        Row: {
          created_at: string | null
          current_attendees: number | null
          description: string | null
          end_time: string
          event_id: string
          id: string
          is_recording_enabled: boolean | null
          materials: Json | null
          max_attendees: number | null
          meeting_url: string | null
          recording_url: string | null
          room_name: string | null
          session_type: string | null
          speaker_id: string | null
          speakers: Json | null
          start_time: string
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_attendees?: number | null
          description?: string | null
          end_time: string
          event_id: string
          id?: string
          is_recording_enabled?: boolean | null
          materials?: Json | null
          max_attendees?: number | null
          meeting_url?: string | null
          recording_url?: string | null
          room_name?: string | null
          session_type?: string | null
          speaker_id?: string | null
          speakers?: Json | null
          start_time: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_attendees?: number | null
          description?: string | null
          end_time?: string
          event_id?: string
          id?: string
          is_recording_enabled?: boolean | null
          materials?: Json | null
          max_attendees?: number | null
          meeting_url?: string | null
          recording_url?: string | null
          room_name?: string | null
          session_type?: string | null
          speaker_id?: string | null
          speakers?: Json | null
          start_time?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "virtual_events"
            referencedColumns: ["id"]
          },
        ]
      }
      external_database_configs: {
        Row: {
          api_endpoint: string
          authentication_type: string
          created_at: string
          database_name: string
          id: string
          is_active: boolean
          rate_limit_per_minute: number | null
          timeout_seconds: number | null
          updated_at: string
        }
        Insert: {
          api_endpoint: string
          authentication_type: string
          created_at?: string
          database_name: string
          id?: string
          is_active?: boolean
          rate_limit_per_minute?: number | null
          timeout_seconds?: number | null
          updated_at?: string
        }
        Update: {
          api_endpoint?: string
          authentication_type?: string
          created_at?: string
          database_name?: string
          id?: string
          is_active?: boolean
          rate_limit_per_minute?: number | null
          timeout_seconds?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      feature_usage_analytics: {
        Row: {
          action_type: string
          created_at: string
          duration_seconds: number | null
          error_data: Json | null
          feature_name: string
          id: string
          phase: string
          success_rate: number | null
          usage_context: Json | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          duration_seconds?: number | null
          error_data?: Json | null
          feature_name: string
          id?: string
          phase: string
          success_rate?: number | null
          usage_context?: Json | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          duration_seconds?: number | null
          error_data?: Json | null
          feature_name?: string
          id?: string
          phase?: string
          success_rate?: number | null
          usage_context?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      financial_goals: {
        Row: {
          created_at: string
          current_amount: number | null
          deadline: string | null
          description: string | null
          goal_type: string
          id: string
          priority: string
          status: string
          target_amount: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_amount?: number | null
          deadline?: string | null
          description?: string | null
          goal_type: string
          id?: string
          priority?: string
          status?: string
          target_amount: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_amount?: number | null
          deadline?: string | null
          description?: string | null
          goal_type?: string
          id?: string
          priority?: string
          status?: string
          target_amount?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_projections: {
        Row: {
          created_at: string
          description: string | null
          expense_data: Json | null
          id: string
          income_data: Json | null
          investment_data: Json | null
          savings_data: Json | null
          scenario_type: string
          time_period: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          expense_data?: Json | null
          id?: string
          income_data?: Json | null
          investment_data?: Json | null
          savings_data?: Json | null
          scenario_type: string
          time_period: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          expense_data?: Json | null
          id?: string
          income_data?: Json | null
          investment_data?: Json | null
          savings_data?: Json | null
          scenario_type?: string
          time_period?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_recommendations: {
        Row: {
          career_stage: string | null
          category: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          income_level: string | null
          is_system_recommendation: boolean
          priority: string
          title: string
          updated_at: string
        }
        Insert: {
          career_stage?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          income_level?: string | null
          is_system_recommendation?: boolean
          priority?: string
          title: string
          updated_at?: string
        }
        Update: {
          career_stage?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          income_level?: string | null
          is_system_recommendation?: boolean
          priority?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      financial_resources: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          difficulty_level: string | null
          estimated_read_time: number | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          resource_url: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          estimated_read_time?: number | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          resource_url?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          estimated_read_time?: number | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          resource_url?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      follow_up_emails: {
        Row: {
          created_at: string
          email_type: string
          event_id: string
          id: string
          recipient_count: number
          sent_at: string
          status: string
          template_data: Json | null
        }
        Insert: {
          created_at?: string
          email_type: string
          event_id: string
          id?: string
          recipient_count?: number
          sent_at?: string
          status?: string
          template_data?: Json | null
        }
        Update: {
          created_at?: string
          email_type?: string
          event_id?: string
          id?: string
          recipient_count?: number
          sent_at?: string
          status?: string
          template_data?: Json | null
        }
        Relationships: []
      }
      graduate_programs: {
        Row: {
          application_deadline: string | null
          created_at: string | null
          degree_level: string
          description: string | null
          duration_years: number | null
          field_of_study: string
          id: string
          is_active: boolean | null
          program_name: string
          program_url: string | null
          university_name: string
        }
        Insert: {
          application_deadline?: string | null
          created_at?: string | null
          degree_level: string
          description?: string | null
          duration_years?: number | null
          field_of_study: string
          id?: string
          is_active?: boolean | null
          program_name: string
          program_url?: string | null
          university_name: string
        }
        Update: {
          application_deadline?: string | null
          created_at?: string | null
          degree_level?: string
          description?: string | null
          duration_years?: number | null
          field_of_study?: string
          id?: string
          is_active?: boolean | null
          program_name?: string
          program_url?: string | null
          university_name?: string
        }
        Relationships: []
      }
      group_activity_metrics: {
        Row: {
          activity_date: string
          comments_count: number | null
          created_at: string
          engagement_score: number | null
          events_count: number | null
          group_id: string
          id: string
          likes_count: number | null
          new_members_count: number | null
          polls_count: number | null
          posts_count: number | null
        }
        Insert: {
          activity_date?: string
          comments_count?: number | null
          created_at?: string
          engagement_score?: number | null
          events_count?: number | null
          group_id: string
          id?: string
          likes_count?: number | null
          new_members_count?: number | null
          polls_count?: number | null
          posts_count?: number | null
        }
        Update: {
          activity_date?: string
          comments_count?: number | null
          created_at?: string
          engagement_score?: number | null
          events_count?: number | null
          group_id?: string
          id?: string
          likes_count?: number | null
          new_members_count?: number | null
          polls_count?: number | null
          posts_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "group_activity_metrics_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "professional_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_events: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          end_date: string
          event_type: string
          group_id: string
          id: string
          is_active: boolean
          is_virtual: boolean
          location: string | null
          max_attendees: number | null
          start_date: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          virtual_meeting_url: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          end_date: string
          event_type?: string
          group_id: string
          id?: string
          is_active?: boolean
          is_virtual?: boolean
          location?: string | null
          max_attendees?: number | null
          start_date: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          virtual_meeting_url?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          end_date?: string
          event_type?: string
          group_id?: string
          id?: string
          is_active?: boolean
          is_virtual?: boolean
          location?: string | null
          max_attendees?: number | null
          start_date?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          virtual_meeting_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_events_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "professional_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          last_active: string | null
          notifications_enabled: boolean | null
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          last_active?: string | null
          notifications_enabled?: boolean | null
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          last_active?: string | null
          notifications_enabled?: boolean | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "professional_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_polls: {
        Row: {
          created_at: string
          description: string | null
          expires_at: string | null
          group_id: string
          id: string
          is_active: boolean
          multiple_choice: boolean
          options: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          expires_at?: string | null
          group_id: string
          id?: string
          is_active?: boolean
          multiple_choice?: boolean
          options?: Json
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          expires_at?: string | null
          group_id?: string
          id?: string
          is_active?: boolean
          multiple_choice?: boolean
          options?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_polls_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "professional_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_posts: {
        Row: {
          attachment_url: string | null
          content: string
          created_at: string
          group_id: string
          id: string
          is_pinned: boolean | null
          like_count: number | null
          post_type: string | null
          reply_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attachment_url?: string | null
          content: string
          created_at?: string
          group_id: string
          id?: string
          is_pinned?: boolean | null
          like_count?: number | null
          post_type?: string | null
          reply_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attachment_url?: string | null
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          is_pinned?: boolean | null
          like_count?: number | null
          post_type?: string | null
          reply_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "professional_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_recommendations: {
        Row: {
          created_at: string
          group_id: string
          id: string
          is_dismissed: boolean | null
          recommendation_reasons: string[] | null
          recommendation_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          is_dismissed?: boolean | null
          recommendation_reasons?: string[] | null
          recommendation_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          is_dismissed?: boolean | null
          recommendation_reasons?: string[] | null
          recommendation_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_recommendations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "professional_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_resources: {
        Row: {
          created_at: string | null
          description: string | null
          download_count: number | null
          external_url: string | null
          file_url: string | null
          group_id: string
          id: string
          is_approved: boolean | null
          resource_type: string
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          external_url?: string | null
          file_url?: string | null
          group_id: string
          id?: string
          is_approved?: boolean | null
          resource_type: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          external_url?: string | null
          file_url?: string | null
          group_id?: string
          id?: string
          is_approved?: boolean | null
          resource_type?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_resources_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "professional_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_search_analytics: {
        Row: {
          clicked_group_id: string | null
          created_at: string
          id: string
          results_count: number | null
          search_filters: Json | null
          search_query: string
          user_id: string | null
        }
        Insert: {
          clicked_group_id?: string | null
          created_at?: string
          id?: string
          results_count?: number | null
          search_filters?: Json | null
          search_query: string
          user_id?: string | null
        }
        Update: {
          clicked_group_id?: string | null
          created_at?: string
          id?: string
          results_count?: number | null
          search_filters?: Json | null
          search_query?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_search_analytics_clicked_group_id_fkey"
            columns: ["clicked_group_id"]
            isOneToOne: false
            referencedRelation: "professional_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      industry_networks: {
        Row: {
          contact_email: string | null
          created_at: string
          description: string | null
          id: string
          industry_focus: string[]
          is_official_partner: boolean
          location: string | null
          logo_url: string | null
          membership_fee: string | null
          name: string
          status: string
          type: string
          website_url: string | null
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          description?: string | null
          id?: string
          industry_focus: string[]
          is_official_partner?: boolean
          location?: string | null
          logo_url?: string | null
          membership_fee?: string | null
          name: string
          status?: string
          type: string
          website_url?: string | null
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          description?: string | null
          id?: string
          industry_focus?: string[]
          is_official_partner?: boolean
          location?: string | null
          logo_url?: string | null
          membership_fee?: string | null
          name?: string
          status?: string
          type?: string
          website_url?: string | null
        }
        Relationships: []
      }
      innovation_hub_content: {
        Row: {
          author_or_source: string | null
          category: string
          challenge_deadline: string | null
          content_markdown: string | null
          content_url: string | null
          created_at: string
          description: string | null
          event_date: string | null
          id: string
          image_url: string | null
          status: string
          tags: string[] | null
          title: string
          type: string
        }
        Insert: {
          author_or_source?: string | null
          category: string
          challenge_deadline?: string | null
          content_markdown?: string | null
          content_url?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          image_url?: string | null
          status?: string
          tags?: string[] | null
          title: string
          type: string
        }
        Update: {
          author_or_source?: string | null
          category?: string
          challenge_deadline?: string | null
          content_markdown?: string | null
          content_url?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          image_url?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      institutional_api_configs: {
        Row: {
          api_endpoint: string | null
          api_key_hash: string
          created_at: string
          id: string
          institution_id: string
          institution_name: string
          institution_type: string
          is_active: boolean
          last_sync_at: string | null
          rate_limit_per_hour: number
          supported_credential_types: string[]
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          api_endpoint?: string | null
          api_key_hash: string
          created_at?: string
          id?: string
          institution_id: string
          institution_name: string
          institution_type: string
          is_active?: boolean
          last_sync_at?: string | null
          rate_limit_per_hour?: number
          supported_credential_types?: string[]
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          api_endpoint?: string | null
          api_key_hash?: string
          created_at?: string
          id?: string
          institution_id?: string
          institution_name?: string
          institution_type?: string
          is_active?: boolean
          last_sync_at?: string | null
          rate_limit_per_hour?: number
          supported_credential_types?: string[]
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      internship_applications: {
        Row: {
          id: string
          internship_id: string
          notes: string | null
          status: string
          student_id: string
          submitted_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          internship_id: string
          notes?: string | null
          status?: string
          student_id: string
          submitted_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          internship_id?: string
          notes?: string | null
          status?: string
          student_id?: string
          submitted_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "internship_applications_internship_id_fkey"
            columns: ["internship_id"]
            isOneToOne: false
            referencedRelation: "internships"
            referencedColumns: ["id"]
          },
        ]
      }
      internships: {
        Row: {
          application_deadline: string
          company: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string
          currency: string | null
          department: string | null
          description: string
          education_level: string | null
          end_date: string | null
          id: string
          industry: string
          is_active: boolean
          is_paid: boolean
          location: string
          requirements: string[] | null
          skills_required: string[] | null
          start_date: string | null
          stipend_amount: number | null
          title: string
          website_url: string | null
        }
        Insert: {
          application_deadline: string
          company: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by: string
          currency?: string | null
          department?: string | null
          description: string
          education_level?: string | null
          end_date?: string | null
          id?: string
          industry: string
          is_active?: boolean
          is_paid?: boolean
          location: string
          requirements?: string[] | null
          skills_required?: string[] | null
          start_date?: string | null
          stipend_amount?: number | null
          title: string
          website_url?: string | null
        }
        Update: {
          application_deadline?: string
          company?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string
          currency?: string | null
          department?: string | null
          description?: string
          education_level?: string | null
          end_date?: string | null
          id?: string
          industry?: string
          is_active?: boolean
          is_paid?: boolean
          location?: string
          requirements?: string[] | null
          skills_required?: string[] | null
          start_date?: string | null
          stipend_amount?: number | null
          title?: string
          website_url?: string | null
        }
        Relationships: []
      }
      job_descriptions: {
        Row: {
          application_deadline: string | null
          benefits: Json | null
          company: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          employment_type: string | null
          id: string
          is_active: boolean | null
          keywords: Json | null
          location: string | null
          posted_date: string | null
          requirements: Json | null
          responsibilities: Json | null
          salary: Json | null
          title: string
          updated_at: string | null
          user_id: string | null
          work_mode: string | null
        }
        Insert: {
          application_deadline?: string | null
          benefits?: Json | null
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          employment_type?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: Json | null
          location?: string | null
          posted_date?: string | null
          requirements?: Json | null
          responsibilities?: Json | null
          salary?: Json | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          work_mode?: string | null
        }
        Update: {
          application_deadline?: string | null
          benefits?: Json | null
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          employment_type?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: Json | null
          location?: string | null
          posted_date?: string | null
          requirements?: Json | null
          responsibilities?: Json | null
          salary?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          work_mode?: string | null
        }
        Relationships: []
      }
      job_matches: {
        Row: {
          category_scores: Json | null
          created_at: string | null
          id: string
          job_id: string | null
          match_details: Json | null
          overall_score: number | null
          profile_id: string | null
          updated_at: string | null
        }
        Insert: {
          category_scores?: Json | null
          created_at?: string | null
          id?: string
          job_id?: string | null
          match_details?: Json | null
          overall_score?: number | null
          profile_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category_scores?: Json | null
          created_at?: string | null
          id?: string
          job_id?: string | null
          match_details?: Json | null
          overall_score?: number | null
          profile_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_descriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_matches_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      leadership_resources: {
        Row: {
          cost: number | null
          created_at: string
          description: string | null
          duration: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          link_url: string
          provider: string | null
          status: string
          tags: string[] | null
          target_personas: string[] | null
          title: string
          type: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          link_url: string
          provider?: string | null
          status?: string
          tags?: string[] | null
          target_personas?: string[] | null
          title: string
          type: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          link_url?: string
          provider?: string | null
          status?: string
          tags?: string[] | null
          target_personas?: string[] | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      legacy_projects: {
        Row: {
          contact_email: string | null
          created_at: string
          current_funding: number | null
          description: string | null
          expected_completion_date: string | null
          focus_area: string | null
          funding_currency: string | null
          funding_goal: number | null
          id: string
          image_url: string | null
          impact_metrics: string | null
          initiator_id: string | null
          is_featured: boolean | null
          location: string | null
          project_status: string | null
          requirements: string | null
          skills_needed: string[] | null
          start_date: string | null
          title: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          current_funding?: number | null
          description?: string | null
          expected_completion_date?: string | null
          focus_area?: string | null
          funding_currency?: string | null
          funding_goal?: number | null
          id?: string
          image_url?: string | null
          impact_metrics?: string | null
          initiator_id?: string | null
          is_featured?: boolean | null
          location?: string | null
          project_status?: string | null
          requirements?: string | null
          skills_needed?: string[] | null
          start_date?: string | null
          title: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          current_funding?: number | null
          description?: string | null
          expected_completion_date?: string | null
          focus_area?: string | null
          funding_currency?: string | null
          funding_goal?: number | null
          id?: string
          image_url?: string | null
          impact_metrics?: string | null
          initiator_id?: string | null
          is_featured?: boolean | null
          location?: string | null
          project_status?: string | null
          requirements?: string | null
          skills_needed?: string[] | null
          start_date?: string | null
          title?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          enrollment_id: string
          id: string
          is_completed: boolean
          lesson_id: string
          started_at: string
          time_spent_minutes: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          enrollment_id: string
          id?: string
          is_completed?: boolean
          lesson_id: string
          started_at?: string
          time_spent_minutes?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          enrollment_id?: string
          id?: string
          is_completed?: boolean
          lesson_id?: string
          started_at?: string
          time_spent_minutes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          is_mandatory: boolean
          lesson_type: Database["public"]["Enums"]["lesson_type"]
          module_id: string
          order_index: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_mandatory?: boolean
          lesson_type?: Database["public"]["Enums"]["lesson_type"]
          module_id: string
          order_index: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_mandatory?: boolean
          lesson_type?: Database["public"]["Enums"]["lesson_type"]
          module_id?: string
          order_index?: number
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      match_evaluations: {
        Row: {
          created_at: string
          evaluated_at: string
          id: string
          match_suggestions: Json
          suggestion_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          evaluated_at?: string
          id?: string
          match_suggestions?: Json
          suggestion_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          evaluated_at?: string
          id?: string
          match_suggestions?: Json
          suggestion_count?: number
          user_id?: string
        }
        Relationships: []
      }
      match_re_evaluation_queue: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          scheduled_for: string
          status: string
          trigger_type: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          scheduled_for?: string
          status?: string
          trigger_type: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          scheduled_for?: string
          status?: string
          trigger_type?: string
          user_id?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          job_id: string | null
          resume_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          id?: string
          job_id?: string | null
          resume_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          job_id?: string | null
          resume_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resume_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      mentors: {
        Row: {
          availability: Json | null
          bio: string | null
          created_at: string
          expertise: string[]
          id: string
          is_active: boolean
          is_verified: boolean
          rating: number | null
          review_count: number | null
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          availability?: Json | null
          bio?: string | null
          created_at?: string
          expertise?: string[]
          id?: string
          is_active?: boolean
          is_verified?: boolean
          rating?: number | null
          review_count?: number | null
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          availability?: Json | null
          bio?: string | null
          created_at?: string
          expertise?: string[]
          id?: string
          is_active?: boolean
          is_verified?: boolean
          rating?: number | null
          review_count?: number | null
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      mentorship_goals: {
        Row: {
          completed_at: string | null
          completion_percentage: number | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          priority: string
          relationship_id: string
          status: string
          target_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          priority?: string
          relationship_id: string
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          priority?: string
          relationship_id?: string
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_goals_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "mentorship_relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorship_progress_assessments: {
        Row: {
          areas_of_improvement: string[] | null
          assessed_by: string
          assessment_date: string
          assessment_notes: string | null
          assessment_period: string
          communication_effectiveness: number | null
          created_at: string
          goal_progress_rating: number | null
          highlights: string[] | null
          id: string
          mentee_satisfaction: number | null
          mentor_satisfaction: number | null
          next_period_focus: string[] | null
          relationship_id: string
          skill_development_rating: number | null
        }
        Insert: {
          areas_of_improvement?: string[] | null
          assessed_by: string
          assessment_date?: string
          assessment_notes?: string | null
          assessment_period: string
          communication_effectiveness?: number | null
          created_at?: string
          goal_progress_rating?: number | null
          highlights?: string[] | null
          id?: string
          mentee_satisfaction?: number | null
          mentor_satisfaction?: number | null
          next_period_focus?: string[] | null
          relationship_id: string
          skill_development_rating?: number | null
        }
        Update: {
          areas_of_improvement?: string[] | null
          assessed_by?: string
          assessment_date?: string
          assessment_notes?: string | null
          assessment_period?: string
          communication_effectiveness?: number | null
          created_at?: string
          goal_progress_rating?: number | null
          highlights?: string[] | null
          id?: string
          mentee_satisfaction?: number | null
          mentor_satisfaction?: number | null
          next_period_focus?: string[] | null
          relationship_id?: string
          skill_development_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_progress_assessments_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "mentorship_relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorship_relationships: {
        Row: {
          created_at: string
          end_date: string | null
          goals: string | null
          id: string
          mentee_id: string
          mentor_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["mentorship_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          goals?: string | null
          id?: string
          mentee_id: string
          mentor_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["mentorship_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          goals?: string | null
          id?: string
          mentee_id?: string
          mentor_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["mentorship_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_relationships_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorship_sessions: {
        Row: {
          created_at: string
          duration_minutes: number
          feedback: string | null
          id: string
          notes: string | null
          rating: number | null
          relationship_id: string
          scheduled_date: string
          status: string
          topic: string | null
          updated_at: string
          video_call_url: string | null
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          feedback?: string | null
          id?: string
          notes?: string | null
          rating?: number | null
          relationship_id: string
          scheduled_date: string
          status?: string
          topic?: string | null
          updated_at?: string
          video_call_url?: string | null
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          feedback?: string | null
          id?: string
          notes?: string | null
          rating?: number | null
          relationship_id?: string
          scheduled_date?: string
          status?: string
          topic?: string | null
          updated_at?: string
          video_call_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_sessions_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "mentorship_relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorship_success_metrics: {
        Row: {
          created_at: string
          id: string
          metric_details: Json | null
          metric_type: string
          metric_value: number
          recorded_at: string
          recorded_by: string
          relationship_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metric_details?: Json | null
          metric_type: string
          metric_value: number
          recorded_at?: string
          recorded_by: string
          relationship_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metric_details?: Json | null
          metric_type?: string
          metric_value?: number
          recorded_at?: string
          recorded_by?: string
          relationship_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_success_metrics_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "mentorship_relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_logs: {
        Row: {
          action_type: string
          created_at: string | null
          duration_hours: number | null
          group_id: string
          id: string
          moderator_id: string
          reason: string | null
          target_post_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          duration_hours?: number | null
          group_id: string
          id?: string
          moderator_id: string
          reason?: string | null
          target_post_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          duration_hours?: number | null
          group_id?: string
          id?: string
          moderator_id?: string
          reason?: string | null
          target_post_id?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_logs_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "professional_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_logs_target_post_id_fkey"
            columns: ["target_post_id"]
            isOneToOne: false
            referencedRelation: "group_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      national_service_resources: {
        Row: {
          category: string
          content_markdown: string | null
          content_url: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          resource_type: string
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          content_markdown?: string | null
          content_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          resource_type: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content_markdown?: string | null
          content_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          resource_type?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      networking_events: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          end_date: string
          event_type: string
          group_id: string | null
          id: string
          is_featured: boolean
          is_virtual: boolean
          location: string | null
          max_participants: number | null
          organizer_id: string
          start_date: string
          title: string
          updated_at: string
          virtual_meeting_url: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          end_date: string
          event_type: string
          group_id?: string | null
          id?: string
          is_featured?: boolean
          is_virtual?: boolean
          location?: string | null
          max_participants?: number | null
          organizer_id: string
          start_date: string
          title: string
          updated_at?: string
          virtual_meeting_url?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          end_date?: string
          event_type?: string
          group_id?: string | null
          id?: string
          is_featured?: boolean
          is_virtual?: boolean
          location?: string | null
          max_participants?: number | null
          organizer_id?: string
          start_date?: string
          title?: string
          updated_at?: string
          virtual_meeting_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "networking_events_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "professional_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      networking_rooms: {
        Row: {
          career_level: string | null
          created_at: string | null
          current_participants: number | null
          description: string | null
          event_id: string
          host_id: string | null
          id: string
          industry_focus: string | null
          is_active: boolean | null
          max_participants: number | null
          meeting_url: string | null
          name: string
          room_type: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          topics: string[] | null
          updated_at: string | null
        }
        Insert: {
          career_level?: string | null
          created_at?: string | null
          current_participants?: number | null
          description?: string | null
          event_id: string
          host_id?: string | null
          id?: string
          industry_focus?: string | null
          is_active?: boolean | null
          max_participants?: number | null
          meeting_url?: string | null
          name: string
          room_type?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          topics?: string[] | null
          updated_at?: string | null
        }
        Update: {
          career_level?: string | null
          created_at?: string | null
          current_participants?: number | null
          description?: string | null
          event_id?: string
          host_id?: string | null
          id?: string
          industry_focus?: string | null
          is_active?: boolean | null
          max_participants?: number | null
          meeting_url?: string | null
          name?: string
          room_type?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          topics?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "networking_rooms_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "virtual_events"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      phase_transitions: {
        Row: {
          created_at: string
          from_phase: string
          id: string
          notes: string | null
          readiness_score: number | null
          to_phase: string
          transition_data: Json
          transition_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          from_phase: string
          id?: string
          notes?: string | null
          readiness_score?: number | null
          to_phase: string
          transition_data?: Json
          transition_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          from_phase?: string
          id?: string
          notes?: string | null
          readiness_score?: number | null
          to_phase?: string
          transition_data?: Json
          transition_date?: string
          user_id?: string
        }
        Relationships: []
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          poll_id: string
          selected_options: number[]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          poll_id: string
          selected_options: number[]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          poll_id?: string
          selected_options?: number[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "group_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "group_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "group_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_certifications: {
        Row: {
          certification_name: string
          certification_url: string | null
          cost: number | null
          created_at: string | null
          description: string | null
          duration_weeks: number | null
          id: string
          industry: string
          is_active: boolean | null
          issuing_body: string
        }
        Insert: {
          certification_name: string
          certification_url?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          duration_weeks?: number | null
          id?: string
          industry: string
          is_active?: boolean | null
          issuing_body: string
        }
        Update: {
          certification_name?: string
          certification_url?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          duration_weeks?: number | null
          id?: string
          industry?: string
          is_active?: boolean | null
          issuing_body?: string
        }
        Relationships: []
      }
      professional_communities: {
        Row: {
          application_url: string | null
          benefits: string[] | null
          community_type: string
          created_at: string
          description: string
          featured: boolean
          founding_year: number | null
          id: string
          industry_focus: string[]
          location_type: string
          logo_url: string | null
          meeting_frequency: string | null
          membership_fee: string | null
          membership_type: string
          name: string
          physical_location: string | null
          size: string | null
          status: string
          website_url: string | null
        }
        Insert: {
          application_url?: string | null
          benefits?: string[] | null
          community_type: string
          created_at?: string
          description: string
          featured?: boolean
          founding_year?: number | null
          id?: string
          industry_focus: string[]
          location_type: string
          logo_url?: string | null
          meeting_frequency?: string | null
          membership_fee?: string | null
          membership_type: string
          name: string
          physical_location?: string | null
          size?: string | null
          status?: string
          website_url?: string | null
        }
        Update: {
          application_url?: string | null
          benefits?: string[] | null
          community_type?: string
          created_at?: string
          description?: string
          featured?: boolean
          founding_year?: number | null
          id?: string
          industry_focus?: string[]
          location_type?: string
          logo_url?: string | null
          meeting_frequency?: string | null
          membership_fee?: string | null
          membership_type?: string
          name?: string
          physical_location?: string | null
          size?: string | null
          status?: string
          website_url?: string | null
        }
        Relationships: []
      }
      professional_groups: {
        Row: {
          category: string | null
          cover_image_url: string | null
          created_at: string
          creator_id: string
          description: string | null
          id: string
          industry: string | null
          is_private: boolean
          member_count: number | null
          name: string
          rules: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          industry?: string | null
          is_private?: boolean
          member_count?: number | null
          name: string
          rules?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          industry?: string | null
          is_private?: boolean
          member_count?: number | null
          name?: string
          rules?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_collaborations: {
        Row: {
          agreed_budget: number | null
          agreed_timeline: string | null
          application_id: string
          client_feedback: string | null
          client_id: string
          client_rating: number | null
          collaborator_feedback: string | null
          collaborator_id: string
          collaborator_rating: number | null
          created_at: string
          end_date: string | null
          id: string
          opportunity_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          agreed_budget?: number | null
          agreed_timeline?: string | null
          application_id: string
          client_feedback?: string | null
          client_id: string
          client_rating?: number | null
          collaborator_feedback?: string | null
          collaborator_id: string
          collaborator_rating?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          opportunity_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          agreed_budget?: number | null
          agreed_timeline?: string | null
          application_id?: string
          client_feedback?: string | null
          client_id?: string
          client_rating?: number | null
          collaborator_feedback?: string | null
          collaborator_id?: string
          collaborator_rating?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          opportunity_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_collaborations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "skill_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_collaborations_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "skill_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      project_contributions: {
        Row: {
          amount: number | null
          contribution_date: string
          contribution_type: string
          created_at: string
          currency: string | null
          description: string | null
          hours_contributed: number | null
          id: string
          project_id: string
          skills_provided: string[] | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          contribution_date?: string
          contribution_type: string
          created_at?: string
          currency?: string | null
          description?: string | null
          hours_contributed?: number | null
          id?: string
          project_id: string
          skills_provided?: string[] | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          contribution_date?: string
          contribution_type?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          hours_contributed?: number | null
          id?: string
          project_id?: string
          skills_provided?: string[] | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_contributions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "legacy_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json
          attempt_number: number
          completed_at: string
          enrollment_id: string
          id: string
          max_score: number
          percentage: number
          quiz_id: string
          score: number
          started_at: string
          user_id: string
        }
        Insert: {
          answers: Json
          attempt_number?: number
          completed_at?: string
          enrollment_id: string
          id?: string
          max_score: number
          percentage: number
          quiz_id: string
          score: number
          started_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          attempt_number?: number
          completed_at?: string
          enrollment_id?: string
          id?: string
          max_score?: number
          percentage?: number
          quiz_id?: string
          score?: number
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: Json
          created_at: string
          explanation: string | null
          id: string
          options: Json | null
          order_index: number
          points: number
          question_text: string
          question_type: string
          quiz_id: string
        }
        Insert: {
          correct_answer: Json
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json | null
          order_index: number
          points?: number
          question_text: string
          question_type?: string
          quiz_id: string
        }
        Update: {
          correct_answer?: Json
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json | null
          order_index?: number
          points?: number
          question_text?: string
          question_type?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          course_id: string | null
          created_at: string
          description: string | null
          id: string
          is_randomized: boolean
          lesson_id: string | null
          max_attempts: number | null
          passing_score: number
          time_limit_minutes: number | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_randomized?: boolean
          lesson_id?: string | null
          max_attempts?: number | null
          passing_score?: number
          time_limit_minutes?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_randomized?: boolean
          lesson_id?: string | null
          max_attempts?: number | null
          passing_score?: number
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_data: {
        Row: {
          created_at: string
          data: Json
          id: string
          resume_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: Json
          id?: string
          resume_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          resume_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_data_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resume_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resume_data_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          created_at: string
          id: string
          is_public: boolean
          template_id: string
          theme: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean
          template_id: string
          theme?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean
          template_id?: string
          theme?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      retiree_resources: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          estimated_read_time: number | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          resource_url: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          estimated_read_time?: number | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          resource_url?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          estimated_read_time?: number | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          resource_url?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      scholarship_applications: {
        Row: {
          application_data: Json | null
          id: string
          scholarship_id: string
          status: string
          student_id: string
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          application_data?: Json | null
          id?: string
          scholarship_id: string
          status?: string
          student_id: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          application_data?: Json | null
          id?: string
          scholarship_id?: string
          status?: string
          student_id?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scholarship_applications_scholarship_id_fkey"
            columns: ["scholarship_id"]
            isOneToOne: false
            referencedRelation: "scholarships"
            referencedColumns: ["id"]
          },
        ]
      }
      scholarships: {
        Row: {
          amount: number | null
          application_deadline: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          eligibility_criteria: Json | null
          id: string
          is_active: boolean | null
          provider: string
          provider_type: string
          requirements: string[] | null
          title: string
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          amount?: number | null
          application_deadline?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          eligibility_criteria?: Json | null
          id?: string
          is_active?: boolean | null
          provider: string
          provider_type: string
          requirements?: string[] | null
          title: string
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          amount?: number | null
          application_deadline?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          eligibility_criteria?: Json | null
          id?: string
          is_active?: boolean | null
          provider?: string
          provider_type?: string
          requirements?: string[] | null
          title?: string
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      security_alerts: {
        Row: {
          alerts: Json
          created_at: string | null
          id: string
          ip_address: unknown | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          risk_level: string
          user_id: string | null
        }
        Insert: {
          alerts?: Json
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_level: string
          user_id?: string | null
        }
        Update: {
          alerts?: Json
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_level?: string
          user_id?: string | null
        }
        Relationships: []
      }
      session_attendance: {
        Row: {
          created_at: string
          duration_seconds: number | null
          engagement_score: number | null
          event_id: string
          id: string
          interactions_count: number | null
          joined_at: string
          left_at: string | null
          session_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          engagement_score?: number | null
          event_id: string
          id?: string
          interactions_count?: number | null
          joined_at?: string
          left_at?: string | null
          session_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          engagement_score?: number | null
          event_id?: string
          id?: string
          interactions_count?: number | null
          joined_at?: string
          left_at?: string | null
          session_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      session_registrations: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          event_registration_id: string
          id: string
          joined_at: string | null
          left_at: string | null
          session_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          event_registration_id: string
          id?: string
          joined_at?: string | null
          left_at?: string | null
          session_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          event_registration_id?: string
          id?: string
          joined_at?: string | null
          left_at?: string | null
          session_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_registrations_event_registration_id_fkey"
            columns: ["event_registration_id"]
            isOneToOne: false
            referencedRelation: "virtual_event_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_registrations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "event_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_applications: {
        Row: {
          applicant_id: string
          applied_at: string
          cover_letter: string | null
          id: string
          opportunity_id: string
          portfolio_links: string[] | null
          proposed_budget: number | null
          proposed_timeline: string | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
        }
        Insert: {
          applicant_id: string
          applied_at?: string
          cover_letter?: string | null
          id?: string
          opportunity_id: string
          portfolio_links?: string[] | null
          proposed_budget?: number | null
          proposed_timeline?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          applied_at?: string
          cover_letter?: string | null
          id?: string
          opportunity_id?: string
          portfolio_links?: string[] | null
          proposed_budget?: number | null
          proposed_timeline?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "skill_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_exchange_requests: {
        Row: {
          created_at: string
          description: string | null
          duration_hours: number | null
          id: string
          matched_with: string | null
          offered_skill_id: string
          requested_skill_id: string
          requester_id: string
          status: Database["public"]["Enums"]["application_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          matched_with?: string | null
          offered_skill_id: string
          requested_skill_id: string
          requester_id: string
          status?: Database["public"]["Enums"]["application_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          matched_with?: string | null
          offered_skill_id?: string
          requested_skill_id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_exchange_requests_offered_skill_id_fkey"
            columns: ["offered_skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_exchange_requests_requested_skill_id_fkey"
            columns: ["requested_skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_opportunities: {
        Row: {
          budget_amount: number | null
          budget_currency: string | null
          created_at: string
          created_by: string
          deadline: string | null
          description: string
          duration_hours: number | null
          id: string
          is_remote: boolean | null
          location: string | null
          max_applicants: number | null
          opportunity_type: Database["public"]["Enums"]["opportunity_type"]
          required_skills: string[]
          skill_level_required: Database["public"]["Enums"]["skill_level"]
          status: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at: string
        }
        Insert: {
          budget_amount?: number | null
          budget_currency?: string | null
          created_at?: string
          created_by: string
          deadline?: string | null
          description: string
          duration_hours?: number | null
          id?: string
          is_remote?: boolean | null
          location?: string | null
          max_applicants?: number | null
          opportunity_type: Database["public"]["Enums"]["opportunity_type"]
          required_skills: string[]
          skill_level_required?: Database["public"]["Enums"]["skill_level"]
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at?: string
        }
        Update: {
          budget_amount?: number | null
          budget_currency?: string | null
          created_at?: string
          created_by?: string
          deadline?: string | null
          description?: string
          duration_hours?: number | null
          id?: string
          is_remote?: boolean | null
          location?: string | null
          max_applicants?: number | null
          opportunity_type?: Database["public"]["Enums"]["opportunity_type"]
          required_skills?: string[]
          skill_level_required?: Database["public"]["Enums"]["skill_level"]
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      smart_contract_interactions: {
        Row: {
          block_number: number | null
          confirmation_count: number | null
          confirmed_at: string | null
          contract_id: string
          created_at: string
          error_message: string | null
          function_name: string
          gas_price: number | null
          gas_used: number | null
          id: string
          initiated_by: string
          input_data: Json
          output_data: Json | null
          status: string
          transaction_fee: number | null
          transaction_hash: string
        }
        Insert: {
          block_number?: number | null
          confirmation_count?: number | null
          confirmed_at?: string | null
          contract_id: string
          created_at?: string
          error_message?: string | null
          function_name: string
          gas_price?: number | null
          gas_used?: number | null
          id?: string
          initiated_by: string
          input_data: Json
          output_data?: Json | null
          status: string
          transaction_fee?: number | null
          transaction_hash: string
        }
        Update: {
          block_number?: number | null
          confirmation_count?: number | null
          confirmed_at?: string | null
          contract_id?: string
          created_at?: string
          error_message?: string | null
          function_name?: string
          gas_price?: number | null
          gas_used?: number | null
          id?: string
          initiated_by?: string
          input_data?: Json
          output_data?: Json | null
          status?: string
          transaction_fee?: number | null
          transaction_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_contract_interactions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "smart_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_contracts: {
        Row: {
          abi: Json
          contract_address: string
          contract_type: string
          created_at: string
          deployment_block_number: number
          deployment_transaction_hash: string
          id: string
          is_active: boolean
          network: string
          updated_at: string
        }
        Insert: {
          abi: Json
          contract_address: string
          contract_type: string
          created_at?: string
          deployment_block_number: number
          deployment_transaction_hash: string
          id?: string
          is_active?: boolean
          network?: string
          updated_at?: string
        }
        Update: {
          abi?: Json
          contract_address?: string
          contract_type?: string
          created_at?: string
          deployment_block_number?: number
          deployment_transaction_hash?: string
          id?: string
          is_active?: boolean
          network?: string
          updated_at?: string
        }
        Relationships: []
      }
      startup_ecosystem_entities: {
        Row: {
          application_link_or_email: string | null
          created_at: string
          description: string | null
          funding_stage_focus: string | null
          id: string
          industry_focus: string[] | null
          location: string | null
          logo_url: string | null
          name: string
          status: string
          type: string
          website_url: string
        }
        Insert: {
          application_link_or_email?: string | null
          created_at?: string
          description?: string | null
          funding_stage_focus?: string | null
          id?: string
          industry_focus?: string[] | null
          location?: string | null
          logo_url?: string | null
          name: string
          status?: string
          type: string
          website_url: string
        }
        Update: {
          application_link_or_email?: string | null
          created_at?: string
          description?: string | null
          funding_stage_focus?: string | null
          id?: string
          industry_focus?: string[] | null
          location?: string | null
          logo_url?: string | null
          name?: string
          status?: string
          type?: string
          website_url?: string
        }
        Relationships: []
      }
      success_stories: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          impact_metrics: string | null
          is_approved: boolean | null
          story_content: string
          submission_date: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          impact_metrics?: string | null
          is_approved?: boolean | null
          story_content: string
          submission_date?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          impact_metrics?: string | null
          is_approved?: boolean | null
          story_content?: string
          submission_date?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      summer_camps: {
        Row: {
          age_group: string
          capacity: number
          category: string
          created_at: string
          created_by: string | null
          currency: string | null
          description: string
          duration: string
          end_date: string
          enrolled: number
          id: string
          image_url: string
          location: string
          max_participants: number | null
          organizer: string
          price: number
          rating: number | null
          registration_deadline: string | null
          start_date: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          age_group: string
          capacity: number
          category: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description: string
          duration: string
          end_date: string
          enrolled?: number
          id?: string
          image_url?: string
          location: string
          max_participants?: number | null
          organizer: string
          price: number
          rating?: number | null
          registration_deadline?: string | null
          start_date: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          age_group?: string
          capacity?: number
          category?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string
          duration?: string
          end_date?: string
          enrolled?: number
          id?: string
          image_url?: string
          location?: string
          max_participants?: number | null
          organizer?: string
          price?: number
          rating?: number | null
          registration_deadline?: string | null
          start_date?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      thought_leadership_content: {
        Row: {
          author_name: string
          author_organization: string | null
          author_title: string | null
          content_type: string
          created_at: string
          created_by: string | null
          duration_minutes: number | null
          full_content_url: string | null
          id: string
          is_featured: boolean | null
          published_date: string
          reading_time_minutes: number | null
          status: string | null
          summary: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          author_name: string
          author_organization?: string | null
          author_title?: string | null
          content_type: string
          created_at?: string
          created_by?: string | null
          duration_minutes?: number | null
          full_content_url?: string | null
          id?: string
          is_featured?: boolean | null
          published_date?: string
          reading_time_minutes?: number | null
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          author_name?: string
          author_organization?: string | null
          author_title?: string | null
          content_type?: string
          created_at?: string
          created_by?: string | null
          duration_minutes?: number | null
          full_content_url?: string | null
          id?: string
          is_featured?: boolean | null
          published_date?: string
          reading_time_minutes?: number | null
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
      }
      training_applications: {
        Row: {
          application_data: Json | null
          created_at: string | null
          id: string
          program_id: string | null
          reviewed_at: string | null
          reviewer_notes: string | null
          status: string | null
          submitted_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          application_data?: Json | null
          created_at?: string | null
          id?: string
          program_id?: string | null
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          application_data?: Json | null
          created_at?: string | null
          id?: string
          program_id?: string | null
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      training_enrollments: {
        Row: {
          application_id: string | null
          certificate_issued: boolean | null
          certificate_url: string | null
          completion_date: string | null
          created_at: string | null
          enrollment_date: string | null
          final_grade: string | null
          id: string
          program_id: string | null
          progress_percentage: number | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          application_id?: string | null
          certificate_issued?: boolean | null
          certificate_url?: string | null
          completion_date?: string | null
          created_at?: string | null
          enrollment_date?: string | null
          final_grade?: string | null
          id?: string
          program_id?: string | null
          progress_percentage?: number | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          application_id?: string | null
          certificate_issued?: boolean | null
          certificate_url?: string | null
          completion_date?: string | null
          created_at?: string | null
          enrollment_date?: string | null
          final_grade?: string | null
          id?: string
          program_id?: string | null
          progress_percentage?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_enrollments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "training_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      training_materials: {
        Row: {
          category: string
          center_id: string
          created_at: string | null
          description: string
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          is_public: boolean | null
          material_type: string
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          center_id: string
          created_at?: string | null
          description: string
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_public?: boolean | null
          material_type: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          center_id?: string
          created_at?: string | null
          description?: string
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_public?: boolean | null
          material_type?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      training_programs: {
        Row: {
          application_deadline: string | null
          category: Database["public"]["Enums"]["training_category"]
          certification_name: string | null
          certification_offered: boolean | null
          created_at: string | null
          current_participants: number | null
          description: string | null
          duration_weeks: number | null
          end_date: string | null
          featured: boolean | null
          id: string
          image_url: string | null
          job_placement_assistance: boolean | null
          learning_outcomes: string[] | null
          location: string | null
          max_participants: number | null
          prerequisites: string[] | null
          price_amount: number | null
          price_currency: string | null
          provider_id: string | null
          schedule_details: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["training_status"] | null
          subcategory: string | null
          title: string
          training_mode: Database["public"]["Enums"]["training_mode"] | null
          updated_at: string | null
        }
        Insert: {
          application_deadline?: string | null
          category: Database["public"]["Enums"]["training_category"]
          certification_name?: string | null
          certification_offered?: boolean | null
          created_at?: string | null
          current_participants?: number | null
          description?: string | null
          duration_weeks?: number | null
          end_date?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          job_placement_assistance?: boolean | null
          learning_outcomes?: string[] | null
          location?: string | null
          max_participants?: number | null
          prerequisites?: string[] | null
          price_amount?: number | null
          price_currency?: string | null
          provider_id?: string | null
          schedule_details?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["training_status"] | null
          subcategory?: string | null
          title: string
          training_mode?: Database["public"]["Enums"]["training_mode"] | null
          updated_at?: string | null
        }
        Update: {
          application_deadline?: string | null
          category?: Database["public"]["Enums"]["training_category"]
          certification_name?: string | null
          certification_offered?: boolean | null
          created_at?: string | null
          current_participants?: number | null
          description?: string | null
          duration_weeks?: number | null
          end_date?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          job_placement_assistance?: boolean | null
          learning_outcomes?: string[] | null
          location?: string | null
          max_participants?: number | null
          prerequisites?: string[] | null
          price_amount?: number | null
          price_currency?: string | null
          provider_id?: string | null
          schedule_details?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["training_status"] | null
          subcategory?: string | null
          title?: string
          training_mode?: Database["public"]["Enums"]["training_mode"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_programs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "training_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      training_providers: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          id: string
          is_verified: boolean | null
          logo_url: string | null
          name: string
          partnership_level: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_verified?: boolean | null
          logo_url?: string | null
          name: string
          partnership_level?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_verified?: boolean | null
          logo_url?: string | null
          name?: string
          partnership_level?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      university_programs: {
        Row: {
          application_deadline: string | null
          created_at: string | null
          degree_level: string
          description: string | null
          duration_years: number | null
          field_of_study: string
          id: string
          is_active: boolean | null
          program_name: string
          program_url: string | null
          university_name: string
        }
        Insert: {
          application_deadline?: string | null
          created_at?: string | null
          degree_level: string
          description?: string | null
          duration_years?: number | null
          field_of_study: string
          id?: string
          is_active?: boolean | null
          program_name: string
          program_url?: string | null
          university_name: string
        }
        Update: {
          application_deadline?: string | null
          created_at?: string | null
          degree_level?: string
          description?: string | null
          duration_years?: number | null
          field_of_study?: string
          id?: string
          is_active?: boolean | null
          program_name?: string
          program_url?: string | null
          university_name?: string
        }
        Relationships: []
      }
      user_budgets: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          expense_data: Json
          id: string
          income_data: Json
          start_date: string
          status: string
          template_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          expense_data: Json
          id?: string
          income_data: Json
          start_date: string
          status?: string
          template_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          expense_data?: Json
          id?: string
          income_data?: Json
          start_date?: string
          status?: string
          template_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_budgets_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "budget_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_career_paths: {
        Row: {
          career_path_id: string
          current_stage_id: string | null
          id: string
          started_at: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          career_path_id: string
          current_stage_id?: string | null
          id?: string
          started_at?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          career_path_id?: string
          current_stage_id?: string | null
          id?: string
          started_at?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_career_paths_career_path_id_fkey"
            columns: ["career_path_id"]
            isOneToOne: false
            referencedRelation: "career_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_career_paths_current_stage_id_fkey"
            columns: ["current_stage_id"]
            isOneToOne: false
            referencedRelation: "career_path_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_connections: {
        Row: {
          created_at: string
          id: string
          recipient_id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipient_id: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          recipient_id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_financial_plans: {
        Row: {
          career_stage: string
          created_at: string
          description: string | null
          expense_details: Json | null
          id: string
          income_details: Json | null
          investment_details: Json | null
          savings_details: Json | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          career_stage: string
          created_at?: string
          description?: string | null
          expense_details?: Json | null
          id?: string
          income_details?: Json | null
          investment_details?: Json | null
          savings_details?: Json | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          career_stage?: string
          created_at?: string
          description?: string | null
          expense_details?: Json | null
          id?: string
          income_details?: Json | null
          investment_details?: Json | null
          savings_details?: Json | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_financial_recommendations: {
        Row: {
          created_at: string
          id: string
          implementation_date: string | null
          implementation_notes: string | null
          is_implemented: boolean
          recommendation_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          implementation_date?: string | null
          implementation_notes?: string | null
          is_implemented?: boolean
          recommendation_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          implementation_date?: string | null
          implementation_notes?: string | null
          is_implemented?: boolean
          recommendation_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_financial_recommendations_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "financial_recommendations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interests: {
        Row: {
          created_at: string
          id: string
          interest_type: string
          interest_value: string
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          interest_type: string
          interest_value: string
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          interest_type?: string
          interest_value?: string
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      user_journey_analytics: {
        Row: {
          created_at: string
          event_data: Json
          event_type: string
          id: string
          ip_address: unknown | null
          phase: string
          session_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json
          event_type: string
          id?: string
          ip_address?: unknown | null
          phase: string
          session_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json
          event_type?: string
          id?: string
          ip_address?: unknown | null
          phase?: string
          session_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_journey_milestones: {
        Row: {
          achieved_at: string
          id: string
          milestone_data: Json | null
          milestone_name: string
          milestone_type: string
          phase: string
          points_earned: number | null
          user_id: string
        }
        Insert: {
          achieved_at?: string
          id?: string
          milestone_data?: Json | null
          milestone_name: string
          milestone_type: string
          phase: string
          points_earned?: number | null
          user_id: string
        }
        Update: {
          achieved_at?: string
          id?: string
          milestone_data?: Json | null
          milestone_name?: string
          milestone_type?: string
          phase?: string
          points_earned?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message_text: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message_text: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message_text?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_skills: {
        Row: {
          created_at: string
          description: string | null
          id: string
          portfolio_links: string[] | null
          skill_id: string
          skill_level: Database["public"]["Enums"]["skill_level"]
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          portfolio_links?: string[] | null
          skill_id: string
          skill_level?: Database["public"]["Enums"]["skill_level"]
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          portfolio_links?: string[] | null
          skill_id?: string
          skill_level?: Database["public"]["Enums"]["skill_level"]
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      verified_credentials: {
        Row: {
          created_at: string
          credential_number: string | null
          credential_title: string
          credential_type: string
          expiry_date: string | null
          id: string
          institution_name: string
          issue_date: string | null
          metadata: Json | null
          updated_at: string
          user_id: string
          verification_source: string
          verification_status: string
        }
        Insert: {
          created_at?: string
          credential_number?: string | null
          credential_title: string
          credential_type: string
          expiry_date?: string | null
          id?: string
          institution_name: string
          issue_date?: string | null
          metadata?: Json | null
          updated_at?: string
          user_id: string
          verification_source: string
          verification_status?: string
        }
        Update: {
          created_at?: string
          credential_number?: string | null
          credential_title?: string
          credential_type?: string
          expiry_date?: string | null
          id?: string
          institution_name?: string
          issue_date?: string | null
          metadata?: Json | null
          updated_at?: string
          user_id?: string
          verification_source?: string
          verification_status?: string
        }
        Relationships: []
      }
      virtual_booths: {
        Row: {
          banner_url: string | null
          booth_position: Json | null
          booth_size: string | null
          booth_type: Database["public"]["Enums"]["booth_type"]
          chat_enabled: boolean | null
          company_id: string
          contact_info: Json | null
          created_at: string | null
          description: string | null
          event_id: string
          id: string
          is_featured: boolean | null
          lead_count: number | null
          logo_url: string | null
          meeting_room_url: string | null
          resources: Json | null
          title: string
          updated_at: string | null
          video_enabled: boolean | null
          visitor_count: number | null
        }
        Insert: {
          banner_url?: string | null
          booth_position?: Json | null
          booth_size?: string | null
          booth_type: Database["public"]["Enums"]["booth_type"]
          chat_enabled?: boolean | null
          company_id: string
          contact_info?: Json | null
          created_at?: string | null
          description?: string | null
          event_id: string
          id?: string
          is_featured?: boolean | null
          lead_count?: number | null
          logo_url?: string | null
          meeting_room_url?: string | null
          resources?: Json | null
          title: string
          updated_at?: string | null
          video_enabled?: boolean | null
          visitor_count?: number | null
        }
        Update: {
          banner_url?: string | null
          booth_position?: Json | null
          booth_size?: string | null
          booth_type?: Database["public"]["Enums"]["booth_type"]
          chat_enabled?: boolean | null
          company_id?: string
          contact_info?: Json | null
          created_at?: string | null
          description?: string | null
          event_id?: string
          id?: string
          is_featured?: boolean | null
          lead_count?: number | null
          logo_url?: string | null
          meeting_room_url?: string | null
          resources?: Json | null
          title?: string
          updated_at?: string | null
          video_enabled?: boolean | null
          visitor_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "virtual_booths_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "virtual_events"
            referencedColumns: ["id"]
          },
        ]
      }
      virtual_event_analytics: {
        Row: {
          dimensions: Json | null
          event_id: string
          id: string
          metric_name: string
          metric_type: string
          metric_value: number
          recorded_at: string | null
        }
        Insert: {
          dimensions?: Json | null
          event_id: string
          id?: string
          metric_name: string
          metric_type: string
          metric_value: number
          recorded_at?: string | null
        }
        Update: {
          dimensions?: Json | null
          event_id?: string
          id?: string
          metric_name?: string
          metric_type?: string
          metric_value?: number
          recorded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "virtual_event_analytics_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "virtual_events"
            referencedColumns: ["id"]
          },
        ]
      }
      virtual_event_registrations: {
        Row: {
          booths_visited: string[] | null
          check_in_time: string | null
          check_out_time: string | null
          created_at: string | null
          event_id: string
          feedback: Json | null
          id: string
          networking_connections: number | null
          rating: number | null
          registration_data: Json | null
          registration_date: string | null
          session_duration: number | null
          sessions_attended: string[] | null
          status: Database["public"]["Enums"]["registration_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booths_visited?: string[] | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string | null
          event_id: string
          feedback?: Json | null
          id?: string
          networking_connections?: number | null
          rating?: number | null
          registration_data?: Json | null
          registration_date?: string | null
          session_duration?: number | null
          sessions_attended?: string[] | null
          status?: Database["public"]["Enums"]["registration_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booths_visited?: string[] | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string | null
          event_id?: string
          feedback?: Json | null
          id?: string
          networking_connections?: number | null
          rating?: number | null
          registration_data?: Json | null
          registration_date?: string | null
          session_duration?: number | null
          sessions_attended?: string[] | null
          status?: Database["public"]["Enums"]["registration_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "virtual_event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "virtual_events"
            referencedColumns: ["id"]
          },
        ]
      }
      virtual_events: {
        Row: {
          agenda: Json | null
          analytics_data: Json | null
          banner_image_url: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          end_date: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          is_public: boolean | null
          max_attendees: number | null
          meeting_id: string | null
          meeting_password: string | null
          meeting_platform: string | null
          meeting_url: string | null
          organizer_id: string
          registration_deadline: string | null
          registration_fields: Json | null
          settings: Json | null
          speakers: Json | null
          sponsors: Json | null
          start_date: string
          status: Database["public"]["Enums"]["event_status"] | null
          tags: string[] | null
          timezone: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          agenda?: Json | null
          analytics_data?: Json | null
          banner_image_url?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          end_date: string
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          is_public?: boolean | null
          max_attendees?: number | null
          meeting_id?: string | null
          meeting_password?: string | null
          meeting_platform?: string | null
          meeting_url?: string | null
          organizer_id: string
          registration_deadline?: string | null
          registration_fields?: Json | null
          settings?: Json | null
          speakers?: Json | null
          sponsors?: Json | null
          start_date: string
          status?: Database["public"]["Enums"]["event_status"] | null
          tags?: string[] | null
          timezone?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          agenda?: Json | null
          analytics_data?: Json | null
          banner_image_url?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          is_public?: boolean | null
          max_attendees?: number | null
          meeting_id?: string | null
          meeting_password?: string | null
          meeting_platform?: string | null
          meeting_url?: string | null
          organizer_id?: string
          registration_deadline?: string | null
          registration_fields?: Json | null
          settings?: Json | null
          speakers?: Json | null
          sponsors?: Json | null
          start_date?: string
          status?: Database["public"]["Enums"]["event_status"] | null
          tags?: string[] | null
          timezone?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      virtual_networking_connections: {
        Row: {
          connection_type: string | null
          created_at: string | null
          event_id: string
          id: string
          initiator_id: string
          message: string | null
          recipient_id: string
          room_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          connection_type?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          initiator_id: string
          message?: string | null
          recipient_id: string
          room_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          connection_type?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          initiator_id?: string
          message?: string | null
          recipient_id?: string
          room_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "virtual_networking_connections_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "virtual_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "virtual_networking_connections_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "networking_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_applications: {
        Row: {
          application_message: string | null
          applied_at: string
          completion_date: string | null
          hours_completed: number | null
          id: string
          opportunity_id: string
          organization_feedback: string | null
          status: string | null
          updated_at: string
          user_id: string
          volunteer_feedback: string | null
        }
        Insert: {
          application_message?: string | null
          applied_at?: string
          completion_date?: string | null
          hours_completed?: number | null
          id?: string
          opportunity_id: string
          organization_feedback?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          volunteer_feedback?: string | null
        }
        Update: {
          application_message?: string | null
          applied_at?: string
          completion_date?: string | null
          hours_completed?: number | null
          id?: string
          opportunity_id?: string
          organization_feedback?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          volunteer_feedback?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "volunteer_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_opportunities: {
        Row: {
          benefits: string | null
          category: string | null
          created_at: string
          created_by: string | null
          current_volunteers: number | null
          description: string | null
          end_date: string | null
          id: string
          is_remote: boolean | null
          location: string | null
          max_volunteers: number | null
          organization_contact_email: string | null
          organization_name: string
          requirements: string | null
          skills_required: string[] | null
          start_date: string | null
          status: string | null
          time_commitment: string | null
          title: string
          updated_at: string
        }
        Insert: {
          benefits?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          current_volunteers?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_remote?: boolean | null
          location?: string | null
          max_volunteers?: number | null
          organization_contact_email?: string | null
          organization_name: string
          requirements?: string | null
          skills_required?: string[] | null
          start_date?: string | null
          status?: string | null
          time_commitment?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          benefits?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          current_volunteers?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_remote?: boolean | null
          location?: string | null
          max_volunteers?: number | null
          organization_contact_email?: string | null
          organization_name?: string
          requirements?: string | null
          skills_required?: string[] | null
          start_date?: string | null
          status?: string | null
          time_commitment?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      youth_development_programs: {
        Row: {
          age_group: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          focus_area: string
          id: string
          is_active: boolean | null
          organizer: string
          program_name: string
          program_url: string | null
          start_date: string | null
        }
        Insert: {
          age_group?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          focus_area: string
          id?: string
          is_active?: boolean | null
          organizer: string
          program_name: string
          program_url?: string | null
          start_date?: string | null
        }
        Update: {
          age_group?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          focus_area?: string
          id?: string
          is_active?: boolean | null
          organizer?: string
          program_name?: string
          program_url?: string | null
          start_date?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      resume_view: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string | null
          is_public: boolean | null
          template_id: string | null
          theme: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_group_trending_score: {
        Args: { group_id_param: string; days_back?: number }
        Returns: number
      }
      get_advisors_with_session_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          user_id: string
          specialization: string
          bio: string
          availability: Json
          is_active: boolean
          created_at: string
          updated_at: string
          session_counts: Json
        }[]
      }
      get_camps_with_counts: {
        Args: { institution_id?: string }
        Returns: {
          id: string
          title: string
          description: string
          organizer: string
          category: string
          age_group: string
          location: string
          start_date: string
          end_date: string
          duration: string
          price: number
          capacity: number
          enrolled: number
          image_url: string
          tags: string[]
          created_at: string
          updated_at: string
          created_by: string
          status: string
          currency: string
          max_participants: number
          registration_deadline: string
          rating: number
          enrollment_counts: Json
        }[]
      }
      get_scholarships_with_counts: {
        Args: { provider_id?: string }
        Returns: {
          id: string
          title: string
          description: string
          provider: string
          provider_type: string
          eligibility_criteria: Json
          amount: number
          currency: string
          application_deadline: string
          requirements: string[]
          contact_email: string
          contact_phone: string
          website_url: string
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string
          application_counts: Json
        }[]
      }
      get_table_columns: {
        Args: { table_name: string }
        Returns: {
          column_name: string
          data_type: string
        }[]
      }
      get_user_assessment_performance: {
        Args: { target_user_id: string }
        Returns: {
          assessment_id: string
          assessment_title: string
          session_count: number
          average_score: number
          latest_session_date: string
          coaching_recommended_count: number
        }[]
      }
      has_role: {
        Args: {
          user_id: string
          required_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: { target_user_id?: string }
        Returns: boolean
      }
      is_training_center_staff: {
        Args: { target_user_id?: string }
        Returns: boolean
      }
      update_daily_group_metrics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      verify_rls_configuration: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
          rls_enabled: boolean
          policy_count: number
        }[]
      }
    }
    Enums: {
      application_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "completed"
        | "cancelled"
      assessment_type: "skills" | "behaviors" | "capabilities"
      booth_type:
        | "company"
        | "university"
        | "government"
        | "training_center"
        | "startup"
      certificate_status: "pending" | "issued" | "revoked"
      course_status: "draft" | "published" | "archived"
      credential_type:
        | "certification"
        | "degree"
        | "skill_badge"
        | "completion_certificate"
      enrollment_status: "active" | "completed" | "dropped" | "suspended"
      event_status: "draft" | "published" | "live" | "completed" | "cancelled"
      event_type:
        | "career_fair"
        | "job_expo"
        | "networking_event"
        | "workshop"
        | "webinar"
        | "conference"
      lesson_type: "video" | "text" | "quiz" | "assignment" | "interactive"
      mentorship_status:
        | "requested"
        | "accepted"
        | "active"
        | "completed"
        | "cancelled"
      opportunity_type:
        | "skill_exchange"
        | "project_based"
        | "consultation"
        | "mentoring"
      project_status: "open" | "in_progress" | "completed" | "cancelled"
      registration_status:
        | "registered"
        | "confirmed"
        | "attended"
        | "no_show"
        | "cancelled"
      skill_level: "beginner" | "intermediate" | "advanced" | "expert"
      training_category:
        | "technical_skills"
        | "trade_skills"
        | "service_skills"
        | "entrepreneurship_business"
      training_mode: "in_person" | "online" | "hybrid"
      training_status: "draft" | "active" | "full" | "completed" | "cancelled"
      user_role:
        | "school_student"
        | "national_service_participant"
        | "university_student"
        | "intern"
        | "full_time_employee"
        | "part_time_employee"
        | "gig_worker"
        | "jobseeker"
        | "lifelong_learner"
        | "entrepreneur"
        | "retiree"
        | "educational_institution"
        | "parent"
        | "private_sector_recruiter"
        | "government_representative"
        | "retiree_advocate"
        | "training_center"
        | "assessment_center"
        | "mentor"
        | "career_advisor"
        | "administrator"
        | "super_user"
        | "platform_operator"
      verification_status: "verified" | "pending" | "revoked"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      application_status: [
        "pending",
        "accepted",
        "rejected",
        "completed",
        "cancelled",
      ],
      assessment_type: ["skills", "behaviors", "capabilities"],
      booth_type: [
        "company",
        "university",
        "government",
        "training_center",
        "startup",
      ],
      certificate_status: ["pending", "issued", "revoked"],
      course_status: ["draft", "published", "archived"],
      credential_type: [
        "certification",
        "degree",
        "skill_badge",
        "completion_certificate",
      ],
      enrollment_status: ["active", "completed", "dropped", "suspended"],
      event_status: ["draft", "published", "live", "completed", "cancelled"],
      event_type: [
        "career_fair",
        "job_expo",
        "networking_event",
        "workshop",
        "webinar",
        "conference",
      ],
      lesson_type: ["video", "text", "quiz", "assignment", "interactive"],
      mentorship_status: [
        "requested",
        "accepted",
        "active",
        "completed",
        "cancelled",
      ],
      opportunity_type: [
        "skill_exchange",
        "project_based",
        "consultation",
        "mentoring",
      ],
      project_status: ["open", "in_progress", "completed", "cancelled"],
      registration_status: [
        "registered",
        "confirmed",
        "attended",
        "no_show",
        "cancelled",
      ],
      skill_level: ["beginner", "intermediate", "advanced", "expert"],
      training_category: [
        "technical_skills",
        "trade_skills",
        "service_skills",
        "entrepreneurship_business",
      ],
      training_mode: ["in_person", "online", "hybrid"],
      training_status: ["draft", "active", "full", "completed", "cancelled"],
      user_role: [
        "school_student",
        "national_service_participant",
        "university_student",
        "intern",
        "full_time_employee",
        "part_time_employee",
        "gig_worker",
        "jobseeker",
        "lifelong_learner",
        "entrepreneur",
        "retiree",
        "educational_institution",
        "parent",
        "private_sector_recruiter",
        "government_representative",
        "retiree_advocate",
        "training_center",
        "assessment_center",
        "mentor",
        "career_advisor",
        "administrator",
        "super_user",
        "platform_operator",
      ],
      verification_status: ["verified", "pending", "revoked"],
    },
  },
} as const
