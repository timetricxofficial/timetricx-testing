import nodemailer from "nodemailer";

export const sendLeaveRequestMail = async (
  adminEmail: string,
  userEmail: string,
  userName: string,
  fromDate: string,
  toDate: string,
  totalDays: number,
  reason: string,
  leaveId: string
) => {
  try {
    console.log("📩 Sending leave request mail to:", adminEmail);

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

    // Construct Approve and Reject Action URLs
    // These should point to an open admin API that handles the query params to instantly approve or reject without login (or requires admin login on that route).
    const baseUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.timetricx.cybershoora.com';
    const approveUrl = `${baseUrl}/leave-action?id=${leaveId}&action=approved`;
    const rejectUrl = `${baseUrl}/leave-action?id=${leaveId}&action=rejected`;

    const info = await transporter.sendMail({
      from: `"Timetricx Alert" <${process.env.SMTP_FROM}>`,
      to: adminEmail,
      subject: `New Leave Request - ${userName} (${totalDays} Days) | Timetricx`,
      html: `
      <div style="background:#0f172a; padding:40px; font-family:Arial, sans-serif;">
        <div style="max-width:520px; margin:auto; background:#020617; border-radius:16px; padding:30px; color:white; box-shadow:0 0 30px rgba(0,0,0,0.6);">
          <h2 style="margin:0 0 10px; color:#38bdf8;">📅 Leave Request</h2>
          <p style="color:#cbd5f5; font-size:14px; margin-bottom:20px;">
            A new leave request has been submitted by <b>${userName}</b> (${userEmail}).
          </p>

          <div style="background:#1e293b; padding:20px; border-radius:12px; margin-bottom:25px; font-size:14px;">
            <p style="margin:0 0 10px;"><strong>Duration:</strong> ${totalDays} Day(s)</p>
            <p style="margin:0 0 10px;"><strong>From Date:</strong> ${new Date(fromDate).toDateString()}</p>
            <p style="margin:0 0 10px;"><strong>To Date:</strong> ${new Date(toDate).toDateString()}</p>
            <p style="margin:0;"><strong>Reason:</strong> ${reason}</p>
          </div>

          <p style="color:#94a3b8; font-size:13px; text-align:center; margin-bottom:15px;">
            You can take action directly from below:
          </p>

          <div style="text-align:center; margin-bottom:25px; display: flex; justify-content: center; gap: 10px;">
            <a href="${approveUrl}"
              style="display:inline-block; padding:12px 24px; background:#22c55e; color:black; font-weight:bold; text-decoration:none; border-radius:8px; margin-right: 15px;">
              Approve Leave
            </a>
            <a href="${rejectUrl}"
              style="display:inline-block; padding:12px 24px; background:#ef4444; color:white; font-weight:bold; text-decoration:none; border-radius:8px;">
              Reject Leave
            </a>
          </div>

          <hr style="border:none; border-top:1px solid #1e293b; margin:25px 0;">
          <p style="font-size:12px; color:#64748b; text-align:center;">© ${new Date().getFullYear()} Timetricx Admin Alerts</p>
        </div>
      </div>
      `,
    });

    console.log("📨 Leave Request mail sent:", info.messageId);

  } catch (error) {
    console.error("❌ LEAVE REQUEST MAIL ERROR:", error);
  }
};
