import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local", quiet: true });

const url = new URL(process.env.STORAGE_POSTGRES_URL);
url.searchParams.delete("sslmode");
const pool = new pg.Pool({ connectionString: url.toString(), max: 2, ssl: { rejectUnauthorized: false } });

try {
  const email = "roshingel.dev@gmail.com";
  console.log(`Promoting user ${email}...`);
  await pool.query(
    "UPDATE app.account SET is_staff = true, is_superuser = true WHERE email = $1",
    [email]
  );
  const result = await pool.query(
    "SELECT id, username, email, is_staff, is_superuser FROM app.account WHERE email = $1",
    [email]
  );
  console.log("Account successfully updated:", result.rows);
} catch (err) {
  console.error("Error promoting account:", err);
} finally {
  await pool.end();
}
