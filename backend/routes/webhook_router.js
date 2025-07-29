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

    let cusId;
    let user;
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.resumed":
        cusId = event.data.object.customer;
        user = await User.findOne({
          where: { stripeCustomerId: cusId },
        });
        if (user && !user.active) {
          user.active = true;
          await user.save();
        }
        break;
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
        cusId = event.data.object.customer;
        user = await User.findOne({
          where: { stripeCustomerId: cusId },
        });
        if (user && user.active) {
          user.active = false;
          await user.save();
        }
        break;
      case "customer.subscription.updated":
        cusId = event.data.object.customer;
        user = await User.findOne({
          where: { stripeCustomerId: cusId },
        });
        if (user) {
          user.active = event.data.object.status === "active";
          await user.save();
        }
        break;
      case "customer.deleted":
        cusId = event.data.object.id;
        user = await User.findOne({
          where: { stripeCustomerId: cusId },
        });
        if (user) {
          user.stripeCustomerId = null;
          user.active = false;
          await user.save();
        }
        break;
      case "invoice.payment_failed":
        cusId = event.data.object.customer;
        user = await User.findOne({
          where: { stripeCustomerId: cusId },
        });
        if (user && user.active) {
          user.active = false;
          await user.save();
        }
        break;
      case "invoice.payment_succeeded":
        cusId = event.data.object.customer;
        user = await User.findOne({
          where: { stripeCustomerId: cusId },
        });
        if (user && !user.active) {
          user.active = true;
          await user.save();
        }
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ message: "Webhook received" });
  }
);
