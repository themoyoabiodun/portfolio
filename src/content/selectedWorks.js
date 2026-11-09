import { MONEY_MOVEMENT_DEMO } from "./demos/moneyMovement";

// Selected Works (Figma 2241:1505). Each project has one or more features;
// with more than one, pills switch the image (when the feature has its own
// `image`). A feature's `caseStudy` (a key in CASE_STUDIES) enables "Read
// Case Study". Images are 666 wide; `height` sets the frame's aspect.

export const SELECTED_WORKS = [
  {
    id: "novem",
    title: "Novem",
    summary: [
      "Designed an end-to-end money movement platform for businesses and financial institutions operating across emerging markets. Built a unified dashboard that simplifies payment operations, account management, transaction tracking, and ledger reconciliation across local fiat and stablecoin rails, helping customers manage their financial operations with greater visibility, control, and confidence.",
    ],
    // A `video` plays in place of the image: muted, looping, only on screen.
    // `src` is the H.264 fallback; `sources` are tried first (AV1 is ~25%
    // smaller at the same quality). `poster` shows until playback starts.
    image: {
      src: "/asset/selected/novem-table.mp4",
      video: true,
      sources: [
        {
          src: "/asset/selected/novem-table-av1.mp4",
          type: 'video/mp4; codecs="av01.0.08M.08"',
        },
      ],
      poster: "/asset/selected/novem-table-poster.jpg",
      alt: "Screen recording of the Novem dashboard table",
      height: 427,
    },
    features: [{}],
  },
  {
    id: "anchor-front-office",
    title: "Anchor Front office 2.0",
    summary: [
      "Designed a customer-facing infrastructure dashboard from 0 to 1, shaping the end-to-end experience for 1,000+ businesses. Adoption reached 84.7%, even though users could switch back to the old dashboard at any time.",
    ],
    image: {
      src: "/asset/selected/anchor-front-office.webp",
      alt: "Anchor dashboard Accounts page with the Nigerian Naira account and requests for USD, MAD and GBP accounts",
    },
    features: [
      {
        title: "Money Movement",
        image: {
          src: "/asset/selected/anchor-money-movement.webp",
          alt: "Anchor Transactions page listing outbound transfers, with the Send Money button",
        },
        // Plays over the image: a cursor walks through a transfer.
        demo: MONEY_MOVEMENT_DEMO,
      },
      { title: "Global Account Request" },
      { title: "Timeline Management" },
      { title: "Cards Product" },
    ],
  },
  {
    id: "anchor-back-office",
    title: "Anchor Back office 2.0",
    summary: [
      "I architected and designed the internal dashboard that manages and processes $2.5 million over a three-year period",
    ],
    image: {
      src: "/asset/selected/anchor-back-office.webp",
      alt: "Anchor back office overview with balances, balance history, cash flow and providers",
    },
    features: [{}],
  },
];
