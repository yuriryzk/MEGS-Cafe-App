import { createContext, useContext, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { defaultOrder } from '../data/menu'
import { bestOffer, rewardById, rewardSavings, type MyReward } from '../data/rewards'

export type Session = 'signed-out' | 'guest' | 'member'

export type CartLine = {
  key: string
  productId: string
  /** Chosen options, e.g. ["Medium · 16 oz", "Hot", "Oat milk"] */
  options: string[]
  note: string
  unitPrice: number
  qty: number
}

/** Lines with the same item, options and note share a key and stack their quantities. */
const lineKey = (l: Omit<CartLine, 'key'>) => [l.productId, ...l.options, l.note].join('|')

export type ActiveOrder = { number: number; status: string; eta: string }

export type Address = {
  id: string
  label: 'Home' | 'Work' | 'Other'
  name: string
  street: string
  phone: string
  notes?: string
  isDefault?: boolean
}

export type Fulfillment = 'pickup' | 'delivery'

/** C-31 Payment Methods row: label + status ("Default", "Linked"). */
export type PaymentMethod = { label: string; status?: string }

/** Snapshot of an order at the moment it was placed (Order Confirmation, Tracking). */
export type PlacedOrder = {
  number: number
  fulfillment: Fulfillment
  address?: Address
  lines: CartLine[]
  subtotal: number
  discount: number
  deliveryFee: number
  total: number
  payment: string
  points: number
  /** The reward used on this order and what it took off */
  rewardId?: string
  rewardName?: string
  rewardDiscount?: number
  /** Points already credited for this order (FR-LOY-01: once, on Completed) */
  pointsCredited?: boolean
  /** The offer applied to this order and what it took off */
  offerName?: string
  offerDiscount?: number
}

/** The money in the cart, worked out once and shown the same in the cart, checkout and the order. */
export type Totals = {
  subtotal: number
  /** The applied reward: which items it made free and what it took off */
  reward: { name: string; amount: number; items: { name: string; amount: number }[] } | null
  /** The active offer that saves the most on what the reward left: one per order */
  offer: { name: string; amount: number; note: string } | null
  /** Regular 5% discount, on what is left after the reward and the offer */
  discount: number
  deliveryFee: number
  total: number
}

/** SRS AS-02 / TBD-05: flat delivery fee, proposed ₱25 (configurable) */
export const DELIVERY_FEE = 25
/** "Pay at counter" only makes sense for pickup */
export const COUNTER = 'Pay at counter'
/** Regular-tier discount: 5% of subtotal. */
export const tierDiscount = (subtotal: number) => Math.round(subtotal * 0.05)
/** Spend this much to unlock a free drink (cart nudge). */
export const FREE_DRINK_THRESHOLD = 500

type AppState = {
  session: Session
  setSession: (s: Session) => void
  /** Set after sign up so Home shows its "First launch" state once. */
  firstLaunch: boolean
  setFirstLaunch: (v: boolean) => void
  /** Phone number captured at sign up, shown on the verification screen. */
  phone: string
  setPhone: (v: string) => void
  name: string
  setName: (v: string) => void

  cart: CartLine[]
  cartCount: number
  cartTotal: number
  addToCart: (line: Omit<CartLine, 'key'>) => void
  /** Replaces the line with this key (cart Edit). Merges into a matching line if the edit makes them identical. */
  updateLine: (key: string, line: Omit<CartLine, 'key'>) => void
  setQty: (key: string, qty: number) => void
  clearCart: () => void

  activeOrder: ActiveOrder | null
  setActiveOrder: (o: ActiveOrder | null) => void

  promoDismissed: boolean
  setPromoDismissed: (v: boolean) => void

  recentSearches: string[]
  setRecentSearches: (v: string[]) => void

  fulfillment: Fulfillment
  setFulfillment: (f: Fulfillment) => void
  addresses: Address[]
  saveAddress: (a: Address) => void
  addressId: string
  setAddressId: (id: string) => void
  payment: string
  setPayment: (p: string) => void
  /** Whether the Regular tier discount is applied at checkout. */
  useTierDiscount: boolean
  setUseTierDiscount: (v: boolean) => void

  lastOrder: PlacedOrder | null
  placeOrder: (note: string) => PlacedOrder

  notificationsOn: boolean
  setNotificationsOn: (v: boolean) => void

  /** Tracking progress of the active order: 0 Received … 4 Completed/Delivered. */
  trackStage: number
  setTrackStage: (n: number) => void
  orderCancelled: boolean
  setOrderCancelled: (v: boolean) => void

  paymentMethods: PaymentMethod[]
  addPaymentMethod: (m: PaymentMethod, makeDefault: boolean) => void

  points: number
  setPoints: (n: number) => void
  myRewards: MyReward[]
  redeemReward: (rewardId: string, cost: number) => void
  /** The redeemed reward chosen for this order (Discounts and rewards sheet) */
  appliedReward: string | null
  setAppliedReward: (id: string | null) => void
  /** A cancelled order's voucher goes back to My rewards (FR-TRK-05) */
  restoreReward: (id: string) => void
  totals: Totals

  /** Prototype helper: fill the cart with the 3 items shown in the Figma checkout frames. */
  seedCart: () => void
  /** Prototype helper: make `lastOrder` the Figma sample order (#1042). */
  seedDemoOrder: (f: Fulfillment) => void
}

/** The demo cart for the checkout screens (₱480 subtotal), priced from the menu boards:
 *  Caramel Macchiato cold 22 oz ₱140 · Carbonara ₱180 · Spanish Latte cold 16 oz ₱110 + oat milk ₱50. */
export const sampleLines: CartLine[] = [
  {
    key: 'sample-1',
    productId: 'caramel-macchiato',
    options: ['Cold · 22 oz', 'Regular milk'],
    note: '',
    unitPrice: 140,
    qty: 1,
  },
  { key: 'sample-2', productId: 'carbonara', options: [], note: '', unitPrice: 180, qty: 1 },
  {
    key: 'sample-3',
    productId: 'spanish-latte',
    options: ['Cold · 16 oz', 'Oat milk'],
    note: 'less ice',
    unitPrice: 160,
    qty: 1,
  },
]

const Ctx = createContext<AppState | null>(null)

/* ----- Saved between visits (the demo has no backend, so the phone keeps its own state) ----- */

const STORE = 'megs.'
// Prototype-only: ?demo=member or ?demo=cart starts signed in (and with the sample cart) so a
// screen can be opened straight from a URL for review and screenshots. Those visits start fresh.
const demo = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('demo') : null

function usePersisted<T>(key: string, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    if (!demo) {
      try {
        const raw = window.localStorage.getItem(STORE + key)
        if (raw !== null) return JSON.parse(raw) as T
      } catch {
        /* storage blocked (private window): start from the defaults */
      }
    }
    return typeof initial === 'function' ? (initial as () => T)() : initial
  })
  useEffect(() => {
    try {
      window.localStorage.setItem(STORE + key, JSON.stringify(value))
    } catch {
      /* storage full or blocked: the session still works, it just won't be remembered */
    }
  }, [key, value])
  return [value, setValue]
}

/** Clears everything the demo saved on this phone and starts again from the splash screen. */
export function resetDemo() {
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(STORE))
      .forEach((k) => window.localStorage.removeItem(k))
  } catch {
    /* nothing saved */
  }
  window.location.replace(window.location.pathname + '#/')
  window.location.reload()
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = usePersisted<Session>('session', demo ? 'member' : 'signed-out')
  const [firstLaunch, setFirstLaunch] = usePersisted('firstLaunch', false)
  const [phone, setPhone] = usePersisted('phone', '0917 123 4567')
  const [name, setName] = usePersisted('name', 'Maria Santos')
  const [cart, setCart] = usePersisted<CartLine[]>('cart', demo === 'cart' ? sampleLines : [])
  const [activeOrder, setActiveOrder] = usePersisted<ActiveOrder | null>('activeOrder', {
    number: 1042,
    status: 'Preparing',
    eta: 'Ready in about 8 min',
  })
  const [promoDismissed, setPromoDismissed] = usePersisted('promoDismissed', false)
  const [recentSearches, setRecentSearches] = usePersisted('recentSearches', ['Spanish Latte', 'Matcha', 'Carbonara', 'Hot Chocolate'])
  const [fulfillment, setFulfillment] = usePersisted<Fulfillment>('fulfillment', 'pickup')
  const [addresses, setAddresses] = usePersisted<Address[]>('addresses', [
    {
      id: 'home',
      label: 'Home',
      name: 'Maria Santos',
      street: '12 Mabini St, Brgy. San Roque, Quezon City',
      phone: '+63 917 123 4567',
      notes: 'Leave at the door',
      isDefault: true,
    },
    {
      id: 'work',
      label: 'Work',
      name: 'Maria Santos',
      street: 'Unit 8B, Greenfield Tower, Mandaluyong City',
      phone: '+63 917 123 4567',
    },
  ])
  const [addressId, setAddressId] = usePersisted('addressId', 'home')
  const [payment, setPayment] = usePersisted('payment', 'Pay at counter')
  const [useTierDiscount, setUseTierDiscount] = usePersisted('useTierDiscount', true)
  const [lastOrder, setLastOrder] = usePersisted<PlacedOrder | null>('lastOrder', null)
  const [nextNumber, setNextNumber] = usePersisted('nextNumber', 1043)
  const [notificationsOn, setNotificationsOn] = usePersisted('notificationsOn', false)
  const [trackStage, setTrackStage] = usePersisted('trackStage', 2)
  const [orderCancelled, setOrderCancelled] = usePersisted('orderCancelled', false)
  const [paymentMethods, setPaymentMethods] = usePersisted<PaymentMethod[]>('paymentMethods', [
    { label: 'Card ending 4242', status: 'Default' },
    { label: 'E-wallet', status: 'Linked' },
    { label: 'Pay at counter' },
  ])
  const [points, setPoints] = usePersisted('points', 1240)
  const [appliedReward, setAppliedReward] = usePersisted<string | null>('appliedReward', null)

  // FR-LOY-01 / IR-05: points are credited once, when the order is Completed, never for a cancelled one
  useEffect(() => {
    if (!lastOrder || lastOrder.pointsCredited || orderCancelled || trackStage < 4) return
    setPoints((p) => p + lastOrder.points)
    setLastOrder({ ...lastOrder, pointsCredited: true })
  }, [lastOrder, orderCancelled, trackStage, setPoints, setLastOrder])


  // Delivery can't be paid at the counter: move to the first other method
  useEffect(() => {
    if (fulfillment === 'delivery' && payment === COUNTER) {
      setPayment(paymentMethods.find((m) => m.label !== COUNTER)?.label ?? COUNTER)
    }
  }, [fulfillment, payment, paymentMethods, setPayment])

  const [myRewards, setMyRewards] = usePersisted<MyReward[]>('myRewards', [
    { rewardId: 'free-drink', status: 'Redeemed' },
    { rewardId: 'free-pastry', status: 'Expired' },
  ])

  const value = useMemo<AppState>(() => {
    const addToCart: AppState['addToCart'] = (line) =>
      setCart((prev) => {
        const key = lineKey(line)
        const existing = prev.find((l) => l.key === key)
        if (existing) return prev.map((l) => (l.key === key ? { ...l, qty: l.qty + line.qty } : l))
        return [...prev, { ...line, key }]
      })

    const updateLine: AppState['updateLine'] = (oldKey, line) =>
      setCart((prev) => {
        const key = lineKey(line)
        const twin = key !== oldKey && prev.find((l) => l.key === key)
        if (twin) {
          return prev
            .filter((l) => l.key !== oldKey)
            .map((l) => (l.key === key ? { ...l, qty: l.qty + line.qty } : l))
        }
        return prev.map((l) => (l.key === oldKey ? { ...line, key } : l))
      })

    const subtotal = cart.reduce((n, l) => n + l.qty * l.unitPrice, 0)

    // SRS AS-05 / FR-CHK-04: the tier discount first (on the subtotal), then one promotion, then one
    // reward. The reward makes its item(s) free; the offer skips units the reward already covers,
    // so the same item is never discounted twice.
    const discount = useTierDiscount && session === 'member' ? tierDiscount(subtotal) : 0
    const usable = appliedReward && myRewards.some((m) => m.rewardId === appliedReward && m.status === 'Redeemed')
    const def = usable && session === 'member' ? rewardById(appliedReward!) : undefined
    const saved = def ? rewardSavings(def, cart) : null
    const reward = def && saved?.applies ? { name: def.name, amount: saved.amount, items: saved.items } : null
    const best = bestOffer(cart, reward?.items.map((i) => i.key) ?? [])
    const offer = best ? { name: best.promo.title, amount: best.amount, note: best.note } : null
    const deliveryFee = fulfillment === 'delivery' ? DELIVERY_FEE : 0
    const total = Math.max(0, subtotal - discount - (offer?.amount ?? 0) - (reward?.amount ?? 0)) + deliveryFee
    const totals: Totals = { subtotal, reward, offer, discount, deliveryFee, total }

    const placeOrder: AppState['placeOrder'] = () => {
      const order: PlacedOrder = {
        number: nextNumber,
        fulfillment,
        address: fulfillment === 'delivery' ? addresses.find((a) => a.id === addressId) : undefined,
        lines: cart,
        subtotal,
        discount,
        deliveryFee,
        total: totals.total,
        payment,
        points: Math.floor(total), // SRS AS-03: 1 pt per ₱1 paid, credited on Completed
        rewardId: reward ? appliedReward! : undefined,
        rewardName: reward?.name,
        rewardDiscount: reward?.amount,
        offerName: offer?.name,
        offerDiscount: offer?.amount,
      }
      if (reward) {
        setMyRewards((prev) => prev.map((m) => (m.rewardId === appliedReward ? { ...m, status: 'Used' } : m)))
        setAppliedReward(null)
      }
      setLastOrder(order)
      setTrackStage(0)
      setOrderCancelled(false)
      setNextNumber((n) => n + 1)
      setCart([])
      setFirstLaunch(false)
      setActiveOrder({
        number: order.number,
        status: 'Received',
        eta: fulfillment === 'delivery' ? 'Arrives in about 35 min' : 'Ready in about 10 min',
      })
      return order
    }

    return {
      session,
      setSession,
      firstLaunch,
      setFirstLaunch,
      phone,
      setPhone,
      name,
      setName,
      cart,
      cartCount: cart.reduce((n, l) => n + l.qty, 0),
      cartTotal: subtotal,
      addToCart,
      updateLine,
      setQty: (key, qty) =>
        setCart((prev) =>
          qty <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, qty } : l)),
        ),
      clearCart: () => setCart([]),
      activeOrder,
      setActiveOrder,
      promoDismissed,
      setPromoDismissed,
      recentSearches,
      setRecentSearches,
      fulfillment,
      setFulfillment,
      addresses,
      saveAddress: (a) =>
        setAddresses((prev) => (prev.some((x) => x.id === a.id) ? prev.map((x) => (x.id === a.id ? a : x)) : [...prev, a])),
      addressId,
      setAddressId,
      payment,
      setPayment,
      useTierDiscount,
      setUseTierDiscount,
      lastOrder,
      placeOrder,
      notificationsOn,
      setNotificationsOn,
      trackStage,
      setTrackStage,
      orderCancelled,
      setOrderCancelled,
      paymentMethods,
      addPaymentMethod: (m, makeDefault) =>
        setPaymentMethods((prev) => {
          const rest = makeDefault
            ? prev.map((p) => (p.status === 'Default' ? { ...p, status: undefined } : p))
            : prev
          const card = { ...m, status: makeDefault ? 'Default' : m.status }
          // Cards first, "Pay at counter" stays last.
          return [card, ...rest]
        }),
      points,
      setPoints,
      myRewards,
      appliedReward,
      setAppliedReward,
      restoreReward: (id) =>
        setMyRewards((prev) => prev.map((m) => (m.rewardId === id && m.status === 'Used' ? { ...m, status: 'Redeemed' } : m))),
      totals,
      redeemReward: (rewardId, cost) => {
        setPoints((p) => p - cost)
        setMyRewards((prev) => [{ rewardId, status: 'Redeemed' }, ...prev.filter((r) => r.rewardId !== rewardId)])
      },
      seedCart: () => setCart(sampleLines),
      seedDemoOrder: (f) => {
        const sub = sampleLines.reduce((n, l) => n + l.qty * l.unitPrice, 0)
        const discount = tierDiscount(sub)
        const deliveryFee = f === 'delivery' ? DELIVERY_FEE : 0
        setLastOrder({
          number: 1042,
          fulfillment: f,
          address: f === 'delivery' ? addresses[0] : undefined,
          lines: sampleLines,
          subtotal: sub,
          discount,
          deliveryFee,
          total: sub - discount + deliveryFee,
          payment: 'Pay at counter',
          points: 120,
        })
      },
    }
  }, [
    paymentMethods,
    points,
    myRewards,
    appliedReward,
    notificationsOn,
    trackStage,
    orderCancelled,
    session,
    firstLaunch,
    phone,
    name,
    cart,
    activeOrder,
    promoDismissed,
    recentSearches,
    fulfillment,
    addresses,
    addressId,
    payment,
    useTierDiscount,
    lastOrder,
    nextNumber,
  ])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be used inside AppStateProvider')
  return ctx
}

/** Default configuration used by quick add (+) buttons. */
export function quickAddLine(productId: string): Omit<CartLine, 'key'> {
  return { ...defaultOrder(productId), note: '', qty: 1 }
}

/** "0917 123 4567" → "+63 917 123 4567" */
export function toIntl(phone: string) {
  const digits = phone.replace(/\D/g, '').replace(/^0/, '')
  if (digits.length !== 10) return phone
  return `+63 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
}
