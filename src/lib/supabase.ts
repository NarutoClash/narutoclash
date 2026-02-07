import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type News = {
  id: string
  title: string
  content: string
  author: string | null
  created_at: string
  published: boolean
  image_url: string | null
  is_update: boolean
}