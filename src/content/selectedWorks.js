import { MONEY_MOVEMENT_DEMO } from "./demos/moneyMovement";

// Selected Works (Figma 2241:1505). Each project has one or more features;
// with more than one, the pills switch the caption (and the image, when the
// feature has its own `image`) under the project. A feature's `caseStudy`
// (a key in CASE_STUDIES) enables "Read Case Study".

export const SELECTED_WORKS = [
  {
    id: "anchor-front-office",
    title: "Anchor Front office 2.0",
    summary: [
      "Designed a customer-facing infrastructure dashboard from 0 to 1, shaping the end-to-end experience for 1,000+ businesses.",
      "Adoption reached 84.7%, even though users could switch back to the old dashboard at any time.",
    ],
    image: {
      src: "/asset/selected/anchor-front-office.webp",
      alt: "Anchor dashboard Accounts page with the Nigerian Naira account and requests for USD, MAD and GBP accounts",
    },
    features: [
      {
        title: "Global Account Request",
        description:
          "This is an end to end experience of how businesses today request account supported for there entity and outside there entity capacity.",
      },
      {
        title: "Money Movement",
        // Caption heading, when it differs from the pill label.
        heading: "Money movement",
        description:
          "Making the process of moving money feel less like a task, crafted with flexibility and clarity.",
        image: {
          src: "/asset/selected/anchor-money-movement.webp",
          alt: "Anchor Transactions page with the Move money menu open: transfer to self, to an Anchor account, to an external bank, fund a card, withdraw from a card",
        },
        // Plays over the image: a cursor walks through a transfer.
        demo: MONEY_MOVEMENT_DEMO,
      },
      { title: "Timeline Management" },
      { title: "Cards Product" },
    ],
  },
  {
    id: "anchor-back-office",
    title: "Anchor Back office 2.0",
    summary: [],
    image: {
      src: "/asset/selected/anchor-back-office.webp",
      alt: "Anchor back office home dashboard",
    },
    // No feature heading: the caption is just the project description.
    features: [
      {
        description:
          "I architected and designed the internal dashboard that manages and processes $2.5 million over a three-year period",
      },
    ],
  },
];
