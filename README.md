# MEGS' Cafe App

Prototype of the MEGS' Cafe customer ordering app: browse the menu, customise a drink or meal,
order for pickup or delivery, and follow the order until it is ready. It is a front-end prototype
with no backend yet; orders, points and the cart live in memory.

Built with React, Vite and TypeScript.

## Run it

```bash
npm install
npm run dev
```

Then open the address Vite prints. On a desktop the app shows inside a phone frame, with a list of
every screen on the left.

## Demo it on a phone

On a phone the app fills the screen like a native app: no frame, and the phone's own status bar.
It remembers the cart, orders, points and sign-in between visits; **Profile → Settings → Reset demo
data** starts it over.

- **Same Wi-Fi, quickest:** run `npm run dev`, then open the "Network" address Vite prints
  (for example `http://192.168.1.20:5173`) on the phone.
- **Installed to the home screen, works offline:** build it and put the `dist/` folder on any
  https host (Netlify, Vercel, Cloudflare Pages or GitHub Pages all have free plans):

  ```bash
  npm run build
  ```

  Open the https address on the phone, then **Share → Add to Home Screen** (iPhone, Safari) or
  **⋮ → Install app** (Android, Chrome). It opens full screen with the MEGS' icon. Installing and
  offline use need https; over plain Wi-Fi (`http://`) the app runs but cannot be installed.

Two demo switches, for showing the prototype only (these visits start fresh and ignore saved data):

- `?demo=member` starts signed in
- `?demo=cart` starts signed in with three items in the cart

App icons are made from the logo with `node scripts/app-icons.mjs`.

## The menu

The menu is read from the data sheet in `data-sheet/`, not from the code:

| File | Holds |
| --- | --- |
| `products.csv` | Every item: name, section, badges, prices per size, description, photo |
| `sections.csv` | The printed menu's boards and the Best Sellers, Must-Try and Kids' Favorites collections |
| `option_groups.csv` | Size, milk, add-ons and flavours, and which items each applies to (`applies_to`) |
| `option_choices.csv` | Each choice, its price and which one is selected by default |

Edit the CSVs and restart `npm run dev` to see the change.

## Photos

Menu photos are converted from the cafe's originals into small WebP files in `src/assets/menu/`:

```bash
node scripts/menu-photos.mjs
```

The script lists which file belongs to which item, and fills the `image` column of `products.csv`.

## Design

- Colours and type are tokens in `src/index.css`: concrete ground, white plates, black ink, and gold
  only where a lamp is on (a live order, the current tracking step, points, the mark).
- The MEGS' logo is in `src/assets/brand/`.
- `design/redesign.template.html` is the three-screen redesign proposal; `node design/build.mjs`
  builds a standalone `design/redesign.html` from it.
