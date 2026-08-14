/**
 * POST /api/v1/contact - Contact form submission (unified with enquiry).
 * Rate limited. Accepts same schema as /api/enquiry for backward compatibility.
 */

import { NextResponse } from "next/server";
import { adminAddLead } from "@/lib/firestore-admin";
import { contactSubmissionSchema } from "@/lib/api/schemas";
import { rateLimit } from "@/lib/api/rate-limit";
import { sanitizeString } from "@/lib/api/sanitize";

const RATE_LIMIT = { windowMs: 60_000, maxRequests: 10 };

export async function POST(request: Request) {
  const rateLimited = rateLimit(request, "v1-contact", RATE_LIMIT);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const parsed = contactSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { name, email, phone, message, source, projectType, newsletter } = parsed.data;
    const notes = [
      projectType && `Project Type: ${sanitizeString(projectType, 200)}`,
      message && `Message: ${sanitizeString(message, 2000)}`,
      newsletter && "Subscribed to newsletter",
    ]
      .filter(Boolean)
      .join(" | ") || "—";

    const leadId = await adminAddLead({
      name: sanitizeString(name, 200),
      email: sanitizeString(email, 320),
      phone: sanitizeString(phone ?? "", 50),
      message: message ? sanitizeString(message, 5000) : "",
      source: source ? sanitizeString(source, 100) : "Website Enquiry",
      status: "new",
      notes,
    });

    return NextResponse.json({ data: { id: leadId } }, { status: 201 });
  } catch (err) {
    console.error("Contact submission error:", err);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
