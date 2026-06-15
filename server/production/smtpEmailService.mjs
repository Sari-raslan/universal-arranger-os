import nodemailer from "nodemailer";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buildVerificationUrl(baseUrl, token) {
  const url = new URL("/#/account/verify", baseUrl);
  url.searchParams.set("token", token);
  return url.toString();
}

export function buildPasswordResetUrl(baseUrl, token) {
  const url = new URL("/#/account/reset", baseUrl);
  url.searchParams.set("token", token);
  return url.toString();
}

export function createSmtpEmailService(config, transport = null) {
  const client = transport || nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPassword,
    },
  });

  return {
    async verifyConnection() {
      return client.verify();
    },

    async sendVerificationEmail({ email, token }) {
      const link = buildVerificationUrl(
        config.publicBaseUrl,
        token,
      );

      return client.sendMail({
        from: config.smtpFrom,
        to: email,
        subject: "Verify your UAOS account",
        text: [
          "Verify your UAOS account:",
          link,
          "",
          "This link expires in 24 hours.",
          `Support: ${config.supportEmail}`,
        ].join("\n"),
        html: `
          <h1>Verify your UAOS account</h1>
          <p>
            <a href="${escapeHtml(link)}">Verify email address</a>
          </p>
          <p>This link expires in 24 hours.</p>
          <p>Support: ${escapeHtml(config.supportEmail)}</p>
        `,
      });
    },

    async sendPasswordResetEmail({ email, token }) {
      const link = buildPasswordResetUrl(
        config.publicBaseUrl,
        token,
      );

      return client.sendMail({
        from: config.smtpFrom,
        to: email,
        subject: "Reset your UAOS password",
        text: [
          "Reset your UAOS password:",
          link,
          "",
          "This link expires in one hour.",
          `Support: ${config.supportEmail}`,
        ].join("\n"),
        html: `
          <h1>Reset your UAOS password</h1>
          <p>
            <a href="${escapeHtml(link)}">Choose a new password</a>
          </p>
          <p>This link expires in one hour.</p>
          <p>Support: ${escapeHtml(config.supportEmail)}</p>
        `,
      });
    },
  };
}