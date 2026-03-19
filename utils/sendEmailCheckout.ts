import nodemailer from "nodemailer";

export const sendCheckoutReminderMail = async (email: string) => {
  try {
    console.log("📩 Sending checkout reminder to:", email);

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
    console.log("✅ SMTP connected successfully");

    const info = await transporter.sendMail({
      from: `"Timetricx" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: "Checkout Reminder - Shift Completed | Timetricx",
      html: `
      <div style="
        background:#0f172a;
        padding:40px;
        font-family:Arial, sans-serif;
      ">

        <div style="
          max-width:520px;
          margin:auto;
          background:#020617;
          border-radius:16px;
          padding:30px;
          color:white;
          box-shadow:0 0 30px rgba(0,0,0,0.6);
        ">

          <h2 style="
            margin:0 0 10px;
            color:#22c55e;
          ">
            ⏰ Shift Completed
          </h2>

          <p style="
            color:#cbd5f5;
            font-size:14px;
            margin-bottom:20px;
          ">
            Your working time has been completed.
            It looks like you may have forgotten to check out.
          </p>

          <div style="
            background:linear-gradient(135deg,#2563eb,#22c55e);
            padding:18px;
            border-radius:12px;
            text-align:center;
            margin-bottom:25px;
          ">

            <p style="
              margin:0;
              font-size:16px;
              color:black;
              font-weight:bold;
            ">
              Please complete your checkout process.
            </p>

          </div>

          <div style="text-align:center; margin-bottom:25px;">
            <a href="https://timetricx.cybershoora.com/users/dashboard"
              style="
                display:inline-block;
                padding:12px 24px;
                background:#38bdf8;
                color:black;
                font-weight:bold;
                text-decoration:none;
                border-radius:8px;
              ">
              Go to Dashboard
            </a>
          </div>

          <hr style="
            border:none;
            border-top:1px solid #000000;
            margin:25px 0;
          ">

          <p style="
            font-size:12px;
            color:#64748b;
            text-align:center;
          ">
            If you have already checked out, you can ignore this email.
          </p>

          <p style="
            font-size:12px;
            color:#64748b;
            text-align:center;
          ">
            © ${new Date().getFullYear()} Timetricx
          </p>

        </div>
      </div>
      `,
    });

    console.log("📨 Reminder mail sent:", info.messageId);

  } catch (error) {
    console.error("❌ CHECKOUT MAIL ERROR:", error);
  }
};
