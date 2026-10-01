const LINKS = [
  { label: "About", href: "#about" },
  { label: "Design", href: "#work" },
  { label: "Code </>", href: "https://github.com/themoyoabiodun" },
];

// Sticky, full-bleed bar (it cancels <main>'s side padding). At the top of
// the page the translucent background matches the page, so the menu sits
// exactly where the design has it; once content scrolls underneath, the
// blur keeps the links readable.
export default function Nav() {
  return (
    <header className="sticky top-0 z-10 -mx-4 bg-[color-mix(in_srgb,var(--color-bg)_85%,transparent)] py-3 backdrop-blur-md md:-mx-[52px]">
      <nav className="flex items-center justify-center gap-2 animate-fade-in-up motion-reduce:animate-fade-in">
        {LINKS.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            className="nav-link rounded-full px-3 py-0.5 text-base font-medium leading-6 whitespace-nowrap text-[var(--color-text-primary)]"
          >
            {label}
          </a>
        ))}
      </nav>
    </header>
  );
}
