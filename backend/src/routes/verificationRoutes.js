import { Router } from "express";
import { sendUserOTP } from "../controllers/verification.controller.js";

const router = Router();

router.post("/getOtp", sendUserOTP);
export default router;
