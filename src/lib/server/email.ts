import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { env } from '$env/dynamic/private';

if (!env.EMAIL_HOST) throw new Error('EMAIL_HOST is not set');
if (!env.EMAIL_USER) throw new Error('EMAIL_USER is not set');
if (!env.EMAIL_PASS) throw new Error('EMAIL_PASS is not set');

const transporter = nodemailer.createTransport({
	host: process.env.EMAIL_HOST,
	port: 587,
	secure: false,
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS
	}
});

interface SendEmailParams {
	to: string;
	subject: string;
	text: string;
	html: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailParams) {
	await transporter.sendMail({
		from: '',
		to,
		subject,
		text,
		html
	});
}

function generateVerificationCode(): string {
	const array = new Uint32Array(1);
	if (typeof window === 'undefined') {
		const { randomInt } = crypto;
		return String(randomInt(100000, 1000000));
	} else {
		window.crypto.getRandomValues(array);
		return String((array[0] % 900000) + 100000);
	}
}

export async function sendEmailVerification(to: string): Promise<string> {
	const code = generateVerificationCode();

	await transporter.sendMail({
		from: '"eddi" <no-reply@eddi.com>',
		to,
		subject: 'Your verification code',
		text: `Your code is: ${code}`,
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
        Enter this code in the eddi app to complete your registration.
      </div>
      <div class="footer">
        If you did not request this, you can safely ignore this email.<br>
        &mdash; The eddi Team
      </div>
    </div>
  </body>
</html>`
	});

	return code;
}

export async function sendAbsenceEmail(
	to: string,
	studentName: string,
	className: string,
	date: Date
) {
	const formattedDate = date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	});

	await sendEmail({
		to,
		subject: `Absence Notification for ${studentName}`,
		text: `Dear Guardian,\n\nThis is to inform you that your child, ${studentName}, was absent from class ${className} on ${formattedDate}.\n\nBest regards,\nThe eddi Team`,
		html: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Absence Notification</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        color: #333;
        line-height: 1.6;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f9f9f9;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .header {
        font-size: 1.5rem;
        font-weight: bold;
        color: #d25a3c;
        margin-bottom: 20px;
      }
      .content {
        font-size: 1rem;
      }
      .footer {
        margin-top: 20px;
        font-size: 0.9rem;
        color: #666;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">Absence Notification for ${studentName}</div>
      <div class="content">
        <p>Dear Guardian,</p>
        <p>This is to inform you that your child, <strong>${studentName}</strong>, was absent from class <strong>${className}</strong> on <strong>${formattedDate}</strong>.</p>
        <p>Best regards,<br>The eddi Team</p>
      </div>
      <div class="footer">
        <p>If you have any questions, feel free to contact us.</p>
      </div>
    </div>
  </body>
</html>`
	});
}
