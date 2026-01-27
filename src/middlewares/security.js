import rateLimit from "express-rate-limit";
import helmet from "helmet";
import hpp from "hpp";
import useragent from "express-useragent";

export const securityHeaders = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
});

export const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});

export const detectBot = (req, res, next) => {
  const ua = req.headers["user-agent"] || "";
  if (!ua) {
    return res
      .status(403)
      .json({ success: false, message: "Bots not allowed" });
  }
  if (/bot|crawler|spider|crawling/i.test(ua)) {
    return res
      .status(403)
      .json({ success: false, message: "Bot activity blocked" });
  }
  next();
};
