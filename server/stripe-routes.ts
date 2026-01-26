import express from 'express';
import Stripe from 'stripe';
import { db } from './db';
import { preOrders } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

const KIDSAFETV_PRICE = 4000; // $40.00 in cents

function getStripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-12-15.clover',
  });
}

router.post('/create-payment-intent', async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY.' });
  }
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: KIDSAFETV_PRICE,
      currency: 'usd',
      metadata: {
        product: 'KidSafeTV Pre-order',
        email,
        name: name || '',
      },
      receipt_email: email,
    });

    await db.insert(preOrders).values({
      email,
      name: name || null,
      stripePaymentIntentId: paymentIntent.id,
      amount: KIDSAFETV_PRICE,
      currency: 'usd',
      status: 'pending',
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message || 'Failed to create payment' });
  }
});

router.post('/confirm-payment', async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured.' });
  }
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      await db
        .update(preOrders)
        .set({ 
          status: 'completed',
          completedAt: new Date(),
        })
        .where(eq(preOrders.stripePaymentIntentId, paymentIntentId));

      res.json({ success: true, status: 'completed' });
    } else {
      res.json({ success: false, status: paymentIntent.status });
    }
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: error.message || 'Failed to confirm payment' });
  }
});

router.post('/webhook', express.raw({ type: '*/*' }), async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(500).send('Stripe is not configured.');
  }
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret || !sig) {
    return res.status(400).send('Webhook secret or signature missing');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await db
        .update(preOrders)
        .set({ 
          status: 'completed',
          completedAt: new Date(),
        })
        .where(eq(preOrders.stripePaymentIntentId, paymentIntent.id));
      console.log('Payment succeeded:', paymentIntent.id);
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      await db
        .update(preOrders)
        .set({ status: 'failed' })
        .where(eq(preOrders.stripePaymentIntentId, failedPayment.id));
      console.log('Payment failed:', failedPayment.id);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

export default router;
