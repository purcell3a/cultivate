import { neon } from "@neondatabase/serverless"

// Use the NEON_DATABASE_URL from the environment variables
const sql = neon(process.env.NEON_DATABASE_URL!)

export { sql }
