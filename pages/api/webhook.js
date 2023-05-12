import { Order } from "@/Models/Order";
import mongooseConnect from "@/lib/mongoose";
const stripe = require("stripe")(process.env.STRIPE_SK);
import { buffer } from "micro";

const endpointSecret =
  "whsec_a2deb48abdeadf6d201dcad97df67d451da9b88aae28de81e9b99e98c66cff51";

export default async function handler(req, res) {
  await mongooseConnect();

  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      await buffer(req),
      sig,
      endpointSecret
    );
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const data = event.data.object;
      console.log(data);
      const orderId = data.metadata.orderId;
      const paid = data.payment_status == "paid";
      if (orderId && paid) {
        await Order.findByIdAndUpdate(orderId, {
          paid: true,
        });
      }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
}

res.status(200).send("ok");

export const config = {
  api: { bodyParser: false },
};

//freed-keen-famous-galore
//acct_1N6KZaBcxuOY4mOK
// whsec_a2deb48abdeadf6d201dcad97df67d451da9b88aae28de81e9b99e98c66cff51
