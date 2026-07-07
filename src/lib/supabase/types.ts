export type UserRole = "owner" | "admin";

export interface Database {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: UserRole;
          school_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role: UserRole;
          school_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: UserRole;
          school_id?: string | null;
          created_at?: string;
        };
      };
      subjects: {
        Row: {
          id: string;
          school_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      classes: {
        Row: {
          id: string;
          school_id: string;
          grade: string;
          section: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          grade: string;
          section: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          grade?: string;
          section?: string;
          created_at?: string;
        };
      };
      teachers: {
        Row: {
          id: string;
          school_id: string;
          full_name: string;
          national_id: string | null;
          phone: string | null;
          email: string | null;
          weekly_quota: number;
          substitute_limit: number | null;
          substitute_period: string | null;
          duty_limit: number | null;
          duty_period: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          full_name: string;
          national_id?: string | null;
          phone?: string | null;
          email?: string | null;
          weekly_quota?: number;
          substitute_limit?: number | null;
          substitute_period?: string | null;
          duty_limit?: number | null;
          duty_period?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["teachers"]["Insert"]>;
      };
      assignments: {
        Row: {
          id: string;
          school_id: string;
          teacher_id: string;
          subject_id: string;
          class_id: string;
          weekly_hours: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          teacher_id: string;
          subject_id: string;
          class_id: string;
          weekly_hours?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          teacher_id?: string;
          subject_id?: string;
          class_id?: string;
          weekly_hours?: number;
          created_at?: string;
        };
      };
      stages: {
        Row: {
          id: string;
          school_id: string;
          name: string;
          section_type: string;
          periods_per_day: number;
          friday_periods: number;
          working_days: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          name: string;
          section_type: string;
          periods_per_day?: number;
          friday_periods?: number;
          working_days?: string[];
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["stages"]["Insert"]>;
      };
      grades: {
        Row: {
          id: string;
          stage_id: string;
          school_id: string;
          grade_number: number;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          stage_id: string;
          school_id: string;
          grade_number: number;
          name: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["grades"]["Insert"]>;
      };
      sections: {
        Row: {
          id: string;
          grade_id: string;
          school_id: string;
          code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          grade_id: string;
          school_id: string;
          code: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sections"]["Insert"]>;
      };
      breaks: {
        Row: {
          id: string;
          stage_id: string;
          school_id: string;
          name: string;
          after_period: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          stage_id: string;
          school_id: string;
          name: string;
          after_period: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["breaks"]["Insert"]>;
      };
      duty_types: {
        Row: { id: string; school_id: string; name: string; created_at: string };
        Insert: { id?: string; school_id: string; name: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["duty_types"]["Insert"]>;
      };
      teacher_subjects: {
        Row: { id: string; teacher_id: string; subject_id: string; school_id: string };
        Insert: { id?: string; teacher_id: string; subject_id: string; school_id: string };
        Update: Partial<Database["public"]["Tables"]["teacher_subjects"]["Insert"]>;
      };
      teacher_duties: {
        Row: { id: string; teacher_id: string; duty_type_id: string; school_id: string };
        Insert: {
          id?: string;
          teacher_id: string;
          duty_type_id: string;
          school_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["teacher_duties"]["Insert"]>;
      };
      teacher_schedule: {
        Row: {
          id: string;
          teacher_id: string;
          school_id: string;
          day: string;
          period_number: number;
          section_id: string | null;
          subject_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          school_id: string;
          day: string;
          period_number: number;
          section_id?: string | null;
          subject_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["teacher_schedule"]["Insert"]>;
      };
    };
  };
}
