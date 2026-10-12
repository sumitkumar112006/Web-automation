import { resend } from "@/lib/resend";

export async function sendEmail({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}) {
  const recipients = to.includes(",")
    ? to.split(",").map((s) => s.trim()).filter(Boolean)
    : to;

  const { data, error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: recipients,
    subject,
    text: body,
    html: body.includes("<") && body.includes(">") ? body : body.replace(/\n/g, "<br/>"),
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: data?.id ?? "",
  };
}
