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
    KastenLijst.jsx          — Foldable cabinet list table with mini previews + KastEditModal (edit any
                               cabinet in the list; adapts fields per type)
    FloatingKastenLijst.jsx  — Sticky right sidebar with cabinet summary (no own sticky, parent handles it)
    TotalenOverzicht.jsx     — Totals overview: Arbeid, Plaatmateriaal, Kantenband, Meubelbeslag,
                               Keukentoestellen, Schuifdeursystemen. Has override system for all values.
                               Bottom: grand total + editable margin % box (Totaal incl. marge).
    MaterialenPanel.jsx      — Material selection (binnenkast/buitenzijde/tablet) + project-specific
                               custom material form (offerte-specifiek, not saved to DB)
    AccessoiresPanel.jsx     — Hardware pricing config
    ExtraBeslag.jsx          — Extra hardware items (LED, handdoekdrager, alubodem, etc.)
    KeukentoestellenPanel.jsx — Kitchen appliance selection with tiers + model names
    NestingResultaten.jsx    — Visual bin-packing result per material type (SVG plate previews)
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
    useKabinet.js            — Cabinet state management (all kast states + kastenLijst CRUD + updateKast)
    useMaterials.js          — Material loading from Supabase (reloadPlaatMaterialen on mount)
    useNotifications.js      — Toast notification system
    useProjectState.js       — Project save/load/autosave (Supabase)
  utils/
    kastCalculator.js        — Per-cabinet calculation: berekenKast(), berekenMontageUren(), aggregeerTotalen()
                               Each rect carries an `iv` (isVertical) flag for grain direction.
                               platesByNesting() uses smartPlateCount() from binPack.js.
    calculations.js          — berekenArbeid() (tekenwerk, montage, plaatsing, transport), berekenTotalen()
    binPack.js               — 2D guillotine bin-packing: packParts(), smartPlateCount(),
                               computeUtilisation(). kerf: 14mm for M-prefix materials, 4mm otherwise.
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
- `priceOverrides` state — overrides unit prices for accessories and (when locked) plate materials
- `arbeidOverrides` state — overrides calculated work hours
- `priceOverrideLocks` state — `{ [key]: true }` — per plate-row price locks (see below)
- `marge` state — margin percentage for grand total box (default 25, persisted)
- All override inputs: empty field = calculated value, blue border when overridden
- Meubelbeslag has +/- buttons next to override input

### Plate Price Lock System
The plate material table in TotalenOverzicht has a 🔓/🔒 toggle per row (between Prijs/plaat and Eigen prijs columns):
- **Unlocked (default):** DB/dropdown price is used; eigen-prijs input is disabled/dimmed
- **Locked:** eigen-prijs input is active (blue); that value is used for calculations and PDF
- First lock auto-seeds the input with the current DB price
- `priceOverrideLocks` is stored separately from `priceOverrides` and persisted with the project
- The initialization useEffect in TotalenOverzicht skips resetting locked rows — this prevents Supabase reloads from wiping saved price overrides when a project is re-opened
- **Why not in MaterialenPanel?** The lock lives in the totaallijst because the override is quote-specific; the dropdown is just for material selection

### Project-Specific Custom Materials (MaterialenPanel.jsx)
- Each material panel (binnenkast/buitenzijde/tablet) has an "Eigen materiaal" form below the dropdown
- Fields: naam, lengte korrel (breedte/plateLength), breedte (hoogte/plateWidth), prijs, grain checkbox
- Stored in `customProjectMaterialen: { binnen, buiten, tablet }` — NOT saved to plaat_materialen DB
- When active: dropdown is dimmed, custom mat is used for all calculations and nesting
- In App.jsx: `effectiveMaterialen*` arrays wrap the custom mat in `[mat]` at index 0

### Nesting / Bin-Packing System
- Toggle in Plaatmateriaal section header: "Nesting (i.p.v. m² × verlies)"
- `nestingMode` bool + `nestingBuffer` (default 0, kept for future use)
- `packParts()` in binPack.js: 2D guillotine algorithm, best-fit orientation
- `smartPlateCount(result)`: adds +1 safety plate only when n > 5 AND last plate ≥ 70% full
- Grain direction: each rect has `iv` (isVertical) flag set in kastCalculator.js
  - Vertical parts (zijwanden, deuren, ruggen): `iv=true` → length = hoogte (grain along height)
  - Horizontal parts (boven, onder, leggers): `iv=false` → length = breedte (grain along width)
  - `grain: mat.grain || false` passed to packParts; when true, parts cannot rotate 90°
- `NestingResultaten.jsx`: SVG visual of packing per material type, shown below TotalenOverzicht
  - Header shows total plate count + "slim afgerond"
  - Each plate row shows "(N gepakt + 1 veiligheidsplaat)" when smart rounding fires

### Pricing
- Arbeid: Tekenwerk €60/u, Montage/Plaatsing/Transport €45/u (overridable)
- Materials: plate price = (breedte/1000) * (hoogte/1000) * prijs_per_m2
- Schuifbeslag: stored in Supabase `admin_settings` key `schuifbeslag_prijzen`
- All other prices: from `admin_settings` or hardcoded defaults in `defaultMaterials.js`
- Grand total + margin shown at bottom of TotalenOverzicht (marge default 25%, editable)

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
