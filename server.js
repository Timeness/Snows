import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

let otpStore = {};

const sendOtpEmail = async (toEmail, otp, purpose) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const purposes = {
    "sign-up": {
      subject: "Welcome! Your Sign-Up OTP",
      message: "Thank you for signing up! Use this OTP to complete your registration.",
    },
    "password-reset": {
      subject: "Reset Your Password - OTP",
      message: "Forgot your password? Use this OTP to reset it securely.",
    },
  };

  const { subject, message } = purposes[purpose] || purposes["sign-up"];

  const mailOptions = {
    from: `"Koji Marketplace" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <link href="https://fonts.googleapis.com/css2?family=Signika:wght@300;400;600&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Signika', sans-serif;
            background: linear-gradient(135deg, #1E1E2E, #2A2A3C);
            color: #ffffff;
            padding: 0;
            margin: 0;
            text-align: center;
          }
          .container {
            max-width: 600px;
            margin: 30px auto;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          }
          .header {
            font-size: 22px;
            font-weight: bold;
            padding: 15px;
            background: linear-gradient(90deg, #6a11cb, #2575fc);
            border-radius: 10px 10px 0 0;
          }
          .content {
            padding: 20px;
            font-size: 18px;
          }
          .otp {
            font-size: 28px;
            font-weight: bold;
            background: rgba(255, 255, 255, 0.2);
            padding: 12px 24px;
            border-radius: 8px;
            display: inline-block;
            color: #FFD700;
            margin: 15px 0;
          }
          .footer {
            font-size: 14px;
            padding: 10px;
            background: linear-gradient(90deg, #2575fc, #6a11cb);
            border-radius: 0 0 10px 10px;
          }
          .footer a {
            color: #FFD700;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">Koji Marketplace</div>
          <div class="content">
            <p>${message}</p>
            <div class="otp">${otp}</div>
            <p>The OTP is valid for 15 minutes. Please do not share it.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Koji Marketplace | Need help? <a href="mailto:support@koji.com">Contact Support</a>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${toEmail}`);
  } catch (error) {
    console.error("❌ Error sending OTP email:", error);
    throw new Error("Failed to send OTP email");
  }
};

app.post("/send-otp", async (req, res) => {
    const { email, purpose } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required!" });

    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore[email] = otp;

    try {
        await sendOtpEmail(email, otp, purpose);
        res.json({ message: "✅ OTP sent successfully!" });
    } catch (error) {
        res.status(500).json({ message: "❌ Failed to send OTP" });
    }
});

app.post("/verify-otp", (req, res) => {
    const { email, otp } = req.body;
    if (otpStore[email] && otpStore[email] == otp) {
        delete otpStore[email];
        return res.json({ message: "✅ Verification successful!" });
    }
    res.status(400).json({ message: "❌ Invalid OTP. Try again!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
