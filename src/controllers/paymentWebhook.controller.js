import crypto from "crypto";
import Payment from "../models/payment.model.js";
import Order from "../models/order.model.js";

export const razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const signature = req.headers["x-razorpay-signature"];
    const body = JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.log("Webhook Signature mismatch!");
      return res.status(400).json({ success: false });
    }

    const event = req.body.event;
    const payload =
      req.body.payload.payment?.entity || req.body.payload.order?.entity;

    console.log("Webhook Event:", event);

    if (event === "payment.captured") {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: payload.order_id },
        {
          status: "paid",
          razorpayPaymentId: payload.id,
        },
      );

      console.log("Payment marked as PAID:", payload.order_id);
    }

    if (event === "payment.failed") {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: payload.order_id },
        { status: "failed" },
      );

      console.log("Payment FAILED:", payload.order_id);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.log("Webhook Error:", error);
    return res.status(500).json({ success: false });
  }
};
