import nodemailer from 'nodemailer';
import { z } from 'zod';

const PROPERTY = {
  title: 'Departamento con terraza en General Jofré',
  address: 'Gral. Jofré 67, Santiago, Región Metropolitana',
};

// ── Validación ───────────────────────────────────────────────────────────
const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(200),
  message: z.string().min(10).max(2000),
  website: z.string().optional(), // honeypot
});

// ── Rate limiting en memoria ────────────────────────────────────────────
// Nota: en funciones serverless de Vercel no se garantiza estado entre
// invocaciones, pero alcanza para el tráfico bajo esperado (QR en conserjería).
const rateLimitMap = new Map();
const MAX_REQUESTS = 3;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutos

function isRateLimited(ip) {
  const now = Date.now();
  const bucket = rateLimitMap.get(ip);

  if (!bucket || now > bucket.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (bucket.count >= MAX_REQUESTS) return true;

  bucket.count++;
  return false;
}

// ── Email HTML ───────────────────────────────────────────────────────────
function buildEmailHtml({ name, email, message }) {
  const safeMessage = message.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Confirmación de contacto</title>
</head>
<body style="margin:0;padding:0;background:#eaf7fd;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
         style="max-width:600px;margin:40px auto 20px;">
    <tr>
      <td style="background:#17a2e8;padding:28px 36px;border-radius:12px 12px 0 0;">
        <p style="margin:0;color:#fff;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;">
          Propiedad en arriendo
        </p>
        <h1 style="margin:6px 0 0;color:#fff;font-size:22px;font-weight:600;line-height:1.3;">
          ${PROPERTY.title}
        </h1>
      </td>
    </tr>
    <tr>
      <td style="background:#fff;padding:36px;border-radius:0 0 12px 12px;
                 box-shadow:0 4px 16px rgba(0,0,0,0.08);">

        <p style="margin:0 0 16px;color:#0b2a3d;font-size:16px;">
          Hola <strong>${name}</strong>,
        </p>
        <p style="margin:0 0 28px;color:#4d7086;font-size:15px;line-height:1.6;">
          Hemos recibido tu mensaje. Te contactaremos a la brevedad.
        </p>

        <div style="background:#eaf7fd;border-radius:8px;padding:22px 24px;margin-bottom:28px;">
          <p style="margin:0 0 16px;color:#0b2a3d;font-size:12px;font-weight:700;
                    text-transform:uppercase;letter-spacing:0.08em;">
            Tu consulta
          </p>

          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #d6ecf7;
                         color:#4d7086;font-size:13px;width:120px;">Nombre</td>
              <td style="padding:8px 0;border-bottom:1px solid #d6ecf7;
                         color:#0b2a3d;font-size:13px;font-weight:500;">${name}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #d6ecf7;
                         color:#4d7086;font-size:13px;">Correo</td>
              <td style="padding:8px 0;border-bottom:1px solid #d6ecf7;
                         color:#0b2a3d;font-size:13px;font-weight:500;">${email}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding:12px 0 0;">
                <span style="display:block;color:#4d7086;font-size:13px;margin-bottom:8px;">
                  Mensaje
                </span>
                <p style="margin:0;color:#0b2a3d;font-size:14px;line-height:1.6;
                           white-space:pre-wrap;">${safeMessage}</p>
              </td>
            </tr>
          </table>
        </div>

        <p style="margin:0;color:#8fa9b8;font-size:13px;line-height:1.6;">
          Si tienes alguna consulta adicional, puedes responder directamente a este correo.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 0;text-align:center;">
        <p style="margin:0;color:#a9c8d8;font-size:11px;">
          ${PROPERTY.address}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Handler (Vercel Node.js serverless function) ──────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Método no permitido.' });
  }

  const ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  if (isRateLimited(ip)) {
    return res.status(429).json({ ok: false, error: 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.' });
  }

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Datos inválidos.', details: parsed.error.flatten() });
  }

  const { name, email, message, website } = parsed.data;

  // Honeypot: el campo "website" solo lo rellena un bot
  if (website) {
    return res.status(200).json({ ok: true });
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: `"${PROPERTY.title}" <${process.env.GMAIL_USER}>`,
      to: email,
      bcc: process.env.OWNER_EMAIL,
      replyTo: process.env.GMAIL_USER,
      subject: `Confirmación de contacto - ${PROPERTY.title}`,
      html: buildEmailHtml({ name, email, message }),
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[contact] Error al enviar correo:', err);
    return res.status(500).json({ ok: false, error: 'No se pudo enviar el correo. Por favor intenta más tarde.' });
  }
}
