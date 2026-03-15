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
      restaurants: {
        Row: {
          id: string
          name: string
          description: string
          cuisine_type: string
          school: string
          address: string
          distance_km: number
          avg_price: number
          phone: string
          hours: string
          image_url: string
          rating: number
          review_count: number
          is_new: boolean
          is_late_night: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          cuisine_type: string
          school: string
          address: string
          distance_km?: number
          avg_price?: number
          phone?: string
          hours?: string
          image_url?: string
          rating?: number
          review_count?: number
          is_new?: boolean
          is_late_night?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          cuisine_type?: string
          school?: string
          address?: string
          distance_km?: number
          avg_price?: number
          phone?: string
          hours?: string
          image_url?: string
          rating?: number
          review_count?: number
          is_new?: boolean
          is_late_night?: boolean
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          restaurant_id: string
          user_name: string
          rating: number
          content: string
          images: string[]
          helpful_count: number
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          user_name: string
          rating: number
          content: string
          images?: string[]
          helpful_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          user_name?: string
          rating?: number
          content?: string
          images?: string[]
          helpful_count?: number
          created_at?: string
        }
      }
      menu_items: {
        Row: {
          id: string
          restaurant_id: string
          name: string
          price: number
          description: string
          image_url: string
          is_recommended: boolean
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          name: string
          price?: number
          description?: string
          image_url?: string
          is_recommended?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          name?: string
          price?: number
          description?: string
          image_url?: string
          is_recommended?: boolean
          created_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_session: string
          restaurant_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_session: string
          restaurant_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_session?: string
          restaurant_id?: string
          created_at?: string
        }
      }
    }
  }
}

export type Restaurant = Database['public']['Tables']['restaurants']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
export type MenuItem = Database['public']['Tables']['menu_items']['Row']
export type Favorite = Database['public']['Tables']['favorites']['Row']
