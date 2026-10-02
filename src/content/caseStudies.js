// Case studies shown in the side drawer, keyed by work card name. Body
// blocks: { h2 }, { h3 }, { p }, { list: [...] }, { code }.
// Copy follows the Figma drawer design (node 2215:1183).

export const CASE_STUDIES = {
  "budget-fix": {
    title: "The nav bar that gets out of the way.",
    meta: [
      { icon: "role", label: "Role", value: "Product Design, Design Engineer" },
      { icon: "project", label: "Project", value: "Exploration" },
      { icon: "date", label: "Date", value: "August, 2026" },
    ],
    link: {
      label: "https://github.com/themoyoabiodun/bottom-navigation-behaviour",
      href: "https://github.com/themoyoabiodun/bottom-navigation-behaviour",
    },
    sections: [
      [
        { h2: "The problem I kept noticing" },
        {
          p: "Bottom navigation has a quiet tension. It has to be there, always reachable. But the moment you start scrolling, it’s a slab of UI sitting on top of the thing you actually came to see.",
        },
        {
          p: "Most apps pick a side. Either the bar stays fixed and eats screen space, or it hides completely and you have to scroll up to get it back. Both work. Neither feels alive.",
        },
        {
          p: "Then I paid attention to how Instagram handles it. I don’t know how their team built it, and I’m not going to pretend I do. This is a reading from the outside, as a user. What I noticed is that the bar doesn’t disappear and doesn’t just sit there. It reacts. You scroll, it recedes. You stop, it settles back. It never leaves, it just gets out of your way, and the whole screen feels like it’s responding to your thumb.",
        },
        {
          p: "That’s a design decision hiding inside a motion. I wanted to build it properly, and then I wanted to make it something other people could drop into their own apps.",
        },
      ],
      [
        { h2: "The brief I gave myself" },
        {
          p: "I was building a SwiftUI budgeting app from a Figma design. The brief for the nav was two sentences:",
        },
        {
          list: [
            "While the user scrolls, the nav shrinks from 100% to 80%.",
            "When they stop, it returns to 100%.",
          ],
        },
        {
          p: "Simple to say. The details took longer, and that’s where the craft was.",
        },
      ],
      [
        { h2: "Where “simple” got complicated" },
        [
          { h3: "“When they stop” is not when the finger lifts." },
          {
            p: "My first version used a drag gesture on the scroll view: finger down, shrink; finger up, grow. It looked fine in a quick test and felt wrong in use. A flick keeps the content moving long after the finger leaves. The nav would pop back to full size while the list was still flying underneath it.",
          },
          {
            p: "The right signal is the scroll view’s own state, including momentum. On iOS 18 and later, SwiftUI exposes this through scroll phases, and anything other than idle counts as scrolling. On iOS 17 I fall back to touch tracking, which can’t see momentum. I documented that limit rather than hiding it.",
          },
        ],
        [
          { h3: "The comeback needs a pause." },
          {
            p: "If the nav grows the instant scrolling stops, it flickers between flicks. You flick, it grows, you flick again, it shrinks. It reads as jitter.",
          },
          {
            p: "So I added a 0.8-second delay before the nav returns to default. Every new scroll cancels the pending return. The nav only settles once you’ve really stopped. That small debounce took the behavior from “reactive” to “composed”.",
          },
        ],
        [
          { h3: "The animation bug that wasn’t visible." },
          {
            p: "At one point the shrink-and-regrow simply stopped working, with no error. The cause was mixing animated and unanimated state changes in the same block, plus nested delayed callbacks. The fix was boring and reliable: plain state mutations, one implicit animation tied to the state value, and a single flat delayed task.",
          },
          {
            p: "I also learned not to trust my own testing here. Tapping and swiping in a simulator can make animations look instant. To verify, I slowed the restore delay way down and measured the pill’s actual pixel width: 80% while scrolling, back to full size after the delay.",
          },
        ],
      ],
      [
        { h2: "The second design decision: what’s the product?" },
        {
          p: "Once it worked in the app, I extracted it into a Swift package. My first draft bundled everything: the icon bar, the sliding highlight, selection state, haptics.",
        },
        {
          p: "Then I stepped back and asked what I was really offering. It wasn’t the icons. Every app has its own. The reusable thing was the behavior.",
        },
        {
          p: "So I cut the package down to one idea. You hand it any view, and it handles how that view responds to scrolling:",
        },
        {
          // From the package README (FloatingNavKit).
          code: `import FloatingNavKit

ScrollView {
    // your content
}
.floatingNav {
    MyTabBar()          // any View
}`,
        },
        {
          p: "Four knobs, nothing else: shrink scale, restore delay, animation, bottom padding.",
        },
        {
          p: "I did bring a placeholder icon bar back, because a behavior package you can’t see working is hard to evaluate. Call .floatingNav() with no closure and you get a stand-in bar. It’s clearly labeled as a placeholder, and it’s one line to replace.",
        },
        {
          p: "That’s the part I’d flag for other design engineers: the instinct is to ship the component. Often the thing worth shipping is the behavior. A component has opinions about visuals. A behavior travels.",
        },
      ],
    ],
  },
};
