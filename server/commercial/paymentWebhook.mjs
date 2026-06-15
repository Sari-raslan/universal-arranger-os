import { verifyHmacHex } from "./crypto.mjs";
import { getPlan } from "./plans.mjs";

const acceptedEvents = new Set([
  "subscription.activated",
  "subscription.renewed",
  "subscription.cancelled",
  "payment.failed",
]);

export class MemoryIdempotencyStore {
  constructor() {
    this.events = new Set();
  }

  has(eventId) {
    return this.events.has(String(eventId));
  }

  add(eventId) {
    this.events.add(String(eventId));
  }
}

export function verifyPaymentWebhook({
  rawBody,
  signature,
  secret,
}) {
  if (!verifyHmacHex(secret, rawBody, signature)) {
    throw new Error("Invalid payment webhook signature.");
  }

  const event = JSON.parse(rawBody);

  if (!String(event.id || "").trim()) {
    throw new Error("Payment event ID is required.");
  }

  if (!acceptedEvents.has(event.type)) {
    throw new Error(`Unsupported payment event: ${event.type}`);
  }

  if (
    event.type === "subscription.activated" ||
    event.type === "subscription.renewed"
  ) {
    getPlan(event.data?.planId);
  }

  return event;
}

export function processPaymentWebhook({
  rawBody,
  signature,
  secret,
  store,
}) {
  const event = verifyPaymentWebhook({
    rawBody,
    signature,
    secret,
  });

  if (store.has(event.id)) {
    return {
      accepted: true,
      duplicate: true,
      event,
    };
  }

  store.add(event.id);

  return {
    accepted: true,
    duplicate: false,
    event,
  };
}