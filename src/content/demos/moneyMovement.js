// Scripted walkthrough of Anchor's "Transfer to self" flow (Figma 2256:3565,
// first row). Coordinates are in the screens' own 1440×1024 frame, so they
// can be read straight off the Figma file.
const step = (n, alt) => ({
  src: `/asset/selected/money-movement/step-${n}.webp`,
  alt,
});

export const MONEY_MOVEMENT_DEMO = {
  size: [1440, 1024],
  screens: [
    step(1, "Transactions page with the Send Money menu open"),
    step(2, "Transfer to self form with the source account list open"),
    step(3, "Transfer to self form filled in"),
    step(4, "Review and confirm transfer"),
    step(5, "Authenticator code prompt"),
    step(6, "Authenticator code entered, Verify enabled"),
    step(7, "Transfer details with a sent successfully toast"),
  ],
  // The six authenticator boxes on screens 5–6, typed into by the "type"
  // action.
  code: {
    screens: [4, 5],
    boxes: [
      [613, 396],
      [649, 396],
      [685, 396],
      [753, 396],
      [789, 396],
      [825, 396],
    ],
  },
  cursor: [880, 720],
  // `camera` frames a point at a zoom; `move` glides the cursor; `click`
  // presses where the cursor is; `screen` crossfades. `parallel` starts the
  // action without waiting for it.
  script: [
    { wait: 700 },
    { camera: [1190, 230], zoom: 1.8, duration: 1100, parallel: true },
    { move: [1260, 140], duration: 1100 },
    { move: [1150, 126], duration: 450 },
    { wait: 250 },
    { click: true },
    { screen: 1 },
    { camera: [900, 300], zoom: 1.7, duration: 900, parallel: true },
    { move: [1010, 246], duration: 1000 },
    { wait: 250 },
    { click: true },
    { screen: 2 },
    { wait: 700 },
    { camera: [960, 180], zoom: 1.5, duration: 900, parallel: true },
    { move: [1366, 34], duration: 1000 },
    { wait: 200 },
    { click: true },
    { screen: 3 },
    { camera: [960, 190], zoom: 1.5, duration: 900, parallel: true },
    { move: [760, 210], duration: 900 },
    { wait: 900 },
    { move: [1354, 34], duration: 900 },
    { wait: 200 },
    { click: true },
    { screen: 4 },
    { camera: [720, 340], zoom: 1.9, duration: 1000, parallel: true },
    { move: [616, 400], duration: 1000 },
    { click: true },
    { type: "482913", interval: 130 },
    { screen: 5, fade: 150 },
    { wait: 300 },
    { move: [880, 478], duration: 700 },
    { wait: 200 },
    { click: true },
    { screen: 6 },
    // Land on the success toast, then pull back to the whole page.
    { camera: [760, 840], zoom: 1.5, duration: 1100, parallel: true },
    { move: [1000, 930], duration: 1100 },
    { wait: 1300 },
    { camera: [720, 512], zoom: 1, duration: 1100 },
    { wait: 1800 },
    { screen: 0, fade: 400 },
    { move: [880, 720], duration: 900 },
  ],
};
