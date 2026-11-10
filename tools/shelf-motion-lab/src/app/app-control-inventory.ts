import type { ToolcraftControlSectionInventoryEntry } from "./acceptance/types";
import { SHELF_MOTION_TARGETS as t, SHELF_VIEW_TARGET } from "./shelf/motion-values";
import {
  CAROUSEL_TARGETS as c,
  OPEN_BOOK_TARGETS as o,
  SCENE_MODE_TARGET,
} from "./shelf/phone-values";

const MODE_REQUEST_TEXT =
  "I also want the tool to cater for the sliding view of the book in the homepage. I've added the design.\n\nhttps://www.figma.com/design/5YusE8XzdQictaWqt2Bf9C/Book-Stack?node-id=74-2077&t=9ZfWvedQB1untbxS-11";

export const appControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] = [
  {
    entity: "Animated scene",
    entityId: "animated-scene",
    finiteSelectors: [
      {
        affectedTargets: [],
        productMode: {
          request: {
            messageRef:
              "claude.ai/code session_01Sky6R6ztZW1ACzimqFPcu9, user message adding Figma node 74-2077 (home carousel)",
            messageText: MODE_REQUEST_TEXT,
            quote: "I also want the tool to cater for the sliding view of the book in the homepage.",
            source: "user-message",
          },
          sharedTargets: [SHELF_VIEW_TARGET, "export.image.format", "export.image.resolution"],
        },
        reason: "Chooses the shelf add, the home carousel swipe or the open-book transition and their controls.",
        role: "branch",
        target: SCENE_MODE_TARGET,
      },
    ],
    groupingReason:
      "The animation being tuned and the camera that views it apply to every scene.",
    id: "scene",
    targets: [SCENE_MODE_TARGET, SHELF_VIEW_TARGET],
    title: "Scene",
  },
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
    groupingReason: "The landing slot decides where on the shelf the add happens.",
    id: "shelf",
    targets: [t.insert],
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
    entity: "Home carousel swipe",
    entityId: "home-carousel-swipe",
    finiteSelectors: [],
    groupingReason:
      "Drag, snap, neighbour depth and title handoff jointly shape one swipe between covers.",
    id: "carousel",
    targets: Object.values(c),
    title: "Carousel",
  },
  {
    entity: "Open-book travel",
    entityId: "open-book-travel",
    finiteSelectors: [
      {
        affectedTargets: [],
        reason: "The source layout decides whether a grid cover can be chosen.",
        role: "branch",
        target: o.source,
      },
      {
        reason: "The tapped book changes which grid cover travels to the detail page.",
        role: "parameter",
        target: o.book,
      },
    ],
    groupingReason:
      "Source, press, lift, travel, spine turn, arc and parting shape the cover's trip to the detail page.",
    id: "open-book",
    targets: [o.source, o.book, o.press, o.lift, o.travelTime, o.travelBounce, o.spineTurn, o.arc, o.part],
    title: "Open Book",
  },
  {
    entity: "Detail page reveal",
    entityId: "detail-page-reveal",
    finiteSelectors: [],
    groupingReason:
      "The colour flood, staggered rise and back transition shape how the detail page arrives and leaves.",
    id: "detail",
    targets: [o.floodTime, o.stagger, o.rise, o.backTime],
    title: "Detail Page",
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
