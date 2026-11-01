// Automated response templates (SRS 3.2.13, A-07 / A-08): the messages customers get on order events.
// These are the defaults; staff edits are saved in the shared store (megs.templates).

export type TemplateEvent =
  | 'received'
  | 'accepted'
  | 'preparing'
  | 'ready-pickup'
  | 'ready-delivery'
  | 'completed'
  | 'cancelled-cafe'
  | 'cancelled-customer'
  | 'delayed'
  | 'item-unavailable'
  | 'payment-failed'

export type Template = {
  event: TemplateEvent
  /** Event name in the list, e.g. "Order ready (pickup)" */
  name: string
  /** Title of the customer's notification */
  title: string
  channel: 'push' | 'in-app'
  body: string
  enabled: boolean
  /** SRS FR-ART-06: Accepted, Ready, Delayed and Cancelled by cafe can't be turned off */
  critical: boolean
  editedBy: string
  editedAt: number
}

export const VARIABLES = ['customer_name', 'order_number', 'pickup_time', 'cafe_name', 'reason', 'item_name'] as const
export type Vars = Partial<Record<(typeof VARIABLES)[number], string>>

/** SRS FR-ART-02: push messages are limited to 160 characters */
export const PUSH_LIMIT = 160

const seeded = Date.parse('2026-10-20T09:00:00+08:00')
const t = (
  event: TemplateEvent,
  name: string,
  title: string,
  channel: Template['channel'],
  body: string,
  critical = false,
): Template => ({ event, name, title, channel, body, enabled: true, critical, editedBy: 'MEGS setup', editedAt: seeded })

export const defaultTemplates: Template[] = [
  t('received', 'Order received', 'We got your order', 'in-app', 'Hi {customer_name}, we got order #{order_number}. We will let you know when the cafe accepts it.'),
  t('accepted', 'Order accepted', 'Order accepted', 'push', 'Order #{order_number} is accepted. Ready in about {pickup_time}.', true),
  t('preparing', 'Preparing', 'Preparing your order', 'in-app', "We're preparing order #{order_number}."),
  t('ready-pickup', 'Order ready (pickup)', 'Your order is ready', 'push', 'Order #{order_number} is ready at the counter. See you at {cafe_name}!', true),
  t('ready-delivery', 'Order ready (delivery)', 'Your order is on the way', 'push', 'Order #{order_number} is on its way to you.', true),
  t('completed', 'Order completed', 'Thanks! Enjoy.', 'in-app', 'Order #{order_number} is complete. Your points have been added.'),
  t('cancelled-cafe', 'Cancelled by cafe', 'Order cancelled', 'push', 'Sorry {customer_name}, we had to cancel order #{order_number}: {reason}.', true),
  t('cancelled-customer', 'Cancelled by customer', 'Order cancelled', 'push', 'You cancelled order #{order_number}.'),
  t('delayed', 'Order delayed', 'Taking a bit longer', 'push', 'Order #{order_number} is taking a bit longer. New estimate: about {pickup_time}.', true),
  t('item-unavailable', 'Item unavailable', 'An item ran out', 'push', 'Sorry, {item_name} ran out for order #{order_number}. The cafe will contact you.'),
  t('payment-failed', 'Payment failed', "Payment didn't go through", 'push', "Payment for order #{order_number} didn't go through. You haven't been charged."),
]

/** SRS FR-ART-07: alerts for staff, listed apart from the customer messages; they can't be edited */
export const staffAlerts = [
  { name: 'New order', body: 'A new order arrives in the queue (sound and badge).' },
  { name: 'Waiting too long', body: 'An order has not been accepted within 10 minutes.' },
  { name: 'Automation failed', body: 'An automated order failed and needs a retry or manual handling.' },
  { name: 'Not accepting orders', body: 'Accepting orders is off: a banner shows on every staff screen.' },
]

/** Fills {variables}; unknown ones are left as typed */
export const fill = (body: string, vars: Vars) =>
  body.replace(/\{(\w+)\}/g, (m, k: string) => (vars as Record<string, string | undefined>)[k] ?? m)

/** Variables in the text that the cafe doesn't have (SRS FR-ART-03) */
export const unknownVariables = (body: string) =>
  [...body.matchAll(/\{(\w*)\}/g)].map((m) => m[1]).filter((v) => !(VARIABLES as readonly string[]).includes(v))

/** Sample data for the preview (OA-03) */
export const sampleVars: Vars = {
  customer_name: 'Maria',
  order_number: '1043',
  pickup_time: '10 min',
  cafe_name: "MEGS' Cafe",
  reason: 'an item ran out',
  item_name: 'Ube Lava',
}
