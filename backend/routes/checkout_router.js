import express from "express";
import { stripe } from "../stripe.js";
import { isAuthWithoutSubscription } from "../middlewares/auth.js";
import { User } from "../models/users.js";

export const checkoutRouter = express.Router();

checkoutRouter.post("/", isAuthWithoutSubscription, async (req, res) => {
  const { lookup } = req.body;
  if (!lookup) {
    return res.status(422).json({ error: "Lookup key is required" });
  }

  const prices = await stripe.prices.list({
    product: process.env.STRIPE_MEMBERSHIP_PRODUCT_ID,
    lookup_keys: [lookup],
  });

  if (prices.data.length === 0) {
    return res
      .status(404)
      .json({ error: "Price not found for the provided lookup key" });
  }

  const user = await User.findByPk(req.user.userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  let customer;
  if (user.stripeCustomerId) {
    customer = await stripe.customers.retrieve(user.stripeCustomerId);
  } else {
    customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: user.userId,
      },
    });
    user.stripeCustomerId = customer.id;
    await user.save();
  }

  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    billing_address_collection: "auto",
    line_items: [
      {
        price: prices.data[0].id,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${process.env.FRONTEND_URL}`,
    cancel_url: `${process.env.FRONTEND_URL}`,
    metadata: {
      userId: user.userId,
    },
  });

  res.status(201).json({
    url: session.url,
  });
});
