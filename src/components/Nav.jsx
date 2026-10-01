const LINKS = [
  { label: "About", href: "#about" },
  { label: "Design", href: "#work" },
  { label: "Code </>", href: "https://github.com/themoyoabiodun" },
];

export default function Nav() {
  return (
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
  );
}
