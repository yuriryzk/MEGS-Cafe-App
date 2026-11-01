// Rewards catalogue, points activity and promotions (Flow 5).
// Rewards and offers name real items from the menu boards; the offers are samples for the cafe to confirm.
import type { CartLine } from '../state/shared'
import { peso, productById } from './menu'

/** One item a reward makes free: the cheapest unit in the cart that fits it. */
export type RewardSlot = { label: string; kind?: 'drink' | 'food'; sections?: string[] }

export type Reward = {
  id: string
  name: string
  cost: number
  terms: string[]
  /** What it makes free, one item per slot */
  slots: RewardSlot[]
}

const drink: RewardSlot = { label: 'a drink', kind: 'drink' }
const snack: RewardSlot = { label: 'a snack', sections: ['snacks'] }
const riceMeal: RewardSlot = { label: 'a rice meal', sections: ['rice-meals'] }
const once = 'One reward per order. Cannot be combined with another reward.'
const valid = 'Valid for 30 days after you redeem it.'

// Ids stay as they were so rewards already saved on a phone keep working
export const rewards: Reward[] = [
  {
    id: 'free-drink',
    name: 'Free any drink',
    cost: 250,
    slots: [drink],
    terms: [valid, 'At checkout, the cheapest drink in your order is 100% off, any size.', once],
  },
  {
    id: 'free-pastry',
    name: 'Free snack',
    cost: 120,
    slots: [snack],
    terms: [valid, 'At checkout, the cheapest snack in your order (fries, cheese con fries or nachos) is 100% off.', once],
  },
  {
    id: 'drink-pastry',
    name: 'Free drink + snack',
    cost: 400,
    slots: [drink, snack],
    terms: [valid, 'At checkout, the cheapest drink and the cheapest snack in your order are 100% off.', once],
  },
  {
    id: 'cold-brew',
    name: 'Free rice meal',
    cost: 300,
    slots: [riceMeal],
    terms: [valid, 'At checkout, the cheapest rice meal in your order is 100% off.', once],
  },
]

export const rewardById = (id: string) => rewards.find((r) => r.id === id)

/** Short names for "160 pts to a free drink" */
const goal: Record<string, string> = {
  'free-drink': 'a free drink',
  'free-pastry': 'a free snack',
  'drink-pastry': 'a free drink + snack',
  'cold-brew': 'a free rice meal',
}

/** SRS FR-LOY-02: the points needed for the next reward in words, and how far along the bar is */
export function nextReward(points: number): { text: string; progress: number } {
  const byCost = [...rewards].sort((a, b) => a.cost - b.cost)
  const next = byCost.find((r) => r.cost > points)
  if (!next) return { text: 'Enough points for any reward', progress: 1 }
  return { text: `${(next.cost - points).toLocaleString('en-PH')} pts to ${goal[next.id] ?? next.name}`, progress: points / next.cost }
}

export type RewardSavings =
  | { applies: true; amount: number; items: { name: string; amount: number; key: string }[] }
  | { applies: false; amount: 0; missing: string }

/** What a reward takes off this cart: for each slot, the cheapest single unit that fits, at 100% off. */
export function rewardSavings(reward: Reward, cart: CartLine[]): RewardSavings {
  const units = cart.flatMap((l) => Array.from({ length: l.qty }, () => l))
  const taken = new Set<number>()
  const items: { name: string; amount: number; key: string }[] = []
  for (const slot of reward.slots) {
    let best = -1
    units.forEach((l, i) => {
      const p = productById(l.productId)
      if (taken.has(i) || !p) return
      if (slot.kind && p.kind !== slot.kind) return
      if (slot.sections && !slot.sections.includes(p.section)) return
      if (best < 0 || l.unitPrice < units[best].unitPrice) best = i
    })
    if (best < 0) return { applies: false, amount: 0, missing: slot.label }
    taken.add(best)
    items.push({ name: productById(units[best].productId)!.name, amount: units[best].unitPrice, key: units[best].key })
  }
  return { applies: true, amount: items.reduce((s, i) => s + i.amount, 0), items }
}

/** "Spanish Latte (₱110)" or "Spanish Latte (₱110) and Nachos (₱180)" */
export const freeItemsLine = (items: { name: string; amount: number }[]) =>
  items.map((i) => `${i.name} (${peso(i.amount)})`).join(' and ')

export type MyReward = { rewardId: string; status: 'Redeemed' | 'Expired' | 'Used' }

export type Activity = {
  id: string
  description: string
  date: string
  month: string
  points: number
}

export const activity: Activity[] = [
  { id: 'a1', description: 'Order #1038', date: '10 Oct', month: 'October', points: 120 },
  { id: 'a2', description: 'Order #1031', date: '6 Oct', month: 'October', points: 150 },
  { id: 'a3', description: 'Free snack', date: '2 Oct', month: 'October', points: -120 },
  { id: 'a4', description: 'Order #1019', date: '28 Sep', month: 'September', points: 95 },
  { id: 'a5', description: 'Order #1012', date: '21 Sep', month: 'September', points: 140 },
]

export type Promotion = {
  id: string
  title: string
  description: string
  terms: string[]
  /** Active: "Ends 30 Nov"; past: "Ended 5 Oct" / "Used 12 Sep" */
  validity: string
  status: 'Active' | 'Expired' | 'Used'
  /** The menu section "Order now" opens */
  section?: string
}

// Sample offers built on the real menu, for the cafe to replace with its own
export const promotions: Promotion[] = [
  {
    id: 'fries-with-rice-meal',
    title: 'Free plain fries with any rice meal',
    description: 'Order any rice meal and get a serving of plain potato fries on us.',
    terms: ['One free fries per rice meal.', 'Pickup and delivery.', 'Cannot be combined with another promotion.'],
    validity: 'Ends 30 Nov',
    status: 'Active',
    section: 'rice-meals',
  },
  {
    id: 'oat-swap',
    title: 'Free oat milk swap on coffee',
    description: 'Switch any coffee-based drink to oat milk at no extra charge (usually +₱50).',
    terms: ['Coffee-based drinks only.', 'Any size.', 'Cannot be combined with another promotion.'],
    validity: 'Ends 15 Nov',
    status: 'Active',
    section: 'espresso',
  },
  {
    id: 'matcha-22',
    title: '₱10 off any 22 oz matcha',
    description: 'Every drink in the Matcha Series is ₱10 off in the 22 oz size.',
    terms: ['Matcha Series, cold 22 oz only.', 'No limit per order.', 'Cannot be combined with another promotion.'],
    validity: 'Ends 10 Nov',
    status: 'Active',
    section: 'matcha',
  },
  {
    id: 'biscoff-launch',
    title: 'Biscoff Latte launch: ₱20 off',
    description: 'Our new Biscoff Latte, ₱20 off in any size for its first week.',
    terms: ['Biscoff Latte only.', 'One per order.', 'Cannot be combined with another promotion.'],
    validity: 'Ended 5 Oct',
    status: 'Expired',
    section: 'espresso',
  },
  {
    id: 'welcome-10',
    title: 'Welcome: 10% off your first order',
    description: "A thank-you for joining MEGS' Cafe: 10% off your first order in the app.",
    terms: ['First app order only.', 'Up to ₱100 off.', 'Cannot be combined with another promotion.'],
    validity: 'Used 12 Sep',
    status: 'Used',
  },
]

/** The offer Home, the welcome pop-up and the notification feature */
export const featuredPromotion: Promotion | undefined = promotions.find((p) => p.status === 'Active')

export const promotionById = (id: string) => promotions.find((p) => p.id === id)

/* ----- Offers at checkout ----- */

/** One unit in the cart: a line with quantity 3 is three units */
type Unit = CartLine
const unitsOf = (cart: CartLine[], skip: string[] = []) => {
  const left = [...skip]
  return cart.flatMap((l) => Array.from({ length: l.qty }, () => l)).filter((u) => {
    const i = left.indexOf(u.key)
    if (i < 0) return true
    left.splice(i, 1) // this unit is already free through a reward
    return false
  })
}
const inSection = (u: Unit, ...sections: string[]) => sections.includes(productById(u.productId)?.section ?? '')

export type OfferSavings = { promo: Promotion; amount: number; note: string }

/** What one active offer takes off these units, and a line saying what it applied to */
function offerOn(promo: Promotion, units: Unit[]): OfferSavings | null {
  switch (promo.id) {
    case 'fries-with-rice-meal': {
      const meals = units.filter((u) => inSection(u, 'rice-meals')).length
      const fries = units.filter((u) => u.productId === 'potato-fries-plain')
      const free = Math.min(meals, fries.length)
      if (!free) return null
      return { promo, amount: free * fries[0].unitPrice, note: `${free} plain fries free` }
    }
    case 'oat-swap': {
      const swapped = units.filter((u) => inSection(u, 'espresso', 'strong-coffee', 'caramel') && u.options.includes('Oat milk'))
      if (!swapped.length) return null
      return { promo, amount: swapped.length * OAT_MILK, note: `Oat milk free on ${swapped.length} coffee${swapped.length > 1 ? 's' : ''}` }
    }
    case 'matcha-22': {
      const big = units.filter((u) => inSection(u, 'matcha') && u.options.includes('Cold · 22 oz'))
      if (!big.length) return null
      return { promo, amount: big.length * 10, note: `₱10 off ${big.length} matcha` }
    }
    default:
      return null
  }
}
const OAT_MILK = 50

/** The one offer that saves the most on this cart ("cannot be combined with another promotion").
 *  Units a reward already made free are left out. */
export function bestOffer(cart: CartLine[], freeKeys: string[] = []): OfferSavings | null {
  const units = unitsOf(cart, freeKeys)
  return promotions
    .filter((p) => p.status === 'Active')
    .map((p) => offerOn(p, units))
    .filter((o): o is OfferSavings => !!o && o.amount > 0)
    .sort((a, b) => b.amount - a.amount)[0] ?? null
}

/** A nudge when the cart is one step from an offer, for the cart screen */
export function offerHint(cart: CartLine[]): string | null {
  const units = unitsOf(cart)
  const meals = units.filter((u) => inSection(u, 'rice-meals')).length
  const fries = units.filter((u) => u.productId === 'potato-fries-plain').length
  if (meals > fries && promotions.some((p) => p.id === 'fries-with-rice-meal' && p.status === 'Active')) {
    return `Add Potato Fries · Plain: ${fries ? 'another one is' : "it's"} free with your rice meal.`
  }
  return null
}

/* ----- Promo codes (SRS FR-CHK-05, FR-PRO-08) ----- */

export type PromoCode = {
  code: string
  /** Shown on the receipt line, e.g. "Promo MEGS10" */
  label: string
  /** Percent off what is left after the tier discount */
  percent: number
  minSpend: number
  /** Valid from the start of `starts` to the end of `ends`, Asia/Manila */
  starts: string
  ends: string
  /** One use per customer; a cancelled order gives the use back */
  oncePerCustomer: boolean
}

// A sample code for the demo; the cafe sets its own
export const promoCodes: PromoCode[] = [
  {
    code: 'MEGS10',
    label: 'Promo MEGS10',
    percent: 10,
    minSpend: 200,
    starts: '2026-10-01',
    ends: '2027-06-30',
    oncePerCustomer: true,
  },
]

export type PromoCheck = { ok: true; promo: PromoCode; amount: number } | { ok: false; error: string }

const day = (iso: string, end = false) => Date.parse(`${iso}T${end ? '23:59:59' : '00:00:00'}+08:00`)
const shortDate = (iso: string) =>
  new Date(day(iso)).toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Manila' })

/** Checks a code against its date window, minimum spend and usage limit, and works out what it takes off.
 *  (In the full system the server does this.) */
export function checkPromo(code: string, subtotal: number, afterTier: number, used: string[], now = Date.now()): PromoCheck {
  const promo = promoCodes.find((p) => p.code === code.trim().toUpperCase())
  if (!promo) return { ok: false, error: "This code can't be used with your order." }
  if (now < day(promo.starts)) return { ok: false, error: `This code starts on ${shortDate(promo.starts)}.` }
  if (now > day(promo.ends, true)) return { ok: false, error: `This code ended on ${shortDate(promo.ends)}.` }
  if (promo.oncePerCustomer && used.includes(promo.code)) return { ok: false, error: "You've already used this code." }
  if (subtotal < promo.minSpend)
    return { ok: false, error: `Spend ${peso(promo.minSpend)} or more to use this code. Add ${peso(promo.minSpend - subtotal)} more.` }
  return { ok: true, promo, amount: Math.round((afterTier * promo.percent) / 100) }
}
