import "server-only";
import nodemailer from "nodemailer";

const sender = "candidature@bimarisnet.it";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[character] ?? character));
}

export async function sendCandidatureAccessEmail(
  to: string,
  businessName: string,
  accessUrl: URL,
  password: string,
) {
  const transport = nodemailer.createTransport({
    host: "smtps.aruba.it",
    port: 465,
    secure: true,
    auth: { user: sender, pass: password },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });
  const message = `La candidatura di ${businessName} è stata accettata. Accedi all’Area Operatore per gestire la tua attività su BIMARIS.`;
  try {
    await transport.sendMail({
      from: { name: "BIMARIS · Candidature", address: sender },
      to: { name: "", address: to },
      subject: "BIMARIS — La tua candidatura è stata accettata",
      text: `${message}\n\nAccedi all’Area Operatore\n${accessUrl.href}`,
      html: `<p>${escapeHtml(message)}</p><p><a href="${escapeHtml(accessUrl.href)}">Accedi all’Area Operatore</a></p>`,
    });
  } catch {
    throw new Error("Invio SMTP della conferma di candidatura non riuscito");
  } finally {
    transport.close();
  }
}
