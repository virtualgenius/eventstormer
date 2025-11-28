# EventStormer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![GitHub](https://img.shields.io/badge/GitHub-virtualgenius%2Feventstormer-lightgrey)](https://github.com/virtualgenius/eventstormer)

**[Live Demo](https://eventstormer.virtualgenius.com)** | **Purpose-built facilitation tool for EventStorming workshops.**

EventStormer enables remote and hybrid teams to collaboratively visualize and understand complex socio-technical systems using the EventStorming methodology. It provides a guided, phase-based facilitation experience with an infinite canvas, real-time collaboration, and a clean, professional aesthetic.

## EventStorming Variants

EventStormer is designed to support the full range of EventStorming workshop formats:

- **Big Picture EventStorming** (current focus): Explore an entire business domain, identify domain events, hotspots, and opportunities across the organization
- **Process-Level EventStorming** (planned): Deep dive into a specific business process with commands, policies, and read models
- **Design-Level EventStorming** (planned): Detailed software design with aggregates, bounded contexts, and domain services
- **Team Flow EventStorming** (planned): Map team interactions, dependencies, and communication patterns

We're starting with Big Picture support and will expand to other variants in future milestones.

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
- **Real-time collaboration**: Multiple participants can work together simultaneously with live cursor presence
- **Local-first persistence**: Work is automatically saved locally and syncs when connected
- **Frictionless creation**: Minimal ceremony, immediate usability
- **Professional aesthetic**: Refined design suitable for executive facilitation
- **Open source**: MIT licensed, self-hosted, no vendor lock-in

## Features

**Complete:**
- Infinite canvas with pan and zoom (react-konva)
- Phase-based facilitation palette
- Real-time collaboration via Yjs CRDT + Cloudflare Workers
- User presence (see who's online)
- Local persistence (IndexedDB via Dexie)
- Undo/redo system
- Canvas rendering with viewport culling for performance

**Sticky Types:**
- Events (orange) → Hotspots (red) → Pivotal events (blue vertical lines) → Lanes (horizontal swimlanes) → Actors/Systems (yellow/lilac) → Opportunities (green) → Glossary (brown)

**Planned:**
- Export to PNG/PDF
- Checkpoints and versioning
- Theme area extraction
- Breakout groups and participant tagging
- Process-level elements (commands, policies, read models)
- AI assistance (glossary generation, past-tense validation, clustering)

See [docs/PLAN.md](docs/PLAN.md) for the full roadmap.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Rendering**: react-konva (canvas-based)
- **Styling**: TailwindCSS
- **State**: Zustand + Yjs CRDT
- **Collaboration**: Cloudflare Workers + Durable Objects
- **Persistence**: IndexedDB via Dexie

## Getting Started

### Development

```bash
# Install dependencies
npm install

# Start both frontend and collaboration server locally
npm run dev

# Or start them separately:
npm run dev:vite     # Frontend only (port 5180)
npm run dev:worker   # Collaboration server only (port 8800)
```

### Production Build

```bash
npm run build        # Build frontend
npm run deploy:worker # Deploy collaboration server to Cloudflare
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for deployment details.

## Project Structure

```
src/
├── components/        # React components (Canvas, FacilitationPalette, Sticky, etc.)
├── store/
│   ├── useBoardStore.ts    # Zustand store for board state
│   └── useCollabStore.ts   # Yjs collaboration and presence
├── types/
│   └── domain.ts      # Core domain model (Board, Sticky, Lines, Lanes)
└── lib/               # Utilities (nanoid, etc.)

workers/
└── server.ts          # Cloudflare Worker for real-time collaboration

docs/
├── VISION.md          # Product vision and principles
├── SPEC.md            # Core behavior specification
├── PLAN.md            # Milestone roadmap
├── DEPLOYMENT.md      # Deployment guide
└── ARCHITECTURE.md    # Technical architecture
```

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

**MVP Complete.** Real-time collaboration, canvas rendering, and local persistence are working. Currently implementing visual grammar completeness (Slice 5) and facilitation features (Slice 6).

This is an open-source project welcoming contributions. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Contributing

Contributions are welcome! Whether you're reporting bugs, suggesting features, or submitting pull requests, your help is appreciated.

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow and guidelines.

See [docs/VISION.md](docs/VISION.md) for product vision and direction.

## License

MIT - see [LICENSE](LICENSE) file for details
