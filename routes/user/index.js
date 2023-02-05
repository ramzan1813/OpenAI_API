const express = require("express");
const { now } = require("mongoose");
const stripe = require("../middlewares/stripe");
const db = require("../models");
const { count, create } = require("../models/feedback");
const User = db.user;
const Feedback = db.feedback;

// Prepare Core Router
let app = express.Router(); // User Subscribe

app.post("/stripe/subscribe", async (req, res) => {
  const domainURL = process.env.DOMAIN;
  const { priceId, plan } = req.body;

  try {
    let user = await User.findOne({ _id: req.user._id });
    let customer = user.customerId
      ? { customer: user.customerId }
      : { customer_email: user.email };
    const subscription_data = plan === "free" ? { trial_period_days: 7 } : {};
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      ...customer,
      line_items: [
        {
          price: priceId,
          // For metered billing, do not pass quantity
          quantity: 1,
        },
      ],
      subscription_data,
      success_url: `${domainURL}signup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domainURL}signup/failed`,
    });
    if (session?.id && req.body.plan === "free") {
      console.log("session log \n" + session.data);
      await User.findByIdAndUpdate(
        { _id: req.user._id },
        {
          plan: "None",
          previous_plan: "None",
          status: "trialing",
          credits: 10,
          trial_end: Date.now() / 1000 + 7 * 24 * 60 * 60,
          current_period_end: Date.now(),
        }
      );
    } else if (
      session?.id &&
      (req.body.plan === "Basic" || req.body.plan === "Pro")
    ) {
      await User.findByIdAndUpdate(
        { _id: req.user._id },
        {
          plan: req.body.plan,
          previous_plan: req.body.plan,
          status: "active",
          credits:
            req.body.plan === "Basic" ? 400 + user.credits : 900 + user.credits,
          trial_end: "now",
          current_period_end: Date.now() / 1000 + 30 * 24 * 60 * 60,
        }
      );
    }

    res.redirect(303, session.url);
  } catch (e) {
    res.status(400);
    // console.log(e)
    return res.send({
      error: {
        message: e.message,
      },
    });
  }
});

app.post("/stripe/customer-portal", async (req, res) => {
  try {
    // This is the url to which the customer will be redirected when they are done
    // managing their billing with the portal.
    const domainURL = process.env.DOMAIN;
    const returnUrl = `${domainURL}my-profile`;

    let user = await User.findOne({ _id: req.user._id });

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.customerId,
      return_url: returnUrl,
    });
    // console.log(portalSession);
    // Redirect to the URL for the session
    res.redirect(303, portalSession.url);
  } catch (err) {
    // console.log(err)
    await User.findByIdAndUpdate(
      { _id: req.user._id },
      {
        customerId: "",
        status: "canceled",
        plan: "",
        trial_end: 0,
        current_period_end: 0,
      }
    );
    // console.log(err)
    const domainURL = process.env.DOMAIN;
    const returnUrl = `${domainURL}my-profile`;
    res.redirect(303, returnUrl);
  }
});

app.post("/stripe/activate", async (req, res) => {
  try {
    // This is the url to which the customer will be redirected when they are done
    // managing their billing with the portal.
    const domainURL = process.env.DOMAIN;
    const returnUrl = `${domainURL}my-profile`;

    let user = await User.findOne({ _id: req.user._id });

    const subscriptions = await stripe.subscriptions.list({
      customer: user.customerId,
      limit: 1,
    });
    const update = stripe.subscriptions.update(subscriptions.data[0].id, {
      cancel_at_period_end: false,
    });
    const subscription = await stripe.subscriptions.list({
      customer: user.customerId,
      limit: 1,
    });
    if (update) {
      await User.findByIdAndUpdate(
        { _id: req.user._id },
        {
          status: subscription.data[0].status,
          current_period_end: Date.now() / 1000 + 30 * 24 * 60 * 60,
          cancel_at_period_end: false,
          plan: subscription.data[0].plan.nickname,
          trial_end: 0,
        }
      );
    }
    // console.log(update);
    setTimeout(() => res.redirect(303, returnUrl), 2500);
    // Redirect to the URL for the session
  } catch (err) {
    console.log(err);
    const domainURL = process.env.DOMAIN;
    const returnUrl = `${domainURL}my-profile`;
    res.redirect(303, returnUrl);
  }
});

app.post("/stripe/cancel", async (req, res) => {
  try {
    // This is the url to which the customer will be redirected when they are done
    // managing their billing with the portal.
    const domainURL = process.env.DOMAIN;
    const returnUrl = `${domainURL}my-profile`;

    let user = await User.findOne({ _id: req.user._id });

    const subscriptions = await stripe.subscriptions.list({
      customer: user.customerId,
      limit: 1,
    });
    console.log(subscriptions.matedata);
    let update = await stripe.subscriptions.update(subscriptions.data[0].id, {
      cancel_at_period_end: true,
    });

    // const subscriptions01 = await stripe.subscriptions.list({
    //   customer: user.customerId,
    //   limit: 1,
    // });

    // console.log(subscriptions01.data[0]);

    if (update.cancel_at_period_end) {
      await User.findByIdAndUpdate(
        { _id: req.user._id },
        {
          cancel_at_period_end: update.cancel_at_period_end,
          // plan: subscriptions.data[0].plan.id,
        }
      );
    }
    setTimeout(() => res.redirect(303, returnUrl), 2500);
  } catch (err) {
    console.log(err);
    const domainURL = process.env.DOMAIN;
    const returnUrl = `${domainURL}my-profile`;
    res.redirect(303, returnUrl);
  }
});

app.post("/stripe/uncancel", async (req, res) => {
  try {
    // This is the url to which the customer will be redirected when they are done
    // managing their billing with the portal.
    const domainURL = process.env.DOMAIN;
    const returnUrl = `${domainURL}my-profile`;

    let user = await User.findOne({ _id: req.user._id });

    const subscriptions = await stripe.subscriptions.list({
      customer: user.customerId,
      limit: 1,
    });
    // await stripe.subscriptions.
    let update = await stripe.subscriptions.update(subscriptions.data[0].id, {
      cancel_at_period_end: false,
      plan: subscriptions.data[0].plan.id,
    });

    if (!update.cancel_at_period_end) {
      await User.findByIdAndUpdate(
        { _id: req.user._id },
        {
          cancel_at_period_end: update.cancel_at_period_end,
        }
      );
    }
    setTimeout(() => res.redirect(303, returnUrl), 2500);
  } catch (err) {
    console.log(err);
    const domainURL = process.env.DOMAIN;
    const returnUrl = `${domainURL}my-profile`;
    res.redirect(303, returnUrl);
  }
});

app.post("/stripe/plan", async (req, res) => {
  try {
    let user = await User.findOne({ _id: req.user._id });

    let obj = {
      plan: "None",
      status: "trailing",
      start_date: "",
      cancel_at_period_end: "",
      current_period_end: "",
    };

    if (user.customerId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: user.customerId,
        limit: 1,
      });
      // cancel at trail end
      if (user.current_period_end < Date.now() / 1000) {
        await User.findByIdAndUpdate(
          { _id: req.user._id },
          {
            plan: "None",
            status: "Canceled",
            current_period_end: 0,
            cancel_at_period_end: false,
            trial_end: 0,
            credits: 0,
          }
        );
      }
      // cancel at period end
      if (
        user.cancel_at_period_end &&
        user.current_period_end < Date.now() / 1000
      ) {
        await User.findByIdAndUpdate(
          { _id: req.user.id },
          { plan: "None", status: "Canceled", credits: 0 }
        );
      }
      // add credits at new month start
      if (
        !user.cancel_at_period_end &&
        user.current_period_end < Date.now() / 1000
      ) {
        await User.findByIdAndUpdate(
          { _id: req.user.id },
          { credits: user.plan === "Basic" ? 400 : 900 }
        );
      }
      // update user status in database
      if (
        subscriptions.data[0].current_period_end === null &&
        (user.current_period_end === Date.now() / 1000 ||
          user.current_period_end === 0)
      ) {
        await User.findByIdAndUpdate(
          { _id: req.user._id },
          {
            credits: 0,
            plan: "None",
            status: "trailing",
            current_period_end: 0,
          }
        );
      }
      let date = user.trial_end;
      console.log(
        // user.trial_end //< subscriptions.data[0].current_period_end
        date
      );
      let date01 = subscriptions.data[0].current_period_end;
      console.log(date === date01);
      console.log(subscriptions.data[0].status);
      if (
        user.plan !== subscriptions.data[0].plan.nickname &&
        subscriptions.data[0].plan.nickname !== null &&
        subscriptions.data[0].status === "active"
        // subscriptions.data[0].current_period_end > user.trial_end
      ) {
        await User.findByIdAndUpdate(
          { _id: req.user._id },
          {
            plan: subscriptions.data[0].plan.nickname,
            previous_plan: subscriptions.data[0].plan.nickname,
            status: subscriptions.data[0].status,
            trial_end: 0,
            current_period_end: subscriptions.data[0].current_period_end,
            cancel_at_period_end: subscriptions.data[0].cancel_at_period_end,
            credits:
              subscriptions.data[0].plan.id === process.env.STRIPE_PRODUCT_ENTRY
                ? 400
                : 900,
          }
        );
      }
      // if user cancel at period end update database
      else if (
        subscriptions.data[0].cancel_at_period_end !== user.cancel_at_period_end
      ) {
        await User.findByIdAndUpdate(
          { _id: req.user._id },
          { cancel_at_period_end: subscriptions.data[0].cancel_at_period_end }
        );
      }
      if (subscriptions.data[0]) {
        if (
          user.plan === "None" &&
          subscriptions.data[0].plan.nickname === null
        ) {
          obj.plan = user.plan;
        } else {
          obj.plan =
            subscriptions.data[0].plan.nickname === null
              ? "None"
              : subscriptions.data[0].plan.nickname;
        }
        if (user.status === "trailing") {
          obj.status = "trailing";
        } else {
          obj.status = subscriptions.data[0].status;
        }
        obj.start_date = subscriptions.data[0].start_date;
        obj.cancel_at_period_end = subscriptions.data[0].cancel_at_period_end;
        obj.current_period_end = subscriptions.data[0].current_period_end;
      }
    }

    res.json(obj);
  } catch (err) {
    console.log(err);
  }
});

app.post("/refresh/profile", async (req, res) => {
  let user = await User.findOne({ _id: req.user._id });
  let profile = {
    ...user.toObject(),
  };
  delete profile.password;
  res.json({
    profile: profile,
  });
  // console.log(profile + " /refresh/profile");
});

app.post("/feedback", async (req, res) => {
  try {
    const feedback = new Feedback({
      user: req.user._id,
      feedback: req.body.feedback,
      email: req.user.email,
    });
    await feedback.save();
    res.json({ success: true });
  } catch (err) {
    console.log(err);
  }
});

app.post("/feedback/view", async (req, res) => {
  try {
    const feedbacks = await Feedback.find({
      user: req.user._id,
    })
      .sort({ _id: -1 })
      .limit(5);
    res.json(feedbacks);
  } catch (err) {
    console.log(err);
  }
});

module.exports = app;
