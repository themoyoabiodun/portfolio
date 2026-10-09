// Selected Works (Figma 2241:1505). Each project has one or more features;
// with more than one, the pills switch the caption under the image. A
// feature's `caseStudy` (a key in CASE_STUDIES) enables "Read Case Study".

export const SELECTED_WORKS = [
  {
    id: "anchor-front-office",
    title: "Anchor Front office 2.0",
    summary: [
      "0 to 1 design of the end to end experience of the infrastructure customer facing dashboard that is used by 1,000 plus business.",
      "Adoption went up to 84.7%, even though users were given the flexibility to switch between this and the old dashboard.",
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
      { title: "KYB Onboarding" },
      { title: "Timeline Management" },
      { title: "Cards Product" },
    ],
  },
  {
    id: "anchor-back-office",
    title: "Anchor Back office 2.0",
    summary: [
      "I architected and design on the end internal dashboard that manages and process $2.5 million dollars over the duration of 3 years",
    ],
    image: {
      src: "/asset/selected/anchor-back-office.webp",
      alt: "Anchor back office home dashboard",
    },
    features: [
      {
        title: "Global Account Request",
        description:
          "This is an end to end experience of how businesses today request account supported for there entity and outside there entity capacity.",
      },
    ],
  },
];
