import nodemailer from "nodemailer";

export const sendHolidayWorkRequestMail = async (
    adminEmail: string,
    userEmail: string,
    userName: string,
    holidayTitle: string,
    holidayDate: string,
    reason: string,
    requestId: string
) => {
    try {
        console.log("📩 Sending holiday work request mail to:", adminEmail);

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        await transporter.verify();

        // Construct Approve and Reject Action URLs connecting to the admin portal
        const baseUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';
        const approveUrl = `${baseUrl}/holiday-action?id=${requestId}&action=approved`;
        const rejectUrl = `${baseUrl}/holiday-action?id=${requestId}&action=rejected`;

        const info = await transporter.sendMail({
            from: `"Timetricx Alert" <${process.env.SMTP_FROM}>`,
            to: adminEmail,
            subject: `Holiday Work Request - ${userName} wants to work on ${holidayTitle} | Timetricx`,
            html: `
      <div style="background:#0f172a; padding:40px; font-family:Arial, sans-serif;">
        <div style="max-width:520px; margin:auto; background:#020617; border-radius:16px; padding:30px; color:white; box-shadow:0 0 30px rgba(0,0,0,0.6);">
          <h2 style="margin:0 0 10px; color:#ec4899;">🏢 Holiday Work Request</h2>
          <p style="color:#cbd5f5; font-size:14px; margin-bottom:20px;">
            A new request to work on a company holiday has been submitted by <b>${userName}</b> (${userEmail}).
          </p>

          <div style="background:#1e293b; padding:20px; border-radius:12px; margin-bottom:25px; font-size:14px;">
            <p style="margin:0 0 10px;"><strong>Holiday:</strong> ${holidayTitle}</p>
            <p style="margin:0 0 10px;"><strong>Date:</strong> ${new Date(holidayDate).toDateString()}</p>
            <p style="margin:0;"><strong>Reason to work:</strong> ${reason}</p>
          </div>

          <p style="color:#94a3b8; font-size:13px; text-align:center; margin-bottom:15px;">
            You can take action directly from below:
          </p>

          <div style="text-align:center; margin-bottom:25px; display: flex; justify-content: center; gap: 10px;">
            <a href="${approveUrl}"
              style="display:inline-block; padding:12px 24px; background:#22c55e; color:white; font-weight:bold; text-decoration:none; border-radius:8px; margin-right: 15px;">
              Approve Request
            </a>
            <a href="${rejectUrl}"
              style="display:inline-block; padding:12px 24px; background:#ef4444; color:white; font-weight:bold; text-decoration:none; border-radius:8px;">
              Reject Request
            </a>
          </div>

          <hr style="border:none; border-top:1px solid #1e293b; margin:25px 0;">
          <p style="font-size:12px; color:#64748b; text-align:center;">© ${new Date().getFullYear()} Timetricx Admin Alerts</p>
        </div>
      </div>
      `,
        });

        console.log("📨 Holiday Work Request mail sent:", info.messageId);

    } catch (error) {
        console.error("❌ HOLIDAY WORK REQUEST MAIL ERROR:", error);
    }
};
