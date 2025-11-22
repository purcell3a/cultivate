import { neon } from "@neondatabase/serverless"

// Use the NEON_DATABASE_URL from the environment variables
const sql = neon(process.env.NEON_DATABASE_URL!)

export { sql }

// Export query helper function for compatibility
export async function query(text: string, params?: any[]) {
  // Note: This function is for compatibility but neon prefers template literals
  // Consider using sql`...` directly in your code instead
  return sql([text] as any as TemplateStringsArray, ...(params || []));
}