// Rewards catalogue, points activity and promotions (Flow 5). Copy comes from the Figma frames.

export type Reward = {
  id: string
  name: string
  cost: number
  terms: string[]
}

const drinkTerms = [
  'Valid for 30 days after you redeem it.',
  'Applies to any drink up to Large.',
  'One reward per order. Cannot be combined with another reward.',
]

export const rewards: Reward[] = [
  { id: 'free-drink', name: 'Free any drink', cost: 250, terms: drinkTerms },
  {
    id: 'free-pastry',
    name: 'Free pastry',
    cost: 120,
    terms: [
      'Valid for 30 days after you redeem it.',
      'Applies to any pastry in the case.',
      'One reward per order. Cannot be combined with another reward.',
    ],
  },
  {
    id: 'drink-pastry',
    name: 'Free drink + pastry',
    cost: 400,
    terms: [
      'Valid for 30 days after you redeem it.',
      'Any drink up to Large plus any pastry.',
      'One reward per order. Cannot be combined with another reward.',
    ],
  },
  {
    id: 'cold-brew',
    name: 'Free cold brew',
    cost: 300,
    terms: [
      'Valid for 30 days after you redeem it.',
      'Applies to any cold brew drink.',
      'One reward per order. Cannot be combined with another reward.',
    ],
  },
]

export const rewardById = (id: string) => rewards.find((r) => r.id === id)

export type MyReward = { rewardId: string; status: 'Redeemed' | 'Expired' }

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
  { id: 'a3', description: 'Free pastry', date: '2 Oct', month: 'October', points: -120 },
  { id: 'a4', description: 'Order #1019', date: '28 Sep', month: 'September', points: 95 },
  { id: 'a5', description: 'Order #1012', date: '21 Sep', month: 'September', points: 140 },
]

export type Promotion = {
  id: string
  title: string
  description: string
  terms: string[]
  /** Active: "Ends 31 Oct"; past: "Ended 5 Oct" / "Used 12 Sep" */
  validity: string
  status: 'Active' | 'Expired' | 'Used'
}

export const promotions: Promotion[] = [
  {
    id: 'free-pastry',
    title: 'Free pastry with any large drink',
    description: 'Order any large drink and get a butter croissant on us.',
    terms: ['Valid on large drinks only.', 'One free pastry per order.', 'Cannot be combined with another promotion.'],
    validity: 'Ends 31 Oct',
    status: 'Active',
  },
  {
    id: 'cold-brew-trio',
    title: 'Buy 2 cold brews, get 1 free',
    description: 'Add three cold brews to one order and the third one is on us.',
    terms: ['Valid on cold brew drinks only.', 'Once per order.', 'Cannot be combined with another promotion.'],
    validity: 'Ends 15 Nov',
    status: 'Active',
  },
  {
    id: 'pumpkin-spice',
    title: 'Pumpkin spice season is here',
    description: 'Pumpkin Spice Latte and Maple Pecan Cold Brew are back for the season.',
    terms: ['While stocks last.', 'Available hot or iced.', 'Cannot be combined with another promotion.'],
    validity: 'Ends 30 Nov',
    status: 'Active',
  },
  {
    id: 'weekend-combo',
    title: 'Weekend pastry combo',
    description: 'Any two pastries for ₱150 on Saturdays and Sundays.',
    terms: ['Weekends only.', 'Any two pastries.', 'Cannot be combined with another promotion.'],
    validity: 'Ended 5 Oct',
    status: 'Expired',
  },
  {
    id: 'welcome-10',
    title: 'Welcome: 10% off your first order',
    description: 'A thank-you for joining MEGS\' Cafe: 10% off your first order in the app.',
    terms: ['First app order only.', 'Up to ₱100 off.', 'Cannot be combined with another promotion.'],
    validity: 'Used 12 Sep',
    status: 'Used',
  },
]

export const promotionById = (id: string) => promotions.find((p) => p.id === id)
