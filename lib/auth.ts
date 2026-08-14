import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "quality-home-group-cms-secret-key-2024-secure"
);

// Admin credentials - In production, these should be in environment variables
export const ADMIN_CREDENTIALS = {
  email: "admin@qualityhomegroup.com",
  // Password: Admin@123
  passwordHash: "$2a$10$rQnM1jK5xKjK5xKjK5xKjOeY5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5",
  plainPassword: "Admin@123", // For display purposes only
};

export interface SessionPayload {
  email: string;
  role: string;
  expiresAt: Date;
}

export async function createSession(email: string): Promise<string> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const session = await new SignJWT({ email, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);

  const cookieStore = await cookies();
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });

  return session;
}

export async function verifySession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;

  if (!session) return null;

  try {
    const { payload } = await jwtVerify(session, SECRET_KEY, {
      algorithms: ["HS256"],
    });

    return {
      email: payload.email as string,
      role: payload.role as string,
      expiresAt: new Date((payload.exp as number) * 1000),
    };
  } catch {
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export function verifyPassword(inputPassword: string): boolean {
  // Simple password check - in production use bcrypt
  return inputPassword === ADMIN_CREDENTIALS.plainPassword;
}
