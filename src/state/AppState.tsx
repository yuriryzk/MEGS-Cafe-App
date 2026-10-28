import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { defaultOrder, productById } from '../data/menu'
import type { MyReward } from '../data/rewards'

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
}

export const DELIVERY_FEE = 49
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

export function AppStateProvider({ children }: { children: ReactNode }) {
  // Prototype-only: ?demo=member or ?demo=cart starts signed in (and with the sample cart) so a
  // screen can be opened straight from a URL for review and screenshots.
  const demo = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('demo') : null
  const [session, setSession] = useState<Session>(demo ? 'member' : 'signed-out')
  const [firstLaunch, setFirstLaunch] = useState(false)
  const [phone, setPhone] = useState('0917 123 4567')
  const [name, setName] = useState('Maria Santos')
  const [cart, setCart] = useState<CartLine[]>(demo === 'cart' ? sampleLines : [])
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>({
    number: 1042,
    status: 'Preparing',
    eta: 'Ready in about 8 min',
  })
  const [promoDismissed, setPromoDismissed] = useState(false)
  const [recentSearches, setRecentSearches] = useState(['Latte', 'Croissant', 'Cold brew', 'Hot chocolate'])
  const [fulfillment, setFulfillment] = useState<Fulfillment>('pickup')
  const [addresses, setAddresses] = useState<Address[]>([
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
  const [addressId, setAddressId] = useState('home')
  const [payment, setPayment] = useState('Pay at counter')
  const [useTierDiscount, setUseTierDiscount] = useState(true)
  const [lastOrder, setLastOrder] = useState<PlacedOrder | null>(null)
  const [nextNumber, setNextNumber] = useState(1043)
  const [notificationsOn, setNotificationsOn] = useState(false)
  const [trackStage, setTrackStage] = useState(2)
  const [orderCancelled, setOrderCancelled] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { label: 'Card ending 4242', status: 'Default' },
    { label: 'E-wallet', status: 'Linked' },
    { label: 'Pay at counter' },
  ])
  const [points, setPoints] = useState(1240)
  const [myRewards, setMyRewards] = useState<MyReward[]>([
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

    const placeOrder: AppState['placeOrder'] = () => {
      const discount = useTierDiscount && session === 'member' ? tierDiscount(subtotal) : 0
      const deliveryFee = fulfillment === 'delivery' ? DELIVERY_FEE : 0
      const total = subtotal - discount + deliveryFee
      const order: PlacedOrder = {
        number: nextNumber,
        fulfillment,
        address: fulfillment === 'delivery' ? addresses.find((a) => a.id === addressId) : undefined,
        lines: cart,
        subtotal,
        discount,
        deliveryFee,
        total,
        payment,
        points: Math.floor(total / 4),
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
