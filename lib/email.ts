import nodemailer from 'nodemailer';

const gmailUser = process.env.GMAIL_USER;
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

const transporter =
  gmailUser && gmailAppPassword
    ? nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailAppPassword.replace(/\s+/g, ''),
        },
      })
    : null;

interface SendMagicLinkOptions {
  to: string;
  recipientName?: string;
  ebookTitle: string;
  downloadUrl: string;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendMagicLinkEmail(options: SendMagicLinkOptions): Promise<SendEmailResult> {
  const { to, recipientName, ebookTitle, downloadUrl } = options;

  if (!transporter || !gmailUser) {
    return { success: false, error: 'Gmail SMTP belum dikonfigurasi (GMAIL_USER / GMAIL_APP_PASSWORD kosong).' };
  }

  const nameDisplay = recipientName ? `Halo ${recipientName},` : 'Halo,';

  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111;">
      <h2 style="color: #000; margin-bottom: 16px;">Akses E-Book Anda Siap</h2>
      <p style="font-size: 15px; line-height: 1.5;">${nameDisplay}</p>
      <p style="font-size: 15px; line-height: 1.5;">
        Terima kasih telah melakukan pembelian. E-book <strong>${ebookTitle}</strong> dapat diunduh melalui tautan aman di bawah ini:
      </p>
      <div style="margin: 28px 0;">
        <a href="${downloadUrl}" style="background-color: #000; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; display: inline-block;">
          Unduh E-Book Sekarang
        </a>
      </div>
      <p style="font-size: 13px; color: #666; line-height: 1.5;">
        Tautan ini berlaku selama 48 jam dan maksimal 5 kali unduhan. E-book ini dilisensikan khusus untuk <strong>${to}</strong>.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 12px; color: #888;">
        Jika tombol di atas tidak berfungsi, salin dan buka tautan berikut di peramban Anda:<br />
        <a href="${downloadUrl}" style="color: #0066cc;">${downloadUrl}</a>
      </p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Ebook Delivery" <${gmailUser}>`,
      to,
      subject: `Akses Unduhan: ${ebookTitle}`,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal mengirim email via Gmail SMTP.';
    return { success: false, error: message };
  }
}
