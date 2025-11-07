import { FacilitationPhase, ElementType } from "../types/domain";

/**
 * Maps each facilitation phase to the element types available in that phase.
 * Based on Big Picture EventStorming methodology from Alberto Brandolini.
 */
export const PHASE_ELEMENTS: Record<FacilitationPhase, ElementType[]> = {
  "chaotic-exploration": ["event", "hotspot"],
  "enforce-timeline": [
    "event",
    "hotspot",
    "vertical-line",
    "horizontal-lane",
    "theme-area",
  ],
  "people-and-systems": [
    "event",
    "hotspot",
    "vertical-line",
    "horizontal-lane",
    "theme-area",
    "actor",
    "system",
  ],
  "problems-and-opportunities": [
    "event",
    "hotspot",
    "vertical-line",
    "horizontal-lane",
    "theme-area",
    "actor",
    "system",
    "opportunity",
  ],
  glossary: [
    "event",
    "hotspot",
    "vertical-line",
    "horizontal-lane",
    "theme-area",
    "actor",
    "system",
    "opportunity",
    "glossary",
  ],
};

/**
 * Returns the list of element types available for a given phase.
 */
export function getAvailableElements(phase: FacilitationPhase): ElementType[] {
  return PHASE_ELEMENTS[phase];
}

/**
 * Checks if a specific element type is available in a given phase.
 */
export function isElementAvailable(
  phase: FacilitationPhase,
  elementType: ElementType
): boolean {
  return PHASE_ELEMENTS[phase].includes(elementType);
}

/**
 * Human-readable labels for each phase.
 */
export const PHASE_LABELS: Record<FacilitationPhase, string> = {
  "chaotic-exploration": "Chaotic Exploration",
  "enforce-timeline": "Enforcing the Timeline",
  "people-and-systems": "People and Systems",
  "problems-and-opportunities": "Problems and Opportunities",
  glossary: "Glossary",
};
