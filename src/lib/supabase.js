import { createClient } from '@supabase/supabase-js'

const SUPA_URL = 'https://psnxhhqenhtdmmmlcqvj.supabase.co'
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzbnhoaHFlbmh0ZG1tbWxjcXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4NjIyMDIsImV4cCI6MjEwMjQzODIwMn0.erqOFxV4ITixqnuCO_LX06Oa0S3IX9VUsREQgA7KP4c'

export const supabase = createClient(SUPA_URL, SUPA_KEY, {
  auth: { persistSession: true, autoRefreshToken: true }
})

export const OCR_ENDPOINT = 'https://1c01-103-130-18-160.ngrok-free.app'
