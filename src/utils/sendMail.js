import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const sendEmail = async (to, subject, otp) => {
  try {
    if (!to || !subject || !otp) {
      throw new Error("Missing required email parameters (to, subject, otp)");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const htmlContent = `
      <div style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  background-color:#f9f9f9;
                  border:1px solid #eee;
                  border-radius:12px;
                  padding:24px;
                  max-width:600px;
                  margin:auto;
                  box-shadow:0 3px 10px rgba(0,0,0,0.05);">
        
        <div style="text-align:center; background:#ff6600; padding:20px; border-radius:8px 8px 0 0;">
          <h2 style="color:white; margin:0;">Ajay Cafe</h2>
        </div>
        
        <div style="padding:20px;">
          <p style="font-size:16px; color:#333;">Hello,</p>
          <p style="font-size:15px; color:#555;">
            Here’s your one-time password (OTP) to verify your email for 
            <strong>Ajay_Cafe.com</strong>.
          </p>

          <div style="text-align:center; margin:30px 0;">
            <span style="display:inline-block;
                        background:#ff6600;
                        color:white;
                        font-size:28px;
                        letter-spacing:5px;
                        padding:12px 24px;
                        border-radius:10px;">
              ${otp}
            </span>
          </div>

          <p style="font-size:14px; color:#777;">
            This OTP is valid for <strong>5 minutes</strong>. 
            Please do not share it with anyone.
          </p>
        </div>

        <div style="text-align:center; font-size:12px; color:#aaa; padding:10px;">
          © ${new Date().getFullYear()} Ajay Café • Order happiness, one bite at a time.
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Ajay Café" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    if (process.env.NODE_ENV !== "production") {
      console.log(`📧 Email sent successfully to: ${to}`);
      console.log("Message ID:", info.messageId);
    }

    return info;
  } catch (error) {
    console.error("Email send failed:", error.message);
    throw new Error("Failed to send email. Please try again later.");
  }
};
