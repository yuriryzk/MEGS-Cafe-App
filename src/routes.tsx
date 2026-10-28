import type { ReactNode } from 'react'
import type { useApp } from './state/AppState'
import { featuredPromotion } from './data/rewards'
import {
  ForgotPassword,
  LogIn,
  Onboarding,
  ResetPassword,
  SignUp,
  Splash,
  Verification,
  Welcome,
} from './screens/account'
import { Home, Menu, ProductDetail, Search, SectionList } from './screens/shop'
import { Cart, Checkout, DeliveryAddress, OrderConfirmation, PickupOrDelivery } from './screens/checkout'
import type { OverlayId } from './overlays/OverlayHost'
import { OrderDetail, OrderTracking, Orders } from './screens/orders'
import {
  PointsActivity,
  PromotionDetail,
  Promotions,
  RegularStatus,
  RewardCatalog,
  RewardDetail,
  Rewards,
} from './screens/rewards'
import {
  AddPaymentMethod,
  EditProfile,
  Notifications,
  PaymentMethods,
  Profile,
  SavedAddresses,
  Settings,
} from './screens/profile'

type App = ReturnType<typeof useApp>

/** A route the router mounts. */
export type RouteDef = { path: string; element: ReactNode }

/** An entry in the prototype's screen index (one per Figma frame/state). */
export type IndexEntry = {
  /** Figma frame id, e.g. "C-04" */
  code: string
  label: string
  to: string
  /** Puts app state into the shape this Figma state needs before navigating. */
  prep?: (app: App) => void
  /** Overlay to open on top of the screen (O-xx frames). */
  overlay?: OverlayId
  overlayData?: Record<string, unknown>
}

export type IndexGroup = { title: string; entries: IndexEntry[] }

const member = (app: App) => {
  app.setSession('member')
  app.setFirstLaunch(false)
}

/** The 3-item demo cart used by the checkout screens (₱480 subtotal). */
const sampleCart = (app: App) => {
  member(app)
  app.seedCart()
}
const pickup = (app: App) => {
  sampleCart(app)
  app.setFulfillment('pickup')
}
const delivery = (app: App) => {
  sampleCart(app)
  app.setFulfillment('delivery')
  app.setAddressId('home')
}

export const routes: RouteDef[] = [
  // Flow 1
  { path: '/', element: <Splash /> },
  { path: '/onboarding/1', element: <Onboarding slide={0} /> },
  { path: '/onboarding/2', element: <Onboarding slide={1} /> },
  { path: '/onboarding/3', element: <Onboarding slide={2} /> },
  { path: '/welcome', element: <Welcome /> },
  { path: '/sign-up', element: <SignUp /> },
  { path: '/verify', element: <Verification /> },
  { path: '/log-in', element: <LogIn /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },
  // Flow 2
  { path: '/home', element: <Home /> },
  { path: '/menu', element: <Menu /> },
  { path: '/menu/section/:id', element: <SectionList /> },
  { path: '/search', element: <Search /> },
  { path: '/product/:id', element: <ProductDetail /> },
  // Flow 3
  { path: '/cart', element: <Cart /> },
  { path: '/fulfillment', element: <PickupOrDelivery /> },
  { path: '/address/:id', element: <DeliveryAddress /> },
  { path: '/checkout', element: <Checkout /> },
  { path: '/order-confirmation', element: <OrderConfirmation /> },
  // Flow 4
  { path: '/orders/tracking', element: <OrderTracking /> },
  { path: '/orders', element: <Orders /> },
  { path: '/orders/:number', element: <OrderDetail /> },
  // Flow 5
  { path: '/rewards', element: <Rewards /> },
  { path: '/rewards/catalog', element: <RewardCatalog /> },
  { path: '/rewards/activity', element: <PointsActivity /> },
  { path: '/rewards/status', element: <RegularStatus /> },
  { path: '/rewards/:id', element: <RewardDetail /> },
  { path: '/promotions', element: <Promotions /> },
  { path: '/promotions/:id', element: <PromotionDetail /> },
  // Flow 6
  { path: '/profile', element: <Profile /> },
  { path: '/profile/edit', element: <EditProfile /> },
  { path: '/profile/payment', element: <PaymentMethods /> },
  { path: '/profile/payment/add', element: <AddPaymentMethod /> },
  { path: '/profile/addresses', element: <SavedAddresses /> },
  { path: '/settings', element: <Settings /> },
  { path: '/notifications', element: <Notifications /> },
]

export const index: IndexGroup[] = [
  {
    title: 'Launch and account',
    entries: [
      { code: 'C-01', label: 'Splash', to: '/' },
      { code: 'C-02', label: 'Onboarding 1', to: '/onboarding/1' },
      { code: 'C-02', label: 'Onboarding 2', to: '/onboarding/2' },
      { code: 'C-02', label: 'Onboarding 3', to: '/onboarding/3' },
      { code: 'C-03', label: 'Welcome', to: '/welcome' },
      { code: 'C-04', label: 'Sign up', to: '/sign-up' },
      { code: 'C-05', label: 'Verification', to: '/verify' },
      { code: 'C-06', label: 'Log in', to: '/log-in' },
      { code: 'C-07', label: 'Forgot password', to: '/forgot-password' },
      { code: 'C-08', label: 'Reset password', to: '/reset-password' },
    ],
  },
  {
    title: 'Home, menu and product',
    entries: [
      { code: 'C-09', label: 'Home', to: '/home', prep: member },
      {
        code: 'C-09',
        label: 'Home · First launch',
        to: '/home',
        prep: (a) => {
          a.setSession('member')
          a.setFirstLaunch(true)
        },
      },
      { code: 'C-09', label: 'Home · Guest', to: '/home', prep: (a) => a.setSession('guest') },
      { code: 'C-09', label: 'Home · Loading', to: '/home?state=loading', prep: member },
      { code: 'C-10', label: 'Menu', to: '/menu' },
      { code: 'C-11', label: 'Section list', to: '/menu/section/best' },
      { code: 'C-12', label: 'Search', to: '/search' },
      { code: 'C-13', label: 'Product detail', to: '/product/caramel-macchiato' },
    ],
  },
  {
    title: 'Cart, pickup or delivery, checkout',
    entries: [
      { code: 'C-14', label: 'Cart', to: '/cart', prep: pickup },
      { code: 'C-14', label: 'Cart · Delivery', to: '/cart', prep: delivery },
      { code: 'C-32', label: 'Pickup or delivery', to: '/fulfillment', prep: pickup },
      { code: 'C-32', label: 'Pickup or delivery · Delivery', to: '/fulfillment', prep: delivery },
      { code: 'C-33', label: 'Delivery address', to: '/address/new', prep: delivery },
      { code: 'C-15', label: 'Checkout', to: '/checkout', prep: pickup },
      { code: 'C-15', label: 'Checkout · Delivery', to: '/checkout', prep: delivery },
      { code: 'C-15', label: 'Checkout · Processing', to: '/checkout?state=processing', prep: pickup },
      {
        code: 'C-15',
        label: 'Checkout · Processing (Delivery)',
        to: '/checkout?state=processing',
        prep: delivery,
      },
      {
        code: 'C-16',
        label: 'Order confirmation',
        to: '/order-confirmation',
        prep: (a) => {
          member(a)
          a.setFulfillment('pickup')
          a.seedDemoOrder('pickup')
        },
      },
      {
        code: 'C-16',
        label: 'Order confirmation · Delivery',
        to: '/order-confirmation',
        prep: (a) => {
          member(a)
          a.setFulfillment('delivery')
          a.seedDemoOrder('delivery')
        },
      },
    ],
  },
]

const tracking = (f: 'pickup' | 'delivery') => (a: App) => {
  member(a)
  a.setFulfillment(f)
  a.seedDemoOrder(f)
}

index.push({
  title: 'Order tracking and history',
  entries: [
    { code: 'C-17', label: 'Tracking · Received', to: '/orders/tracking?state=received', prep: tracking('pickup') },
    { code: 'C-17', label: 'Tracking · Preparing', to: '/orders/tracking?state=preparing', prep: tracking('pickup') },
    { code: 'C-17', label: 'Tracking · Ready', to: '/orders/tracking?state=ready', prep: tracking('pickup') },
    { code: 'C-17', label: 'Tracking · Completed', to: '/orders/tracking?state=completed', prep: tracking('pickup') },
    { code: 'C-17', label: 'Tracking · Cancelled', to: '/orders/tracking?state=cancelled', prep: tracking('pickup') },
    {
      code: 'C-17',
      label: 'Delivery · Preparing',
      to: '/orders/tracking?state=preparing',
      prep: tracking('delivery'),
    },
    { code: 'C-17', label: 'Delivery · Out for delivery', to: '/orders/tracking?state=out', prep: tracking('delivery') },
    { code: 'C-17', label: 'Delivery · Delivered', to: '/orders/tracking?state=delivered', prep: tracking('delivery') },
    {
      code: 'C-18',
      label: 'Orders · Active',
      to: '/orders',
      prep: (a) => {
        tracking('pickup')(a)
        a.setTrackStage(2)
        a.setOrderCancelled(false)
        a.setActiveOrder({ number: 1042, status: 'Preparing', eta: 'Ready in about 8 min' })
      },
    },
    { code: 'C-18', label: 'Orders · History', to: '/orders?tab=history', prep: member },
    { code: 'C-19', label: 'Order detail', to: '/orders/1038', prep: member },
  ],
})

const rewardsMember = (a: App) => {
  member(a)
  a.setPoints(1240)
}

index.push({
  title: 'Rewards and promotions',
  entries: [
    { code: 'C-20', label: 'Rewards', to: '/rewards', prep: rewardsMember },
    { code: 'C-21', label: 'Reward catalog', to: '/rewards/catalog', prep: rewardsMember },
    { code: 'C-21', label: 'Reward catalog · My rewards', to: '/rewards/catalog?tab=mine', prep: rewardsMember },
    { code: 'C-22', label: 'Reward detail', to: '/rewards/free-drink', prep: rewardsMember },
    {
      code: 'C-22',
      label: 'Reward detail · Insufficient',
      to: '/rewards/free-drink',
      prep: (a) => {
        member(a)
        a.setPoints(210)
      },
    },
    { code: 'C-22', label: 'Reward detail · Redeemed', to: '/rewards/free-drink?state=redeemed', prep: (a) => {
      member(a)
      a.setPoints(990)
    } },
    { code: 'C-22', label: 'Reward detail · Expired', to: '/rewards/free-drink?state=expired', prep: rewardsMember },
    { code: 'C-23', label: 'Points activity', to: '/rewards/activity', prep: rewardsMember },
    { code: 'C-24', label: 'Regular status', to: '/rewards/status', prep: rewardsMember },
    { code: 'C-25', label: 'Promotions', to: '/promotions', prep: member },
    { code: 'C-25', label: 'Promotions · Past', to: '/promotions?tab=past', prep: member },
    { code: 'C-26', label: 'Promotion detail', to: `/promotions/${featuredPromotion?.id ?? 'welcome-10'}`, prep: member },
    { code: 'C-26', label: 'Promotion detail · Expired', to: '/promotions/weekend-combo', prep: member },
    { code: 'C-26', label: 'Promotion detail · Used', to: '/promotions/welcome-10', prep: member },
  ],
})

index.push({
  title: 'Profile and settings',
  entries: [
    { code: 'C-27', label: 'Profile', to: '/profile', prep: member },
    { code: 'C-28', label: 'Edit profile', to: '/profile/edit', prep: member },
    { code: 'C-28', label: 'Edit profile · Saved', to: '/profile/edit?state=saved', prep: member },
    { code: 'C-29', label: 'Settings', to: '/settings', prep: member },
    { code: 'C-30', label: 'Notifications', to: '/notifications', prep: member },
    { code: 'C-31', label: 'Payment methods', to: '/profile/payment', prep: member },
    { code: 'C-31', label: 'Add payment method', to: '/profile/payment/add', prep: member },
  ],
})

/** Overlays (O-01 … O-12) — each opens on top of the screen it belongs to. */
export const overlayIndex: IndexGroup = {
  title: 'Overlays',
  entries: [
    { code: 'O-01', label: 'Promo modal', to: '/home', prep: member, overlay: 'promo' },
    {
      code: 'O-02',
      label: 'Quick add',
      to: '/menu',
      overlay: 'quick-add',
      overlayData: { productId: 'caramel-macchiato' },
    },
    {
      code: 'O-03',
      label: 'Log in to place your order',
      to: '/checkout',
      prep: (a) => {
        sampleCart(a)
        a.setSession('guest')
      },
      overlay: 'login-to-order',
    },
    { code: 'O-04', label: 'Discounts and rewards', to: '/checkout', prep: pickup, overlay: 'discounts' },
    { code: 'O-05', label: 'Payment method', to: '/checkout', prep: pickup, overlay: 'payment' },
    { code: 'O-06', label: 'Cancel this order?', to: '/orders/tracking', prep: member, overlay: 'cancel-order' },
    { code: 'O-06', label: 'Too late to cancel', to: '/orders/tracking', prep: member, overlay: 'too-late' },
    { code: 'O-07', label: 'Redeem Free drink?', to: '/rewards/catalog', prep: member, overlay: 'redeem' },
    { code: 'O-08', label: "Some items aren't available", to: '/orders', prep: member, overlay: 'unavailable' },
    { code: 'O-09', label: 'Please log in again', to: '/home', prep: member, overlay: 'login-again' },
    {
      code: 'O-10',
      label: 'Similar order placed',
      to: '/checkout',
      prep: (a) => {
        pickup(a)
        a.seedDemoOrder('pickup')
      },
      overlay: 'similar-order',
    },
    { code: 'O-11', label: 'Get order updates', to: '/orders/tracking', prep: member, overlay: 'order-updates' },
    { code: 'O-12', label: 'Log out?', to: '/profile', prep: member, overlay: 'logout' },
  ],
}
