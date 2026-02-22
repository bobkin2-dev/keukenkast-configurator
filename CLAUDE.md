# Keukenkast Configurator - Project Context

## Tech Stack
- React 18 + Vite + Tailwind CSS
- Supabase (auth + database)
- Deployed on Vercel
- Language: Dutch (UI labels, variable names mix Dutch/English)

## Build & Run
- `npm run dev` — dev server
- `npx vite build` — production build (always verify before commit)
- No test suite

## Project Structure

```
src/
  App.jsx                    — Main app, state management, layout (header + flex main + sticky sidebar)
  components/
    KastConfigurator.jsx     — Cabinet input forms: SingleKastConfigurator (4 standard types),
                               VrijeKastConfigurator (free-form), CustomKastConfigurator (4 custom types)
    KastPreview.jsx          — Visual preview components: KastPreview + VrijeKastPreview
    KastenLijst.jsx          — Foldable cabinet list table with mini previews
    FloatingKastenLijst.jsx  — Sticky right sidebar with cabinet summary (no own sticky, parent handles it)
    TotalenOverzicht.jsx     — Totals overview: Arbeid, Plaatmateriaal, Kantenband, Meubelbeslag,
                               Keukentoestellen, Schuifdeursystemen. Has override system for all values.
    MaterialenPanel.jsx      — Material selection (binnenkast/buitenzijde/tablet)
    AccessoiresPanel.jsx     — Hardware pricing config
    ExtraBeslag.jsx          — Extra hardware items (LED, handdoekdrager, alubodem, etc.)
    KeukentoestellenPanel.jsx — Kitchen appliance selection with tiers + model names
    Counter.jsx              — Reusable +/- counter component
    DebugTabel.jsx           — Debug view for per-cabinet calculations
    Admin/AdminSettings.jsx  — Admin panel: materials, accessories, production params, typeMultipliers, schuifbeslag pricing
    Auth/                    — Login/auth components
    Home/                    — Project list / home page
  constants/
    cabinet.js               — Cabinet types, color styles, custom types, schuifdeur options, complexiteit
    app.js                   — App-level constants
  data/
    defaultMaterials.js      — Default values for all cabinet types, materials, accessories, custom kast
  hooks/
    useKabinet.js            — Cabinet state management (all kast states + kastenLijst CRUD)
    useMaterials.js          — Material loading from Supabase
    useNotifications.js      — Toast notification system
    useProjectState.js       — Project save/load/autosave (Supabase)
  utils/
    kastCalculator.js        — Per-cabinet calculation: berekenKast(), berekenMontageUren(), aggregeerTotalen()
    calculations.js          — berekenArbeid() (tekenwerk, montage, plaatsing, transport), berekenTotalen()
```

## Key Architecture Concepts

### Cabinet Type System
- **4 standard types**: Bovenkast, Kolomkast, Onderkast, Ladekast (in `CABINET_GRID`)
- **Vrije Kast**: Free-form cabinet with selectable onderdelen (LZ/RZ/BK/OK/RUG), any material, complexity-based hours
- **4 custom types** (in `CUSTOM_CABINET_TYPES`):
  - Vaatwasserdeur — single door panel only
  - Onderkast Schuifdeur — onderkast + 2 sliding doors (light system)
  - Kolomkast Schuifdeur — kolomkast + 2 sliding doors (heavy system + onderprofiel)
  - Tablet — single OK plate in tablet material + optional spatwand

### Material Type System (`materiaalType`)
Values: `'binnenkast'`, `'buitenzijde'`, `'rug'`, `'leggers'`, `'tablet'`, `'vrijeKast'`
Each cabinet part is tagged with a materiaalType which determines which plate material/pricing applies.

### Calculation Flow
1. `berekenKast(kast, params)` — per cabinet: returns onderdelen[], m2 per type, hardware counts, montageUren, schuifdeursystemen
2. `aggregeerTotalen(kastenLijst, params)` — sums all cabinets into flat totals
3. `berekenTotalen()` in calculations.js — converts aggregated totals to plate counts
4. `berekenArbeid(kastenLijst, totalen, arbeidParameters)` — calculates 4 work hour categories

### Override System (TotalenOverzicht.jsx)
- `extraAmounts` state — overrides calculated quantities (empty = use calculated)
- `priceOverrides` state — overrides unit prices
- `arbeidOverrides` state — overrides calculated work hours
- All override inputs: empty field = calculated value, blue border when overridden
- Meubelbeslag has +/- buttons next to override input

### Pricing
- Arbeid: Tekenwerk €60/u, Montage/Plaatsing/Transport €40/u (overridable)
- Materials: plate price = (breedte/1000) * (hoogte/1000) * prijs_per_m2
- Schuifbeslag: stored in Supabase `admin_settings` key `schuifbeslag_prijzen`
- All other prices: from `admin_settings` or hardcoded defaults in `defaultMaterials.js`

### Layout
- Header: toggle buttons (Debug, Rendement, Arbeid Parameters, Admin)
- Main content (flex-1): materials panel, cabinet configurators (2x2 grid + vrije kast/custom side-by-side), kastenlijst, totalen
- Right sidebar (w-72, sticky): Save button + FloatingKastenLijst (hidden on <xl screens)

### Supabase Tables
- `plaat_materialen` — plate materials (binnenkast/buitenzijde/tablet categories)
- `admin_settings` — key/value JSON store (accessoires, production_params, keukentoestellen_prijzen, schuifbeslag_prijzen)
- `projecten` — saved projects with full state JSON
- `project_groups` — project grouping

## Coding Conventions
- Tailwind CSS only (no custom CSS files)
- Dynamic Tailwind classes use complete class names via `colorStyles` mapping (avoids tree-shaking issues)
- Dutch labels in UI, mixed Dutch/English in code
- Data-driven rendering with `.map()` over config arrays where possible
- `useState` for local component state, props drilling (no context/redux)
- Commits in English with Co-Authored-By tag
