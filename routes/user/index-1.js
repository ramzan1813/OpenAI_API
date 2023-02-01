const express = require("express");
const stripe = require("../middlewares/stripe");
const db = require("../models");
const User = db.user;
const Feedback = db.feedback;

// Prepare Core Router
let app = express.Router(); // User Subscribe

app.post("/stripe/subscribe", async (req, res) => {
  const price = req.body.priceId;
  try {
    const user = await User.findOne({ _id: req.user._id });
    let customer = user.customerId
      ? { customer: user.customerId }
      : { customer_email: user.email };
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      ...customer,
      line_items: [
        {
          price: price,
          quantity: 1,
        },
      ],
    });
  } catch (err) {
    console.log(err);
  }
});
