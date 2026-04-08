import { createTransport, type Transporter } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

import { getServerEnv, hasTransactionalEmail } from "@/lib/env";

type OutboundEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

let transport: Transporter | null = null;

function getTransport() {
  if (transport) {
    return transport;
  }

  const env = getServerEnv();

  if (!hasTransactionalEmail(env)) {
    throw new Error("Transactional email is not configured.");
  }

  const options: SMTPTransport.Options = {
    host: env.smtpHost!,
    port: env.smtpPort!,
    secure: env.smtpPort === 465,
    auth: {
      user: env.smtpUser!,
      pass: env.smtpPassword!,
    },
  };

  transport = createTransport(options);

  return transport;
}

export async function sendTransactionalEmail(input: OutboundEmail) {
  const env = getServerEnv();
  const transporter = getTransport();

  await transporter.sendMail({
    from: env.smtpFrom!,
    to: input.to,
    replyTo: env.supportEmail ?? env.smtpFrom!,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}
