import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

export default sql;

// Initialize database tables
export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      clerk_id TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      image_url TEXT,
      subscription_tier TEXT DEFAULT 'free',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS recipes (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      cuisine TEXT,
      category TEXT,
      ingredients JSONB,
      instructions JSONB,
      prep_time INT,
      cook_time INT,
      servings INT,
      nutrition JSONB,
      tips JSONB,
      substitutions JSONB,
      image_url TEXT,
      is_public BOOLEAN DEFAULT true,
      author_id INT REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS saved_recipes (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id),
      recipe_id INT REFERENCES recipes(id),
      saved_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, recipe_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS pantry_items (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      quantity TEXT,
      owner_id INT REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
}