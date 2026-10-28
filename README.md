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

Two demo switches, for showing the prototype only:

- `?demo=member` starts signed in
- `?demo=cart` starts signed in with three items in the cart

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
