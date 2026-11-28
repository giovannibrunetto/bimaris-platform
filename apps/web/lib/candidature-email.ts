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
    const result = await transport.sendMail({
      from: { name: "BIMARIS · Candidature", address: sender },
      to: { name: "", address: to },
      subject: "BIMARIS — La tua candidatura è stata accettata",
      text: `${message}\n\nAccedi all’Area Operatore\n${accessUrl.href}`,
      html: `<p>${escapeHtml(message)}</p><p><a href="${escapeHtml(accessUrl.href)}">Accedi all’Area Operatore</a></p>`,
    });
    if (result.accepted.length !== 1) throw new Error("SMTP recipient not accepted");
    console.info("BIMARIS candidature email accepted by Aruba SMTP");
  } catch (error) {
    const code = (error as { code?: unknown } | null)?.code;
    console.warn("BIMARIS candidature SMTP failure", typeof code === "string" && /^[A-Z0-9_]{1,30}$/.test(code) ? code : "UNKNOWN");
    throw new Error("Invio SMTP della conferma di candidatura non riuscito");
  } finally {
    transport.close();
  }
}
