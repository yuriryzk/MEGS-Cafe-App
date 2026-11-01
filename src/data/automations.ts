// Automated orders (SRS 3.2.12, A-05 / A-06): orders the system places from a customer's standing rule.
// Sample data for the demo; the live copy is kept in the shared store (megs.automations).

export type AutomationState = 'queued' | 'processing' | 'succeeded' | 'failed'

export type AutomationLine = { productId: string; options?: string[]; qty: number }

export type Automation = {
  id: string
  /** When the rule fired */
  at: number
  customer: string
  customerId: string
  phone: string
  /** The standing rule that placed it */
  rule: string
  lines: AutomationLine[]
  fulfillment: 'pickup' | 'delivery'
  state: AutomationState
  /** Failure reason in plain words */
  reason?: string
  /** The system response, read-only: message and error code */
  response?: { code: string; message: string }
  /** What the customer was told */
  customerMessage?: string
  /** The order it created */
  orderNumber?: number
  timeline: { label: string; at: number }[]
  /** Set when staff converted it to a manual order */
  handled?: 'manual'
}

const MIN = 60_000

/** About six automations from the last hour, made relative to `now` so the demo always looks current */
export function seedAutomations(now: number): Automation[] {
  const ago = (m: number) => now - m * MIN
  return [
    {
      id: 'auto-6',
      at: ago(4),
      customer: 'Paolo Reyes',
      customerId: 'paolo',
      phone: '+63 918 555 0142',
      rule: 'Office pre-order, Greenfield Tower',
      lines: [
        { productId: 'ube-lava', options: ['Cold · 16 oz'], qty: 2 },
        { productId: 'americano', options: ['Cold · 16 oz'], qty: 1 },
      ],
      fulfillment: 'delivery',
      state: 'failed',
      reason: 'Ube Lava is sold out',
      response: { code: 'ITEM_UNAVAILABLE', message: 'ITEM_UNAVAILABLE: Ube Lava' },
      customerMessage: 'Sorry, Ube Lava ran out for your office pre-order. The cafe will contact you.',
      timeline: [
        { label: 'Rule fired', at: ago(4) },
        { label: 'Checking items', at: ago(4) },
        { label: 'Failed: item unavailable', at: ago(4) },
      ],
    },
    {
      id: 'auto-5',
      at: ago(9),
      customer: 'Jen Dizon',
      customerId: 'jen',
      phone: '+63 927 555 0198',
      rule: 'Weekday 8:00 recurring order',
      lines: [{ productId: 'spanish-latte', options: ['Hot · 12 oz'], qty: 1 }],
      fulfillment: 'pickup',
      state: 'failed',
      reason: 'The saved card has expired',
      response: { code: 'PAYMENT_TOKEN_EXPIRED', message: 'PAYMENT_TOKEN_EXPIRED: card ending 7781' },
      customerMessage: "Payment for your recurring order didn't go through. You haven't been charged.",
      timeline: [
        { label: 'Rule fired', at: ago(9) },
        { label: 'Charging saved card', at: ago(9) },
        { label: 'Failed: payment token expired', at: ago(9) },
      ],
    },
    {
      id: 'auto-4',
      at: ago(1),
      customer: 'Carlo Lim',
      customerId: 'carlo',
      phone: '+63 905 555 0164',
      rule: 'Weekday 8:00 recurring order',
      lines: [{ productId: 'latte', options: ['Hot · 12 oz'], qty: 1 }],
      fulfillment: 'pickup',
      state: 'queued',
      timeline: [{ label: 'Queued for 8:00', at: ago(1) }],
    },
    {
      id: 'auto-3',
      at: ago(2),
      customer: 'Maria Santos',
      customerId: 'demo-customer',
      phone: '+63 917 123 4567',
      rule: 'Weekday 8:00 recurring order',
      lines: [{ productId: 'caramel-macchiato', options: ['Cold · 16 oz'], qty: 1 }],
      fulfillment: 'pickup',
      state: 'processing',
      timeline: [
        { label: 'Rule fired', at: ago(2) },
        { label: 'Charging saved card', at: ago(2) },
      ],
    },
    {
      id: 'auto-2',
      at: ago(35),
      customer: 'Leo Tan',
      customerId: 'leo',
      phone: '+63 919 555 0177',
      rule: 'Office pre-order, Greenfield Tower',
      lines: [
        { productId: 'carbonara', qty: 2 },
        { productId: 'nachos', qty: 1 },
      ],
      fulfillment: 'delivery',
      state: 'succeeded',
      orderNumber: 1039,
      customerMessage: 'Your office pre-order #1039 is in. We will let you know when it is on the way.',
      timeline: [
        { label: 'Rule fired', at: ago(35) },
        { label: 'Charged saved card', at: ago(35) },
        { label: 'Order #1039 created', at: ago(35) },
      ],
    },
    {
      id: 'auto-1',
      at: ago(15),
      customer: 'Ana Cruz',
      customerId: 'ana',
      phone: '+63 917 555 0123',
      rule: 'Weekday 8:00 recurring order',
      lines: [{ productId: 'latte', options: ['Hot · 12 oz'], qty: 1 }],
      fulfillment: 'pickup',
      state: 'succeeded',
      orderNumber: 1041,
      customerMessage: 'Your recurring order #1041 is in.',
      timeline: [
        { label: 'Rule fired', at: ago(15) },
        { label: 'Charged saved card', at: ago(15) },
        { label: 'Order #1041 created', at: ago(15) },
      ],
    },
  ]
}

/** Rules a "Simulate automated order" button picks from */
export const simulatedRules: Omit<Automation, 'id' | 'at' | 'state' | 'timeline'>[] = [
  {
    customer: 'Maria Santos',
    customerId: 'demo-customer',
    phone: '+63 917 123 4567',
    rule: 'Weekday 8:00 recurring order',
    lines: [{ productId: 'spanish-latte', options: ['Cold · 16 oz'], qty: 1 }],
    fulfillment: 'pickup',
  },
  {
    customer: 'Paolo Reyes',
    customerId: 'paolo',
    phone: '+63 918 555 0142',
    rule: 'Office pre-order, Greenfield Tower',
    lines: [
      { productId: 'ube-lava', options: ['Cold · 16 oz'], qty: 1 },
      { productId: 'carbonara', qty: 1 },
    ],
    fulfillment: 'delivery',
  },
]
