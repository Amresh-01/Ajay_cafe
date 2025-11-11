// middlewares/security.js
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

// Basic HTTP Header Protection
export const securityHeaders = helmet({
  contentSecurityPolicy: false, // agar inline scripts use ho rahe hain to CSP disable kar diya.
  crossOriginEmbedderPolicy: true, //browser ko batata hai ki external resources kaise load karne hain.
  referrerPolicy: { policy: "no-referrer" },
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

//  Basic Bot Detection using User-Agent
export const detectBot = (req, res, next) => {
  const ua = req.headers["user-agent"];
  if (!ua || ua.match(/bot|crawler|spider|curl|wget/i)) {
    return res
      .status(403)
      .json({ success: false, message: "Bots not allowed" });
  }
  next();
};

export const verifyCaptcha = async (req, res, next) => {
  const { captchaToken } = req.body;
  if (!captchaToken) {
    return res
      .status(400)
      .json({ success: false, message: "Captcha token missing" });
  }

  try {
    const { data } = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`
    );

    if (!data.success) {
      return res
        .status(403)
        .json({ success: false, message: "Captcha verification failed" });
    }

    next();
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Captcha verification error" });
  }
};
