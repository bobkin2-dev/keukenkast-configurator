# Keukenkast Configurator

Een React applicatie voor het configureren van keukenkasten met materiaalberekeningen.

## Installatie

```bash
# Installeer dependencies
npm install

# Start development server
npm run dev
```

## Features

- 5 kasttypen: Bovenkast, Kolomkast, Onderkast, Ladekast, Open Nis HPL
- Zijpanelen per kasttype
- Materiaalberekeningen (binnenkast, buitenzijde, tablet/HPL)
- Kantenband berekeningen
- Arbeid uren berekeningen
- Debug tabel voor controle
- Totaallijst met materiaal- en kostenberekeningen

## Structuur

```
keukenkast-project/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx
    ├── index.css
    └── App.jsx
```

## Gebruik met Claude Code

```bash
cd keukenkast-project
claude
```

Dan kun je vragen stellen zoals:
- "Voeg een nieuw kasttype toe"
- "Pas de materiaalberekening aan"
- "Voeg export naar PDF toe"
