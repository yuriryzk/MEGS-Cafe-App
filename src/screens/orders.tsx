// Flow 4 — Order tracking and history (C-17, C-18, C-19)
import { useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BottomNav, Tabs } from '../components/blocks'
import {
  Alert,
  FulfillmentBadge,
  FulfillmentDetails,
  OptionRow,
  OrderCard,
  OrderLine,
  PriceBreakdown,
  StatusBadge,
  StatusStepper,
  lineName,
} from '../components/order'
import { Content, Row, Screen, TopBar } from '../components/Screen'
import { Button } from '../components/ui'
import { Icon } from '../components/Icon'
import { peso, unavailableToday } from '../data/menu'
import { pastOrderByNumber, pastOrders, type PastOrder } from '../data/orders'
import { useOverlay } from '../overlays/OverlayHost'
import { sampleLines, tierDiscount, useApp, type CartLine, type Fulfillment, type PlacedOrder } from '../state/AppState'
import './orders.css'

type Tone = 'muted' | 'accent' | 'success' | 'dark' | 'error'

const STEPS: Record<Fulfillment, string[]> = {
  pickup: ['Received', 'Accepted', 'Preparing', 'Ready', 'Completed'],
  delivery: ['Received', 'Accepted', 'Preparing', 'Out for delivery', 'Delivered'],
}

const HEADLINES: Record<Fulfillment, string[]> = {
  pickup: ['We got your order', 'Order accepted', 'Preparing your order', 'Your order is ready', 'Order completed'],
  delivery: [
    'We got your order',
    'Order accepted',
    'Preparing your order',
    'Your order is on the way',
    'Order delivered',
  ],
}

const TONES: Record<Fulfillment, Tone[]> = {
  pickup: ['muted', 'accent', 'accent', 'success', 'dark'],
  delivery: ['muted', 'accent', 'accent', 'accent', 'success'],
}

/** `?state=` values used by the screen index to show a specific Figma frame. */
const STATE_PARAM: Record<string, number | 'cancelled'> = {
  received: 0,
  preparing: 2,
  ready: 3,
  out: 3,
  completed: 4,
  delivered: 4,
  cancelled: 'cancelled',
}

export const summarize = (lines: CartLine[]) => {
  const count = lines.reduce((n, l) => n + l.qty, 0)
  return `${count} item${count === 1 ? '' : 's'} · ${lines.map(lineName).join(', ')}`
}

/** The order being tracked — the last placed order, or the Figma sample (#1042). */
function useTrackedOrder(): PlacedOrder {
  const { lastOrder, fulfillment, addresses } = useApp()
  return useMemo(() => {
    if (lastOrder) return lastOrder
    const subtotal = sampleLines.reduce((n, l) => n + l.unitPrice * l.qty, 0)
    const discount = tierDiscount(subtotal)
    const deliveryFee = fulfillment === 'delivery' ? 49 : 0
    return {
      number: 1042,
      fulfillment,
      address: fulfillment === 'delivery' ? addresses[0] : undefined,
      lines: sampleLines,
      subtotal,
      discount,
      deliveryFee,
      total: subtotal - discount + deliveryFee,
      payment: 'Pay at counter',
      points: 120,
    }
  }, [lastOrder, fulfillment, addresses])
}

let updatesAsked = false

/** C-17 Order Tracking — pickup (Received → Completed, Cancelled) and delivery (→ Delivered). */
export function OrderTracking() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const overlay = useOverlay()
  const { trackStage, setTrackStage, orderCancelled, setOrderCancelled, setActiveOrder, notificationsOn, lastOrder } =
    useApp()
  const order = useTrackedOrder()
  const f = order.fulfillment
  const forced = params.get('state')
  const stage = Math.min(trackStage, 4)
  const userCancelled = useRef(false)

  // Apply ?state= once (screen index), otherwise simulate the cafe progressing the order.
  useEffect(() => {
    if (!forced) return
    const s = STATE_PARAM[forced]
    if (s === 'cancelled') setOrderCancelled(true)
    else if (s != null) {
      setOrderCancelled(false)
      setTrackStage(s)
    }
  }, [forced, setOrderCancelled, setTrackStage])

  useEffect(() => {
    if (forced || orderCancelled || stage >= 4) return
    const t = setTimeout(() => setTrackStage(stage + 1), 8000)
    return () => clearTimeout(t)
  }, [forced, orderCancelled, stage, setTrackStage])

  // Keep Home's active-order chip in sync.
  useEffect(() => {
    if (orderCancelled || stage >= 4) setActiveOrder(null)
    else
      setActiveOrder({
        number: order.number,
        status: STEPS[f][stage],
        eta: f === 'delivery' ? 'Arrives in about 35 min' : 'Ready in about 8 min',
      })
  }, [stage, orderCancelled, order.number, f, setActiveOrder])

  // O-11 Get order updates — asked once, when tracking the first order placed in this session.
  useEffect(() => {
    if (updatesAsked || notificationsOn || forced || !lastOrder) return
    const t = setTimeout(() => {
      updatesAsked = true
      overlay.open('order-updates')
    }, 600)
    return () => clearTimeout(t)
  }, [notificationsOn, forced, overlay, lastOrder])

  const cancel = async () => {
    if (stage >= 1) return overlay.open('too-late')
    const ok = await overlay.confirm('cancel-order')
    if (ok) {
      userCancelled.current = true
      setOrderCancelled(true)
    }
  }

  const detailStatus = (): { status?: string; tone?: 'default' | 'success' | 'accent' } => {
    if (f === 'pickup') {
      if (stage === 3) return { status: 'Ready for pickup', tone: 'success' }
      if (stage === 4) return { status: 'Picked up at 10:42 AM', tone: 'success' }
      return { status: 'Ready in about 8 min' }
    }
    if (stage === 3) return { status: 'Out for delivery · arrives by 10:55 AM', tone: 'accent' }
    if (stage === 4) return { status: 'Delivered at 10:52 AM', tone: 'success' }
    return { status: 'Arrives in about 35 min' }
  }

  const headline = orderCancelled ? 'Order cancelled' : HEADLINES[f][stage]
  const badge = orderCancelled
    ? { label: 'Cancelled', tone: 'error' as Tone }
    : { label: STEPS[f][stage], tone: TONES[f][stage] }

  return (
    <Screen topBar={<TopBar title={`Order #${order.number}`} onBack={() => navigate('/home')} />}>
      <Content>
        <Row>
          <section className="track-board" aria-label="Order status">
            <div className="track-badges">
              {/* The headline names the stage; the badge only flags a cancelled order */}
              {orderCancelled && <StatusBadge label={badge.label} tone={badge.tone} />}
              <span className="track-board__mode t-body-sm">
                <Icon name={f === 'delivery' ? 'truck' : 'store'} size={18} />
                {f === 'delivery' ? 'Delivery' : 'Pickup'}
              </span>
            </div>
            <h2 className="t-display track-board__headline">{headline}</h2>
            {!orderCancelled && <StatusStepper steps={STEPS[f]} current={stage} dark />}
          </section>
        </Row>

        {orderCancelled ? (
          <Row>
            <Alert tone="danger">
              {userCancelled.current
                ? 'You cancelled this order. Refunds, if any, go to your original payment method.'
                : 'The cafe cancelled this order: an item ran out. Refunds, if any, go to your original payment method.'}
            </Alert>
          </Row>
        ) : (
          <>
            <Row>
              <FulfillmentDetails
                type={f}
                address={order.address}
                {...detailStatus()}
                orderNumber={f === 'pickup' && stage === 3 ? order.number : undefined}
              />
            </Row>
          </>
        )}

        <Row>
          <div className="card options-card">
            <OptionRow
              icon="receipt"
              label="Order summary"
              value={`${order.lines.reduce((n, l) => n + l.qty, 0)} items · ${peso(order.total)}`}
              onClick={() => navigate(`/orders/${order.number}`)}
            />
          </div>
        </Row>
        <Row>
          <p className="t-body-sm muted">Need help with your order? Ask at the counter or call the cafe.</p>
        </Row>
        {!orderCancelled && stage <= 1 && (
          <Row>
            <Button variant="danger-outline" onClick={cancel}>
              Cancel order
            </Button>
          </Row>
        )}
      </Content>
    </Screen>
  )
}

/** Adds a past order's lines to the cart; asks first (O-08) if some items are off the menu today. */
function useReorder() {
  const navigate = useNavigate()
  const overlay = useOverlay()
  const { addToCart } = useApp()
  return async (lines: CartLine[]) => {
    const missing = lines.filter((l) => unavailableToday.includes(l.productId))
    if (missing.length) {
      const ok = await overlay.confirm('unavailable', { items: missing.map(lineName) })
      if (!ok) return
    }
    lines
      .filter((l) => !unavailableToday.includes(l.productId))
      .forEach((l) =>
        addToCart({ productId: l.productId, options: l.options, note: l.note, unitPrice: l.unitPrice, qty: l.qty }),
      )
    navigate('/cart')
  }
}

/** C-18 Orders — Active and History tabs. */
export function Orders() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'history' ? 'history' : 'active'
  const { activeOrder, orderCancelled, trackStage } = useApp()
  const order = useTrackedOrder()
  const reorder = useReorder()
  const live = activeOrder && !orderCancelled && trackStage < 4

  return (
    <Screen
      topBar={
        <>
          <TopBar type="title" title="Orders" />
          <div className="tabs--full">
            <Tabs
              items={[
                { id: 'active', label: 'Active' },
                { id: 'history', label: 'History' },
              ]}
              value={tab}
              onChange={(t) => setParams(t === 'history' ? { tab: 'history' } : {}, { replace: true })}
            />
          </div>
        </>
      }
      bottomNav={<BottomNav active="orders" />}
    >
      <Content>
        {tab === 'active' ? (
          live ? (
            <Row>
              <OrderCard
                number={order.number}
                summary={summarize(order.lines)}
                total={order.total}
                status={{ label: activeOrder.status, tone: 'accent' }}
                action="Track order"
                onAction={() => navigate('/orders/tracking')}
                onOpen={() => navigate('/orders/tracking')}
              />
            </Row>
          ) : (
            <Row>
              <div className="orders-empty">
                <Icon name="receipt" size={36} color="var(--muted)" />
                <span className="t-h3">No active orders</span>
                <span className="t-body muted">Orders you place show up here until they're done.</span>
                <Button full={false} onClick={() => navigate('/menu')}>
                  Start an order
                </Button>
              </div>
            </Row>
          )
        ) : (
          pastOrders.map((o) => (
            <Row key={o.number}>
              <OrderCard
                number={o.number}
                summary={summarize(o.lines)}
                total={o.subtotal}
                when={o.when}
                status={{ label: o.status, tone: o.status === 'Cancelled' ? 'error' : 'dark' }}
                action="Reorder"
                onAction={() => reorder(o.lines)}
                onOpen={() => navigate(`/orders/${o.number}`)}
              />
            </Row>
          ))
        )}
      </Content>
    </Screen>
  )
}

/** C-19 Order Detail — past orders by number; the tracked order uses its live data. */
export function OrderDetail() {
  const { number = '' } = useParams()
  const reorder = useReorder()
  const tracked = useTrackedOrder()
  const n = Number(number)
  const past: PastOrder | undefined = pastOrderByNumber(n)
  const isTracked = !past && n === tracked.number

  if (!past && !isTracked) {
    return (
      <Screen topBar={<TopBar title="Order" />}>
        <Content>
          <Row>
            <p className="t-body muted">We couldn't find that order.</p>
          </Row>
        </Content>
      </Screen>
    )
  }

  const lines = past ? past.lines : tracked.lines
  const subtotal = past ? past.subtotal : tracked.subtotal
  const discount = past ? past.discount : tracked.discount
  const deliveryFee = past ? 0 : tracked.deliveryFee
  const status = past ? past.status : 'In progress'
  const f = past ? past.fulfillment : tracked.fulfillment

  return (
    <Screen
      footerBorder
      topBar={<TopBar title={`Order #${n}`} />}
      footer={<Button onClick={() => reorder(lines)}>Reorder</Button>}
    >
      <Content>
        <Row>
          <div className="detail-head">
            <StatusBadge
              label={status}
              tone={status === 'Cancelled' ? 'error' : status === 'Completed' ? 'dark' : 'accent'}
            />
            <FulfillmentBadge type={f} size="L" />
            <span className="t-body-sm muted">{past ? past.date : 'Today · 10:42 AM'}</span>
          </div>
        </Row>
        <Row>
          <div>
            {lines.map((l) => (
              <OrderLine key={l.key} line={l} />
            ))}
          </div>
        </Row>
        <Row>
          <PriceBreakdown subtotal={subtotal} discount={discount} deliveryFee={deliveryFee} />
        </Row>
        <Row>
          <div className="card options-card">
            <div className="option-row">
              <Icon name="card" size={20} color="var(--muted)" />
              <span className="t-body option-row__label">Payment method</span>
              <span className="t-body-sm muted">{past ? past.payment : tracked.payment}</span>
            </div>
            <div className="option-row">
              <Icon name="receipt" size={20} color="var(--muted)" />
              <span className="t-body option-row__label">Order number</span>
              <span className="t-body-sm muted">#{n}</span>
            </div>
          </div>
        </Row>
      </Content>
    </Screen>
  )
}
