const LEADS_TO_EMAIL = process.env.LEADS_TO_EMAIL || "info@qualityhome.com";

export type LeadEmailPayload = {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  source?: string;
  projectType?: string;
  notes?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildLeadEmail(lead: LeadEmailPayload) {
  const subject = `New website enquiry from ${lead.name}`;
  const rows = [
    ["Name", lead.name],
    ["Email", lead.email],
    ["Phone", lead.phone || "—"],
    ["Project type", lead.projectType || "—"],
    ["Source", lead.source || "Website Enquiry"],
    ["Message", lead.message || "—"],
  ];
  const html = `
    <div style="font-family:Arial,sans-serif;color:#1F2A54;line-height:1.5">
      <h2 style="margin:0 0 16px">New Quality Home Group enquiry</h2>
      <table style="border-collapse:collapse;width:100%;max-width:560px">
        ${rows
          .map(
            ([label, value]) => `
          <tr>
            <td style="padding:8px 0;width:140px;font-weight:bold;vertical-align:top">${escapeHtml(label)}</td>
            <td style="padding:8px 0;white-space:pre-wrap">${escapeHtml(String(value))}</td>
          </tr>`
          )
          .join("")}
      </table>
    </div>
  `;
  const text = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
  return { subject, html, text };
}

async function sendViaResend(lead: LeadEmailPayload, content: ReturnType<typeof buildLeadEmail>) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || process.env.LEADS_FROM_EMAIL;
  if (!apiKey || !from) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [LEADS_TO_EMAIL],
      reply_to: lead.email,
      subject: content.subject,
      html: content.html,
      text: content.text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend failed (${response.status}): ${body}`);
  }
  return true;
}

/** Notify the office mailbox. Never throw — lead save should still succeed. */
export async function sendLeadNotification(lead: LeadEmailPayload): Promise<void> {
  const content = buildLeadEmail(lead);
  try {
    const sent = await sendViaResend(lead, content);
    if (!sent) {
      console.warn("[lead-email] No mail provider configured; skipped send to", LEADS_TO_EMAIL);
    }
  } catch (error) {
    console.error("[lead-email] Failed to email enquiry to", LEADS_TO_EMAIL, error);
  }
}
