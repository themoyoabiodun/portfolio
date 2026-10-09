// Scripted walkthrough of Anchor's "Transfer to self" flow (Figma 2261:57512).
// Coordinates are in the screens' own 1440×1024 frame, so they can be read
// straight off the Figma file.
const step = (n) => `/asset/selected/money-movement/step-${n}.webp`;

export const MONEY_MOVEMENT_DEMO = {
  size: [1440, 1024],
  // Steps 5–7 are built from the Figma frames to show the form filling in:
  // source picked, destination list open, both accounts picked.
  screens: [
    step(1), // Transactions
    step(2), // Send Money menu
    step(3), // Transfer to self, empty form
    step(4), // Source account list open
    step(5), // Source picked
    step(6), // Destination list open
    step(7), // Both accounts picked, amount and description empty
    step(8), // Form filled, Proceed enabled
    step(9), // Summary
    step(10), // Verification
    step(11), // Verification, Verify enabled
    step(12), // Transaction details with the success toast
  ],
  // Typed fields reveal the filled form's own text one glyph at a time;
  // `rect` is [x, y, height] of the text line and `stops` the right edge of
  // each glyph from its start.
  fields: {
    amount: {
      screen: 7,
      rect: [645.33, 448, 33.33],
      // Clears the placeholder once typing starts.
      cover: 255,
      stops: [10.67, 18, 26.67, 29.33, 38, 46, 54],
    },
    description: {
      screen: 7,
      rect: [532, 596.67, 23.33],
      cover: 370,
      stops: [
        8, 14.67, 22, 33.33, 41.33, 48.67, 54, 62.67, 70, 80.67, 88, 96.67,
        104.67, 112.67, 118, 122.67, 137.33, 141.33, 148.67, 155.33, 162.67,
        170, 177.33, 182.67, 197.33, 204.67, 210.67, 217.33, 224.67, 229.33,
        232.67, 240, 248, 259.33, 266.67, 278, 286, 293.33, 296.67, 304.67, 312,
      ],
    },
  },
  // The six authenticator boxes on the verification screens.
  code: {
    screens: [9, 10],
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
  // `move` glides the cursor; `click` presses where it is; `screen`
  // crossfades; `fill` types into a field; `code` types the authenticator
  // code.
  script: [
    { wait: 600 },
    { move: [1353, 72], duration: 1000 },
    { click: true },
    { screen: 1, fade: 150 },
    { move: [1150, 128], duration: 700 },
    { wait: 150 },
    { click: true },
    { screen: 2 },
    { move: [720, 183], duration: 800 },
    { click: true },
    { screen: 3, fade: 150 },
    { move: [600, 288], duration: 600 },
    { click: true },
    { screen: 4, fade: 150 },
    { move: [720, 292], duration: 600 },
    { click: true },
    { screen: 5, fade: 150 },
    { move: [610, 461], duration: 700 },
    { click: true },
    { screen: 6, fade: 150 },
    { move: [780, 465], duration: 700 },
    { click: true },
    { fill: "amount", interval: 110 },
    { move: [700, 615], duration: 700 },
    { click: true },
    { fill: "description", interval: 40 },
    { wait: 300 },
    { screen: 7, fade: 200 },
    { move: [1370, 33], duration: 900 },
    { click: true },
    { screen: 8 },
    { move: [760, 230], duration: 800 },
    { wait: 700 },
    { move: [1356, 33], duration: 900 },
    { click: true },
    { screen: 9 },
    { move: [616, 400], duration: 800 },
    { click: true },
    { code: "482913", interval: 130 },
    { screen: 10, fade: 150 },
    { wait: 250 },
    { move: [879, 477], duration: 600 },
    { click: true },
    { screen: 11 },
    { move: [1000, 900], duration: 1000 },
    { wait: 2600 },
    { screen: 0, fade: 400 },
    { move: [880, 720], duration: 900 },
  ],
};
