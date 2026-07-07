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
          created_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          full_name?: string;
          national_id?: string | null;
          phone?: string | null;
          email?: string | null;
          weekly_quota?: number;
          created_at?: string;
        };
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
    };
  };
}
