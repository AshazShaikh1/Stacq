import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Error: Environment variables missing from .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function audit() {
  console.log("--- DATABASE SCHEMA AUDIT ---");

  // 1. Audit Profiles
  const { data: profileCols, error: pError } = await supabase
    .from("profiles")
    .select("*")
    .limit(1);
  if (pError) console.error("Profiles Table Error:", pError.message);
  else console.log("Profiles columns:", Object.keys(profileCols[0] || {}));

  // 2. Audit Resources
  const { data: resourceCols, error: rError } = await supabase
    .from("resources")
    .select("*")
    .limit(1);
  if (rError) console.error("Resources Table Error:", rError.message);
  else console.log("Resources columns:", Object.keys(resourceCols[0] || {}));

  console.log("---------------------------");
}

audit();
