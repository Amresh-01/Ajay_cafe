import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";

export const sanitizeRequest = [
  xss(),
  mongoSanitize(),
  (req, res, next) => {
    const cleanObject = (obj) => {
      if (typeof obj !== "object" || obj === null) return;
      for (const key in obj) {
        if (/^\$/.test(key) || /\./.test(key)) delete obj[key];
        else if (typeof obj[key] === "object") cleanObject(obj[key]);
      }
    };
    cleanObject(req.body);
    cleanObject(req.query);
    cleanObject(req.params);
    next();
  },
];
