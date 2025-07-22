import express from "express";
import { stripe } from "../stripe.js";
import { User } from "../models/users.js";

export const webhookRouter = express.Router();

webhookRouter.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`Received event: ${event.id} of type ${event.type}`);

    let userId;
    let user;
    switch (event.type) {
      case "checkout.session.completed":
        userId = event.data.object.metadata.userId;
        user = await User.findByPk(userId);
        user.active = true;
        await user.save();
        break;
      case "customer.deleted":
        userId = event.data.object.metadata.userId;
        user = await User.findByPk(userId);
        if (user) {
          user.stripeCustomerId = null;
          user.stripeSubscriptionId = null;
          await user.save();
        }
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ message: "Webhook received" });
  }
);
