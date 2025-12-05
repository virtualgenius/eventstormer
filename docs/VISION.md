## VISION.md

### Product Name
**EventStormer** (working title)

### Purpose
EventStormer is an **open-source, purpose-built facilitation tool for EventStorming workshops**. It enables teams to visualize, discuss, and understand complex socio-technical systems through collaborative modeling.

Where Miro and other whiteboard tools provide general-purpose canvases, EventStormer embodies the semantics and flow of EventStorming itself — using the right visual grammar, interaction rhythm, and facilitation flow to help teams focus on insight, not tool mechanics.

### Target Audience
- **Facilitators** of Domain-Driven Design and collaborative modeling workshops.
- **Teams** exploring or mapping large-scale business processes (value streams, organizational domains).
- **Consultants and coaches** introducing EventStorming to organizations.

### Core Value
EventStormer exists to:
- **Make EventStorming accessible** to any facilitator or team, without licensing barriers.
- **Preserve the natural flow** of live workshops, even in remote or hybrid settings.
- **Visualize the big picture** of business processes, enabling cross-silo understanding.

### Guiding UX Principles
- **Intuitive**: minimal learning curve; immediate usability.
- **Expressive**: visual language directly represents EventStorming concepts.
- **Lightweight**: no ceremony; frictionless creation.
- **Professional**: refined aesthetic suitable for executive facilitation.
- **Clarity over decoration**: visual meaning takes precedence over embellishment.

### Aesthetic and Tone
- Neutral white/gray palette with muted accent hues.
- Rounded corners, soft shadows, balanced spacing.
- Typography: system sans-serif (Inter / SF Pro) with restrained use of weight.
- Consistent lucide-react icons.
- Smooth, subtle animations (Framer Motion).

### Positioning
An **open, local-first, collaborative model visualization app** for EventStorming workshops.
Starting with Big Picture EventStorming, with planned support for Process-Level, Design-Level, and Team Flow variants. Future milestones include optional AI-assisted semantic helpers.

### Workshop Modes

EventStorming workshops vary in scope, participants, and goals. The mode determines which sticky types are available and suggests the appropriate level of detail.

| Mode | Scope | Participants | Focus |
|------|-------|--------------|-------|
| **Process** | Single business process | 2-3 teams | Commands, policies, read models — how work flows |
| **Design** | Feature / implementation | Dev team | Aggregates, state machines — software design |
| **Big Picture** | Value stream / enterprise | Diverse stakeholders | Events, hotspots, opportunities — discovery |
| **Team Flow** | Organizational | Team leads | Team interactions and handoffs |

**Process** is the default mode. Most workshops focus on understanding a specific business process — how customers place orders, how claims get processed, how onboarding works. Multiple teams participate to capture cross-functional knowledge.

**Design** zooms in further, typically involving the development team working on a specific feature or bounded context. Aggregates appear here to model state and behavior for implementation.

**Big Picture** zooms out to explore an entire value stream or business domain. Diverse stakeholders (executives, domain experts, developers) discover the landscape together. The focus is on events, pain points (hotspots), and opportunities rather than implementation details.

**Team Flow** maps organizational dynamics — how teams collaborate, where handoffs occur, and how work moves across organizational boundaries.

### Visual Language

EventStorming uses a consistent visual grammar:

- **🟧 Events** (orange): Past-tense statements of what happened in the domain
- **🟥 Hotspots** (red): Problems, risks, questions, or areas of uncertainty
- **🟦 Vertical Lines** (blue): Pivotal event boundaries between sub-processes
- **Horizontal Lanes**: Swimlanes for separating parallel processes
- **🟨 Actors** (yellow, half-height): People who initiate or participate in events
- **🟪 Systems** (pink, half-height): External systems that trigger or receive events
- **🟩 Opportunities** (green): Improvement ideas (Big Picture/Team Flow modes)
- **🟦 Commands** (blue): Actions that trigger events (Process/Design modes)
- **🟣 Policies** (purple): Business rules that react to events (Process/Design modes)
- **🟨 Aggregates** (pale yellow): State machines or components (Design mode)
- **🟩 Read Models** (green): Data needed for decisions (Process/Design modes)
- **🟫 Glossary** (brown): Term definitions for ubiquitous language

### Outstanding Questions
- Should the project tagline emphasize *collaborative discovery* or *domain understanding*?
- Should EventStormer visually reference orange stickies as part of branding (e.g., app icon)?