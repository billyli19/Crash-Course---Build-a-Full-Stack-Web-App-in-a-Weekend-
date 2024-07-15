import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://mweineworaaosfqkfntv.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13ZWluZXdvcmFhb3NmcWtmbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjA3MTY3ODUsImV4cCI6MjAzNjI5Mjc4NX0.MsakRk-fjcGamUtqQUjdWY9eoMHzvLX3lSE7UY5YLFA";
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
