/**
 * Admin activity logging. Extend to send to external service or Firestore.
 */

export function logAdminAction(action: string, uid: string, details?: Record<string, unknown>) {
  const payload = { action, uid, at: new Date().toISOString(), ...details };
  if (process.env.NODE_ENV !== "production") {
    console.log("[Admin]", payload);
  }
  // Optional: write to Firestore admin_activity collection or external logger
}
