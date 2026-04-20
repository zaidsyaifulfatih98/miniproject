import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface BookingEmailData {
  customerEmail: string;
  customerName: string;
  eventTitle: string;
  displayId: string;
  finalPrice: number;
  quantity: number;
  reason?: string;
}

export const emailService = {
  async sendApprovalEmail(data: BookingEmailData) {
    const { customerEmail, customerName, eventTitle, displayId, finalPrice, quantity } = data;

    await transporter.sendMail({
      from: `"LOKAHAJAT" <${process.env.SMTP_USER}>`,
      to: customerEmail,
      subject: `✅ Pembayaran Dikonfirmasi – ${displayId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 32px;">
          <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; background: #d1fae5; border-radius: 50%; width: 56px; height: 56px; line-height: 56px; font-size: 28px; text-align: center;">✅</div>
              <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin: 12px 0 4px;">Pembayaran Dikonfirmasi!</h1>
              <p style="color: #6b7280; font-size: 14px;">Hei <strong>${customerName}</strong>, pembelian tiket kamu telah berhasil dikonfirmasi.</p>
            </div>
            <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; font-size: 14px; color: #374151; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;">ID Transaksi</td>
                  <td style="padding: 6px 0; font-weight: 600; text-align: right;">${displayId}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;">Event</td>
                  <td style="padding: 6px 0; font-weight: 600; text-align: right;">${eventTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;">Jumlah Tiket</td>
                  <td style="padding: 6px 0; font-weight: 600; text-align: right;">${quantity} tiket</td>
                </tr>
                <tr style="border-top: 1px solid #d1d5db;">
                  <td style="padding: 10px 0 4px; color: #6b7280;">Total Bayar</td>
                  <td style="padding: 10px 0 4px; font-weight: 700; font-size: 16px; color: #059669; text-align: right;">
                    Rp ${finalPrice.toLocaleString("id-ID")}
                  </td>
                </tr>
              </table>
            </div>
            <p style="font-size: 13px; color: #6b7280; text-align: center; margin-top: 24px;">
              Kamu bisa melihat detail tiket di halaman profil kamu.<br/>Terima kasih sudah memesan!
            </p>
          </div>
          <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 16px;">
            Email ini dikirim otomatis oleh sistem LOKAHAJAT. Jangan balas email ini.
          </p>
        </div>
      `,
    });
  },

  async sendRejectionEmail(data: BookingEmailData) {
    const { customerEmail, customerName, eventTitle, displayId, finalPrice, quantity, reason } = data;

    await transporter.sendMail({
      from: `"LOKAHAJAT" <${process.env.SMTP_USER}>`,
      to: customerEmail,
      subject: `❌ Pembayaran Ditolak – ${displayId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 32px;">
          <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; background: #fee2e2; border-radius: 50%; width: 56px; height: 56px; line-height: 56px; font-size: 28px; text-align: center;">❌</div>
              <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin: 12px 0 4px;">Pembayaran Ditolak</h1>
              <p style="color: #6b7280; font-size: 14px;">Hei <strong>${customerName}</strong>, sayangnya pembayaran kamu tidak dapat dikonfirmasi.</p>
            </div>
            <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; font-size: 14px; color: #374151; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;">ID Transaksi</td>
                  <td style="padding: 6px 0; font-weight: 600; text-align: right;">${displayId}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;">Event</td>
                  <td style="padding: 6px 0; font-weight: 600; text-align: right;">${eventTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;">Jumlah Tiket</td>
                  <td style="padding: 6px 0; font-weight: 600; text-align: right;">${quantity} tiket</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;">Total Bayar</td>
                  <td style="padding: 6px 0; font-weight: 600; text-align: right;">Rp ${finalPrice.toLocaleString("id-ID")}</td>
                </tr>
              </table>
            </div>
            ${reason ? `
            <div style="background: #fff7ed; border-left: 4px solid #f97316; border-radius: 4px; padding: 12px 16px; margin: 16px 0;">
              <p style="font-size: 13px; color: #92400e; margin: 0;"><strong>Alasan penolakan:</strong> ${reason}</p>
            </div>` : ""}
            <div style="background: #eff6ff; border-radius: 8px; padding: 16px; margin-top: 20px;">
              <p style="font-size: 13px; color: #1d4ed8; margin: 0;">
                <strong>Poin dan voucher yang digunakan</strong> sudah dikembalikan ke akun kamu secara otomatis. 
                Kursi yang dipesan juga sudah dibebaskan.
              </p>
            </div>
            <p style="font-size: 13px; color: #6b7280; text-align: center; margin-top: 24px;">
              Silakan coba pesan kembali atau hubungi organizer event untuk informasi lebih lanjut.
            </p>
          </div>
          <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 16px;">
            Email ini dikirim otomatis oleh sistem LOKAHAJAT. Jangan balas email ini.
          </p>
        </div>
      `,
    });
  },
};
