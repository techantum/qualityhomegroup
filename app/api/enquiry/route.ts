import { NextResponse } from "next/server";
import { adminAddLead } from "@/lib/firestore-admin";
import { contactSubmissionSchema } from "@/lib/api/schemas";
import { rateLimit } from "@/lib/api/rate-limit";
import { sanitizeString } from "@/lib/api/sanitize";

/** Rate limit: 10 submissions per IP per minute */
const RATE_LIMIT = { windowMs: 60_000, maxRequests: 10 };

export async function POST(request: Request) {
  const rateLimited = rateLimit(request, "enquiry", RATE_LIMIT);
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

    // Backward compatibility: require name and email; phone and projectType optional (contact form sends message)
    const phoneVal = phone ?? "";
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
      phone: sanitizeString(phoneVal, 50),
      message: message ? sanitizeString(message, 5000) : "",
      source: source ? sanitizeString(source, 100) : "Website Enquiry",
      status: "new",
      notes,
    });

    return NextResponse.json({ success: true, leadId }, { status: 200 });
  } catch (error) {
    console.error("Error submitting enquiry:", error);
    return NextResponse.json(
      { error: "Failed to submit enquiry" },
      { status: 500 }
    );
  }
}
