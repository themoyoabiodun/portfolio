import type { ToolcraftControlSectionInventoryEntry } from "./acceptance/types";
import { SHELF_MOTION_TARGETS as t, SHELF_VIEW_TARGET } from "./shelf/motion-values";

export const appControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] = [
  {
    entity: "Shelf scene",
    entityId: "shelf-scene",
    finiteSelectors: [
      {
        reason: "Insert position changes only which slot the book lands in.",
        role: "parameter",
        target: t.insert,
      },
    ],
    groupingReason:
      "The landing slot and the camera view both describe where the add happens on the shelf.",
    id: "shelf",
    targets: [t.insert, SHELF_VIEW_TARGET],
    title: "Shelf",
  },
  {
    entity: "Pick-up motion",
    entityId: "pickup-motion",
    finiteSelectors: [],
    groupingReason:
      "Anticipation and lift settings jointly shape the first beat, before the book travels.",
    id: "pickup",
    targets: [t.anticipation, t.anticipationTime, t.lift, t.liftTilt, t.liftTime, t.liftBounce],
    title: "Pick Up",
  },
  {
    entity: "Flight motion",
    entityId: "flight-motion",
    finiteSelectors: [
      {
        reason: "Extra spins changes only how many turns the book makes in flight.",
        role: "parameter",
        target: t.spins,
      },
    ],
    groupingReason:
      "Duration, bounce, arc, spins, tilt and the parting cue jointly shape the travel to the shelf.",
    id: "flight",
    targets: [t.flightTime, t.flightBounce, t.arc, t.spins, t.flightTilt, t.partAt],
    title: "Flight",
  },
  {
    entity: "Landing motion",
    entityId: "landing-motion",
    finiteSelectors: [],
    groupingReason:
      "Drop, squash, settle, nudge and shelf bounce jointly shape the impact that confirms the add.",
    id: "landing",
    targets: [t.dropHeight, t.dropTime, t.squash, t.settleBounce, t.nudge, t.shelfBounce],
    title: "Landing",
  },
  {
    entity: "Landing confirmation",
    entityId: "landing-confirmation",
    finiteSelectors: [
      {
        affectedTargets: [],
        reason: "Landing glow decides whether its color setting is relevant.",
        role: "branch",
        target: t.glow,
      },
    ],
    groupingReason: "The glow switch and its color configure one confirmation light.",
    id: "confirmation",
    targets: [t.glow, t.glowColor],
    title: "Confirmation",
  },
  {
    entity: "Output background",
    entityId: "output-background",
    finiteSelectors: [
      {
        affectedTargets: ["appearance.background"],
        reason: "Background inclusion determines whether its color affects output.",
        role: "branch",
        target: "export.includeBackground",
      },
    ],
    groupingReason:
      "Inclusion and color jointly define the preview and exported background behind the shelf.",
    id: "background",
    targets: ["export.includeBackground", "appearance.background"],
    title: "Background",
  },
  {
    entity: "Image delivery",
    entityId: "image-delivery",
    finiteSelectors: [
      {
        reason: "Image format changes its own exported artifact encoding.",
        role: "parameter",
        target: "export.image.format",
      },
      {
        reason: "Image resolution changes its own exported artifact dimensions.",
        role: "parameter",
        target: "export.image.resolution",
      },
    ],
    groupingReason: "Format and resolution jointly configure the exported shelf frame.",
    id: "runtime.image-export",
    targets: ["export.image.format", "export.image.resolution"],
    title: "Image Export",
  },
];
