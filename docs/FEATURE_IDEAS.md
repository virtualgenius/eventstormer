# EventStormer Differentiation: Feature Brainstorm

## Context

EventStormer is an open-source, purpose-built facilitation tool for **all EventStorming workshop variants**:

- **Process** (default): Single business process with commands, policies, read models
- **Design**: Feature-level with aggregates for implementation
- **Big Picture**: Enterprise-wide discovery with events, hotspots, opportunities
- **Team Flow**: Organizational dynamics and team interactions

Unlike generic whiteboard tools (Miro, Mural, Excalidraw) or diagramming tools (Lucid), it embodies EventStorming semantics directly—visual grammar, mode-specific elements, and facilitation flow.

**Target Market:**

- DDD/EventStorming facilitators and coaches
- Consultants introducing EventStorming to organizations
- Remote/hybrid teams doing collaborative domain discovery
- Development teams modeling business processes
- Organizations wanting open-source, self-hosted alternatives

**Core Differentiator:** Purpose-built semantics + mode-aware facilitation

---

## Feature Brainstorm: EventStorming-Specific Differentiation

### Category 1: Facilitation Intelligence

#### 1.1 Smart Phase Progression

- **Auto-phase detection**: Analyze board density and suggest when ready for next phase
- **Phase health indicators**: "You have 47 events but only 2 hotspots—consider exploring pain points"
- **Time-boxing integration**: Built-in timers with phase-specific durations (e.g., 20min chaotic exploration)
- **Facilitation prompts**: Pop-up questions for facilitators ("Are there any pivotal events that changed the business direction?")

#### 1.2 Participant Guidance

- **First-timer onboarding**: Contextual tooltips explaining each sticky type as introduced
- **"What should I add?"**: Guided prompts based on current phase ("Think of a business event that happened after X")
- **Example library**: Show real EventStorming examples per sticky type (sanitized case studies)
- **Language hints**: "Events are past-tense verbs—try 'Order Placed' not 'Place Order'"

#### 1.3 Breakout Zone Intelligence

- **Auto-balanced breakout groups**: Distribute participants evenly across zones
- **Zone expertise matching**: Tag participants with domain areas, suggest zone assignments
- **Cross-zone insights**: Surface when different zones discover similar events/terms
- **Zone merge assistant**: Help combine breakout discoveries into main timeline

#### 1.4 Facilitator Dashboard

- **Bird's-eye metrics**: Events/minute, hotspot density, participant engagement at a glance
- **Participation balance**: See who's contributing vs. who might need encouragement
- **Board health indicators**: Coverage gaps, unaddressed hotspots, terminology conflicts
- **Quick actions**: Jump to problem areas, broadcast attention to specific zones

#### 1.5 Voting & Prioritization

- **Dot voting on hotspots**: Built-in voting to prioritize which problems to tackle
- **Opportunity ranking**: Participants vote on which opportunities have highest value
- **Anonymous vs. attributed voting**: Choose whether votes are visible
- **Vote-weighted visualization**: Size hotspots/opportunities by vote count

---

### Category 2: Domain Language & Ubiquitous Language Support

#### 2.1 Glossary-First Design

- **Automatic acronym detection**: Highlight undefined acronyms, prompt for glossary entry
- **Term highlighting**: When a glossary term appears in an event, visually link them
- **Inconsistent terminology detection**: "You used 'Customer' and 'Client'—are these the same?"
- **Glossary diff between workshops**: Compare terminology evolution across sessions

#### 2.2 Language Quality Checks

- **Past-tense enforcement**: Gentle nudges when events aren't past-tense ("Placing Order" → "Order Placed")
- **Ambiguity detection**: Flag vague terms ("Process Complete"—which process?)
- **Business vs. technical language**: Highlight technical jargon, suggest business equivalents
- **Naming pattern suggestions**: Based on EventStorming best practices

#### 2.3 Living Dictionary

- **Exportable ubiquitous language dictionary**: Generate glossary documents for dev teams
- **Version history**: Track how definitions evolved across workshop sessions
- **Cross-reference with codebase**: Show where terms are used in actual code (via integration)

---

### Category 3: Pattern Recognition & Insights

#### 3.1 Automatic Pattern Detection

- **Temporal coupling**: Identify events that always occur together (potential aggregate boundary)
- **Scatter-gather patterns**: Detect fan-out/fan-in event patterns
- **Hotspot clustering**: Visualize problem density areas on timeline
- **Actor bottlenecks**: Highlight when one actor appears in too many events

#### 3.2 Bounded Context Discovery

- **Cluster analysis**: Suggest potential bounded context boundaries based on event groupings
- **Context map generation**: Automatically identify upstream/downstream relationships
- **Shared kernel detection**: Find overlapping concepts between potential contexts
- **Anti-corruption layer suggestions**: When contexts have conflicting terminology

#### 3.3 Process Health Analysis

- **Swimlane coverage**: Are all actors represented across the timeline?
- **Event density heatmap**: Visualize where complexity concentrates
- **Gap detection**: Find suspiciously empty timeline sections
- **Cycle detection**: Identify potentially problematic loops in process flow

#### 3.4 Hotspot Lifecycle Tracking

- **Resolution linking**: Connect hotspots to their resolution (another sticky, external ticket, or decision)
- **Unresolved hotspot dashboard**: Track which problems remain open
- **Hotspot aging**: Visualize how long hotspots have been unaddressed
- **Resolution patterns**: Learn what types of hotspots get resolved vs. persist

---

### Category 4: Workshop Lifecycle Management

#### 4.1 Session Continuity

- **Workshop series linking**: Connect discovery → process → design sessions
- **Drill-down from Big Picture**: Select an event range, spawn Process-Level workshop
- **Insight carry-forward**: Automatically bring relevant glossary terms to next session
- **Context preservation**: Save facilitator notes, participant reflections per session

#### 4.2 Workshop Templates

- **Industry-specific starters**: E-commerce checkout flow, insurance claim process, etc.
- **EventStorming kata library**: Practice scenarios for learning
- **Anti-pattern examples**: "What not to do" for training purposes
- **Template marketplace**: Community-contributed starting points

#### 4.3 Replay & Review

- **Time-travel playback**: Scrub through workshop history to see evolution
- **Milestone snapshots**: Save named checkpoints during workshop
- **Change attribution**: "Who added this event?" with participant info
- **Heat map of changes**: See which areas got most attention/revision

---

### Category 5: AI-Assisted Facilitation

#### 5.1 Real-time AI Copilot

- **Suggested next events**: Based on pattern recognition from training data
- **Missing event detection**: "Between 'Order Placed' and 'Order Shipped', what happens?"
- **Hotspot summarization**: AI-generated summary of problems in each area
- **Facilitation script generation**: Based on current board state, suggest next questions

#### 5.2 Post-Workshop Analysis

- **Executive summary generation**: One-page overview of discoveries
- **Action item extraction**: Pull opportunities and hotspots into prioritized list
- **Risk assessment**: Categorize hotspots by severity and impact
- **Recommendations report**: AI-generated suggestions for improvement

#### 5.3 Learning from History

- **Cross-workshop insights**: Patterns that appear across multiple workshops
- **Organizational knowledge base**: Build corpus of domain knowledge from workshops
- **Prediction**: "Based on similar domains, you might want to explore..."
- **Benchmark against best practices**: Compare workshop quality metrics

---

### Category 6: Integration Ecosystem

#### 6.1 Developer Toolchain Integrations

**Jira/Linear/GitHub Issues:**

- Export opportunities as issues with context
- Link hotspots to existing bug tickets
- Create epics from theme areas
- Two-way sync: Mark issues resolved → update board

**Confluence/Notion/GitBook:**

- Export glossary as living documentation page
- Generate process documentation from timeline
- Embed live board previews in docs
- Sync glossary terms bidirectionally

**Architecture Tools (Structurizr, IcePanel, C4):**

- Export bounded contexts to architecture diagrams
- Generate context maps in C4 notation
- Link actors to component responsibilities
- Sync external systems with architecture registry

#### 6.2 Code-Level Integrations

**IDE Plugins (VS Code, JetBrains):**

- "Where is this event in code?" → Jump to implementation
- Annotate code with EventStorming context
- Generate event class stubs from board
- Ubiquitous language linting in code

**Event Sourcing Frameworks (Axon, EventStoreDB, Marten):**

- Import actual events from production
- Validate board events against schema registry
- Generate event schemas from board
- Compare designed vs. implemented events

**API Design (OpenAPI, AsyncAPI):**

- Export commands as API endpoints
- Generate AsyncAPI specs from event timeline
- Link events to message queue topics
- Validate API naming against ubiquitous language

#### 6.3 Collaboration Tool Integrations

**Slack/Teams:**

- Workshop notifications and reminders
- Share board snapshots in channels
- Bot commands: "Show me hotspots in checkout flow"
- Async contribution via message reactions

**Video Conferencing (Zoom, Meet, Teams):**

- Embedded board in meeting sidebar
- Breakout room ↔ zone synchronization
- Raise hand → board cursor highlight
- Recording timestamped with board snapshots

**Calendar Integration:**

- Schedule workshop series
- Send preparation materials to participants
- Auto-capture attendee expertise tags
- Post-workshop summary emails

#### 6.4 Data & Analytics Integrations

**BI Tools (Metabase, Looker, PowerBI):**

- Workshop metrics dashboard
- Track domain coverage over time
- Measure ubiquitous language adoption
- Compare workshops across teams

**Process Mining (Celonis, ProcessGold):**

- Import discovered process from mining
- Overlay actual process on designed events
- Identify gaps between design and reality
- Validate EventStorming with real data

---

### Category 7: Enterprise Features

#### 7.1 Governance & Compliance

- **Role-based access**: Facilitator, participant, observer, reviewer
- **Audit trail**: Complete history of all changes with attribution
- **Sensitive content flagging**: Mark confidential areas, control export
- **Retention policies**: Auto-archive after configurable period

#### 7.2 Multi-Workshop Management

- **Organization workspace**: Collection of related workshops
- **Cross-workshop search**: Find events/terms across all workshops
- **Team ownership**: Assign workshops to teams with inheritance
- **Templates at org level**: Standardized starting points

#### 7.3 Quality Assurance

- **Peer review workflow**: Submit workshop for review before sharing
- **Completeness checklist**: Ensure all phases completed properly
- **Best practice scoring**: Rate workshop against EventStorming guidelines

---

### Category 8: Visualization & Export Enhancements

#### 8.1 Alternative Visualizations

- **Context map view**: Render bounded contexts and relationships
- **Aggregate view**: Group events by aggregate roots
- **Actor journey view**: Filter timeline to single actor's path
- **Hotspot heatmap**: Overlay problem intensity visualization
- **Story map view**: Transform timeline into user story map format (activities → tasks → stories)
- **Swimlane auto-suggestion**: Detect actor/system clusters and suggest creating lanes

#### 8.2 Rich Export Formats

- **SVG with layers**: Export with semantic layers (events, actors, etc.)
- **PowerPoint generator**: Workshop summary as presentation
- **PDF report**: Comprehensive workshop documentation
- **Mermaid/PlantUML**: Generate sequence diagrams from flow
- **Domain model starter code**: Generate aggregate/event/command class stubs in target language

#### 8.3 Smart Layout Tools

- **Auto-timeline alignment**: Snap events to horizontal baseline; maintain left-to-right temporal flow
- **Magnetic guides**: Events align to implicit grid during placement
- **Cluster compaction**: Automatically tighten spacing in dense areas while preserving readability

#### 8.4 Presentation Mode

- **Guided walkthrough**: Step through timeline with annotations
- **Highlight path**: Trace specific flows for stakeholders
- **Progressive reveal**: Show board building up phase by phase
- **Laser pointer**: Facilitator can draw attention to areas

---

### Category 9: Learning & Community

#### 9.1 Built-in Learning

- **Interactive tutorials**: Learn EventStorming while doing it
- **Best practice hints**: Contextual tips from Alberto Brandolini's writings
- **Common mistakes guide**: "This looks like X antipattern, consider Y"

#### 9.2 Community Features

- **Template sharing**: Publish and discover community templates
- **Anonymized case studies**: Opt-in sharing of workshop structures
- **Facilitator network**: Connect with experienced EventStormers
- **Workshop recording sharing**: Educational videos with board sync

---

### Category 10: Mobile & Accessibility

#### 10.1 Mobile Participation

- **Mobile-first participant view**: Easy sticky creation on phone
- **Camera → sticky**: Take photo, auto-extract text, create sticky
- **Voice-to-sticky**: Speak an event, auto-transcribe and create
- **QR code join**: Instant workshop participation

#### 10.2 Accessibility

- **Screen reader support**: Full navigation and creation via screen reader
- **Colorblind modes**: Alternative color schemes preserving semantics
- **High contrast mode**: For visually impaired participants
- **Keyboard-only navigation**: Complete workflow without mouse

---

## Priority Assessment

### Highest Impact Differentiation (Hard to Replicate)

1. **Ubiquitous Language Intelligence** (2.1-2.3) - Core to DDD, generic tools can't do this
2. **Pattern Recognition** (3.1-3.2) - EventStorming-specific expertise encoded in tool
3. **Workshop Lifecycle Management** (4.1) - Connect discovery → design → code
4. **Code-Level Integrations** (6.2) - Bridge gap between workshop and implementation
5. **AI Facilitation Copilot** (5.1) - Trained on EventStorming best practices

### Medium Effort, High Value

1. **Phase Progression Intelligence** (1.1) - Leverage existing phase system
2. **Export to Issue Trackers** (6.1) - Natural workflow continuation
3. **Alternative Visualizations** (8.1) - Unique perspectives on same data
4. **Time-travel Playback** (4.3) - Yjs history already exists
5. **Facilitator Dashboard** (1.4) - Bird's-eye view makes remote facilitation dramatically easier
6. **Dot Voting** (1.5) - Built-in prioritization no generic tool offers natively
7. **Hotspot Lifecycle Tracking** (3.4) - Resolution tracking closes the loop on workshop outputs

### Community/Ecosystem Plays

1. **Template Marketplace** (4.2) - Network effects
2. **Learning Integration** (9.1) - Capture facilitator market
3. **Process Mining Integration** (6.4) - Enterprise validation use case

---

## Next Steps

This brainstorm provides a comprehensive menu of differentiation opportunities. Recommend:

1. **Validate with target users** - Which features resonate most with facilitators?
2. **Technical feasibility study** - Which integrations are most practical?
3. **Competitive analysis** - Which features already exist in Miro plugins?
4. **Prioritize by effort/impact** - Build roadmap based on value delivery
