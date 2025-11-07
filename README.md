# EventStormer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

**Purpose-built facilitation tool for Big Picture EventStorming workshops.**

EventStormer enables remote and hybrid teams to collaboratively visualize and understand complex socio-technical systems using the EventStorming methodology. It provides a guided, phase-based facilitation experience with an infinite canvas, real-time collaboration, and a clean, professional aesthetic.

## What is EventStorming?

EventStorming is a rapid, collaborative workshop format for exploring complex business domains. Invented by Alberto Brandolini, it brings together domain experts, developers, and stakeholders to model business processes as a sequence of **domain events** (things that happened in the past tense).

**Learn more:**
- [Introducing EventStorming](https://www.eventstorming.com/) by Alberto Brandolini
- [EventStorming Glossary](https://www.eventstorming.com/resources/#glossary)
- [Awesome EventStorming](https://github.com/mariuszgil/awesome-eventstorming) — curated resources

## Why EventStormer?

Most EventStorming tools are either generic whiteboarding tools (Miro, Mural) or complex modeling platforms. EventStormer is purpose-built for EventStorming facilitation:

- **Guided facilitation**: Phase-based palette that shows only the sticky types appropriate for the current stage
- **Visual grammar enforcement**: EventStorming-specific sticky colors and semantics
- **Frictionless creation**: Minimal ceremony, immediate usability
- **Professional aesthetic**: Refined design suitable for executive facilitation
- **Open source**: MIT licensed, self-hosted, no vendor lock-in

## Features

**Current (MVP):**
- Infinite canvas with pan and zoom
- Phase-based facilitation palette:
  - Events (orange) → Hotspots (red) → Pivotal events (blue vertical lines) → Lanes (horizontal swimlanes) → Actors/Systems (yellow/lilac) → Opportunities (green) → Glossary (brown)
- Sticky creation with EventStorming visual grammar
- Centralized Zustand state management
- TypeScript + React + Vite + TailwindCSS

**In Progress:**
- Canvas rendering and interaction
- Real-time collaboration
- Undo/redo system
- Export/import functionality

**Planned:**
- Local persistence (IndexedDB)
- Checkpoints and versioning
- Theme area extraction
- Breakout groups and participant tagging
- AI assistance (glossary generation, past-tense validation, clustering)

See [docs/PLAN.md](docs/PLAN.md) for the full roadmap.

## Getting Started

```bash
npm install
npm run dev
```

This starts the Vite dev server and opens the app in your browser.

## Project Structure

- `src/` – React app code (TypeScript + Vite)
- `src/types/domain.ts` – Core domain model (Board, Sticky, Lines, Lanes, Themes)
- `src/store/useBoardStore.ts` – Zustand store for board state
- `src/components/` – React components (App, Canvas, FacilitationPalette, Sticky)
- `docs/` – [VISION.md](docs/VISION.md), [SPEC.md](docs/SPEC.md), [PLAN.md](docs/PLAN.md), [ARCHITECTURE.md](docs/ARCHITECTURE.md)

## EventStorming Visual Grammar

EventStormer implements the standard EventStorming color palette:

- **🟧 Events** (orange): Past-tense domain events ("Order Placed", "Payment Received")
- **🟥 Hotspots** (red): Problems, risks, uncertainties, or areas needing discussion
- **🟦 Vertical Lines** (blue): Pivotal event boundaries between sub-processes
- **Horizontal Lines**: Swimlanes for separating actors, departments, or systems
- **🟨 Actors** (yellow, half-height): People or roles initiating actions
- **🟪 Systems** (lilac, half-height): External systems involved in the process
- **🟩 Opportunities** (green): Improvement ideas or business opportunities
- **🟫 Glossary** (brown): Domain term definitions

## Facilitation Flow

EventStormer guides facilitators through the Big Picture EventStorming phases:

1. **Events**: Participants brainstorm domain events
2. **Hotspots**: Identify problems and uncertainties
3. **Pivotal Events**: Mark boundaries between sub-processes
4. **Lanes**: Add swimlanes to separate concerns
5. **Actors & Systems**: Identify who/what triggers events
6. **Opportunities**: Capture improvement ideas
7. **Glossary**: Define important domain terms

The palette automatically updates to show only the sticky types appropriate for each phase.

## Project Status

**Early MVP.** Core infrastructure is in place (types, store, component structure). Canvas interaction and real-time collaboration are in active development.

This is an open-source project welcoming contributions. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Contributing

Contributions are welcome! Whether you're reporting bugs, suggesting features, or submitting pull requests, your help is appreciated.

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow and guidelines.

See [docs/VISION.md](docs/VISION.md) for product vision and direction.

## License

MIT - see [LICENSE](LICENSE) file for details
