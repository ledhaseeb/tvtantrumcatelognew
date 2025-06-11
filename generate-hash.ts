import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Generate hash for admin password
async function main() {
  const adminPassword = "admin123";
  const hash = await hashPassword(adminPassword);
  console.log(`Hash for '${adminPassword}': ${hash}`);
}

main().catch(console.error);