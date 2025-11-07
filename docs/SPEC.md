## SPEC.md

### Core Behavior
1. **Guided Facilitation Flow**  
   - Facilitator introduces one concept at a time (events → hotspots → pivotal events → swimlanes → actors/systems → opportunities → glossary).
   - Palette updates automatically to show only available sticky types.
   - Any participant can create new items once a type is introduced.

2. **Collaboration Features**
   - Real-time multi-user editing and presence (avatars + cursors).
   - Facilitator can divide the board into zones (e.g., for breakout work).
   - Participants can self-assign to zones; facilitator sees balance view.

3. **Visual Grammar (Big Picture EventStorming)**
   - **🟧 Events**: past-tense statements of what happened.
   - **🟥 Hotspots**: problems, risks, uncertainties.
   - **🟧 Pivotal Events**: domain events snapped to vertical milestone lines.
   - **🟦 Vertical Lines**: pivotal boundaries between sub-processes.
   - **Horizontal Lines**: swimlanes; user-created, labelable.
   - **🟨 Actors** (half-height yellow) and **🟪 Systems** (half-height lilac) positioned left of events.
   - **🟩 Opportunities**: improvements placed above timeline.
   - **🟫 Glossary Notes**: definitions of acronyms or terms.

4. **Facilitation Features**
   - **Phase system**: controlled palette per phase.
   - **Demonstration mode**: facilitator highlights new concept before enabling it.
   - **Undo/redo** and **checkpointing** for workshop stages.
   - **Zone creation** for group work (participant self-assignment, SME tagging).

5. **Semantic Validation**
   - Pivotal event must have ≥1 actor.
   - Events should be past-tense.
   - Commands not visible in Big Picture mode.
   - Glossary assistant can auto-detect unknown acronyms.

6. **Typography & Visuals**
   - Font system: Inter / system sans.
   - Font themes (Workshop Marker, Clean Sans, Technical, Domain Map).
   - Facilitator defines global font theme via settings.
   - Font roles: Events (bold large), Labels (uppercase bold), Glossary (regular small).

7. **Aesthetic & UX Guidelines Integration**
   - Neutral tone, balanced whitespace.
   - Smooth transitions on hover or state change.
   - No clutter; only meaningful UI elements visible.
   - Autosave + undo per session.
   - Tooltip help for each element type.

8. **Glossary Support**
   - Dedicated top-row area for definitions.
   - Auto-suggestion from text parsing.
   - Hovering a term in notes highlights glossary entry.

### Data and Export
- Boards export as `.json` with schema versioning.
- Future: snapshot to image or PDF.

### Future Directions (AI-Assisted)
- Automatic glossary extraction.
- Past-tense enforcement suggestions.
- Pattern recognition for clusters or hotspots.
- Semantic similarity grouping for theme extraction.

### Outstanding Questions
- Should facilitator be able to predefine zones and participant expertise before session start?
- Should glossary be part of core board schema or an optional module?