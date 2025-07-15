import nodemailer from 'nodemailer';
import crypto from 'crypto';

interface SendEmailParams {
  to: string;
  subject: string;
  text?: string;
  code: string;
}

export async function sendEmailVerification({ to, subject, text, code }: SendEmailParams) {
  const transporter = nodemailer.createTransport({
    host: "smtp.eddi.com.au",
    port: 587,
    secure: false,
    auth: {
        // TODO: Change to env variables and add proper email address to .env
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
  });

  await transporter.sendMail({
    from: '"Eddi" <no-reply@eddi.com>',
    to,
    subject,
    text,
    html: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Verify your account</title>
    <style>
      .container {
        max-width: 420px;
        margin: 40px auto;
        padding: 32px 24px;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
        color: #22223b;
        text-align: center;
      }
      .header {
        font-size: 1.35rem;
        font-weight: 600;
        margin-bottom: 24px;
        color:rgb(210, 90, 60);
      }
      .code-box {
        display: inline-block;
        background: #fff;
        border-radius: 10px;
        border: 2px solid rgb(210, 90, 60);
        padding: 24px 40px;
        margin: 16px 0 24px 0;
      }
      .code {
        font-size: 2.5rem;
        font-weight: bold;
        letter-spacing: 0.25em;
        color:rgb(210, 90, 60);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
      }
      .footer {
        margin-top: 32px;
        font-size: 0.95rem;
        color: #6b7280;
      }
      @media (max-width: 500px) {
        .container { padding: 16px 4px; }
        .code-box { padding: 16px 8px; }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">Verify your account with the code below</div>
      <div class="code-box">
        <span class="code">${code}</span>
      </div>
      <div>
        Enter this code in the Eddi app to complete your registration.
      </div>
      <div class="footer">
        If you did not request this, you can safely ignore this email.<br>
        &mdash; The Eddi Team
      </div>
    </div>
  </body>
</html>`
    });
}

// Generates a secure random 6-digit numeric code as a string
export function generateVerificationCode(): string {
  const array = new Uint32Array(1);
  if (typeof window === 'undefined') {
    const { randomInt } = crypto;
    return String(randomInt(100000, 1000000));
  } else {
    window.crypto.getRandomValues(array);
    return String(array[0] % 900000 + 100000);
  }
}