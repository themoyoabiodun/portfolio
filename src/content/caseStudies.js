// Case studies shown in the side drawer, keyed by work card name. Body
// blocks: { h2 }, { h3 }, { p }, { list: [...], ordered? },
// { code, lang? } and { table: { head: [...], rows: [[...]] } }.
// Text in p, list items and table cells is a string or an array of runs:
// strings, { b } for bold and { code } for inline code (b may nest code).
// Layout follows the Figma drawer design (node 2215:1183).

export const CASE_STUDIES = {
  "budget-fix": {
    title: "Bottom Navigation Behaviour",
    meta: [
      { icon: "role", label: "Role", value: "Product Designer, Design Engineer" },
      { icon: "project", label: "Project", value: "Exploration" },
      { icon: "date", label: "Date", value: "August, 2026" },
      {
        icon: "github",
        label: "Resource",
        value: "Github Link",
        href: "https://github.com/themoyoabiodun/bottom-navigation-behaviour",
      },
    ],
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
    MyTabBar() // any View
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
  "scroll-interaction": {
    title: "The Morphing Header: Scroll-Driven Continuity",
    meta: [
      { icon: "role", label: "Role", value: "Product Designer, Design Engineer" },
      { icon: "project", label: "Project", value: "Exploration" },
      { icon: "date", label: "Date", value: "October, 2026" },
    ],
    sections: [
      [
        {
          p: "When you scroll, the page title doesn’t leave the screen. It slides up into the header bar and stays there as the page’s label. In the video, an Anchor onboarding screen opens with “Your Application is Submitted, We’ll Start Reviewing it Shortly.” under the logo bar. As the checklist scrolls, that title rises into the same row as the logo and “Skip to Sandbox.” The helper copy under it drops away, and the sections scroll underneath.",
        },
        {
          p: "The title doesn’t disappear and then come back as a smaller copy. It is the same element, and it changes where it sits. That continuity is what makes the interaction work.",
        },
      ],
      [
        { h2: "Anatomy of the morph" },
        {
          p: "The interaction has two states and one scroll-linked transition between them. Most of the work is deciding what each element does along the way.",
        },
        {
          table: {
            head: ["Element", "At rest (top of page)", "Scrolled", "During transition"],
            rows: [
              [
                "Page title",
                "In the body, one row below the logo bar",
                "In the header row, level with the logo",
                "Moves up, tied to scroll position",
              ],
              ["Helper copy", "Visible under the title", "Gone", "Fades and slides up behind the title"],
              [
                "Header bar",
                "Logo and “Skip to Sandbox” only",
                "Logo, title and action share one row",
                "Gains a surface and a hairline once content passes under it",
              ],
              [
                "Checklist",
                "Starts below the helper copy",
                "Scrolls under the pinned header",
                "Moves at normal scroll speed",
              ],
            ],
          },
        },
        {
          p: "Scroll back to the top and every step runs in reverse. The title returns to its place in the body and the helper copy comes back.",
        },
      ],
      [
        { h2: "Why it works" },
        {
          p: "The title is the user’s anchor, so keeping it on screen keeps them oriented. On a long checklist like this one, you can be six sections deep and still see that you are on the submitted application. You never have to scroll back to check.",
        },
        {
          list: [
            [
              { b: "Continuity over replacement." },
              " A title that moves is read as the same object. A title that vanishes and reappears as a compact bar has to be recognised a second time.",
            ],
            [
              { b: "Space is handed back." },
              " The helper copy is useful once and then only takes up room. Letting it drop gives the list more vertical space when the user is actually scanning it.",
            ],
            [
              { b: "The header earns its content." },
              " At the top, the header has little in it. Once the title moves in, it becomes a real context bar: who (logo), where (title) and what next (action).",
            ],
            [
              { b: "Scroll-linked, not time-based." },
              " Because the motion follows the finger or wheel, the user drives it. It can be paused partway and reversed, so it never feels like the page is acting on its own.",
            ],
          ],
        },
      ],
      [
        { h2: "Building it" },
        {
          p: "Map scroll distance to a progress value from 0 to 1. Then drive every property from that one value. Measure the distance as the gap between the title’s resting position and its slot in the header, about 24px in the video.",
        },
        {
          ordered: true,
          list: [
            [
              { b: "Keep one title element." },
              " Make it ",
              { code: "position: sticky" },
              " with a ",
              { code: "top" },
              " that matches the header row, so the browser pins it in the right place. Don’t clone it into the header.",
            ],
            [
              { b: "Derive progress." },
              " ",
              { code: "p = clamp(scrollY / travel, 0, 1)" },
              ". Here ",
              { code: "travel" },
              " is the distance the title moves.",
            ],
            [
              { b: ["Map properties to ", { code: "p" }, "."] },
              " Helper copy: ",
              { code: "opacity: 1 - p*2" },
              " (gone by halfway) and a small upward ",
              { code: "translateY" },
              ". Header: background and border opacity follow ",
              { code: "p" },
              ". If the title shrinks, use ",
              { code: "transform: scale()" },
              ", not ",
              { code: "font-size" },
              ".",
            ],
            [
              { b: "Use native scroll timelines where supported." },
              " CSS ",
              { code: "animation-timeline: scroll()" },
              " with ",
              { code: "animation-range: 0 24px" },
              " runs on the compositor. Fall back to a ",
              { code: "requestAnimationFrame" },
              " listener, or use Framer Motion’s ",
              { code: "useScroll" },
              " + ",
              { code: "useTransform" },
              ", which is how a Framer prototype like this one would be wired.",
            ],
            [
              { b: "Reserve space." },
              " Give the header row a fixed height and keep a slot for the title from the start. That way nothing reflows as the title arrives.",
            ],
          ],
        },
        {
          lang: "css",
          code: `@supports (animation-timeline: scroll()) {
  .helper {
    animation: fade-up linear both;
    animation-timeline: scroll();
    animation-range: 0 24px;
  }
  .header {
    animation: surface-in linear both;
    animation-timeline: scroll();
    animation-range: 0 24px;
  }
}
@keyframes fade-up {
  to {
    opacity: 0;
    transform: translateY(-8px);
  }
}
@keyframes surface-in {
  to {
    background: var(--surface);
    box-shadow: 0 1px 0 var(--hairline);
  }
}`,
        },
      ],
      [
        { h2: "Pitfalls and when to skip it" },
        {
          list: [
            [
              { b: "Long titles." },
              " A two-line title fits in the body but crowds the header row. In the video it only fits because the header is wide. On mobile, shrink it to one line with an ellipsis or a shorter label.",
            ],
            [
              { b: "Layout thrash." },
              " Animating ",
              { code: "top" },
              ", ",
              { code: "height" },
              " or ",
              { code: "font-size" },
              " on scroll forces reflow every frame. Stick to ",
              { code: "transform" },
              " and ",
              { code: "opacity" },
              ".",
            ],
            [
              { b: "Snap points." },
              " If the user stops partway, the half-morphed header can look broken. Either keep the travel very short, as here, or ease it to the nearest state on scroll end.",
            ],
            [
              { b: "Reduced motion." },
              " Under ",
              { code: "prefers-reduced-motion" },
              ", swap between the two states without the in-between frames.",
            ],
            [
              { b: "Short pages." },
              " If the content barely scrolls, the morph shows up as a twitch rather than a transition. Keep it for pages where the user spends real time below the fold, like checklists, settings and long forms.",
            ],
          ],
        },
      ],
    ],
  },
};
