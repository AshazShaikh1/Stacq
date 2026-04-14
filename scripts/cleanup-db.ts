import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing from .env.local",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanup() {
  console.log("--- PURGING MOCK DATA ---");

  // 1. Delete stacqs with known test titles
  const { data, error } = await supabase
    .from("stacqs")
    .delete()
    .or("title.ilike.%Playwright%,title.ilike.%Test%")
    .select("title");

  if (error) {
    console.error("Database Error:", error.message);
  } else {
    console.log(`Successfully deleted ${data?.length || 0} mock collections:`);
    data?.forEach((s) => console.log(` - Removed: ${s.title}`));
  }

  console.log("--- CLEANUP COMPLETE ---");
}

cleanup();
