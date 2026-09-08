export default function SocialLink({ href, label, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="social-icon flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#1A1A1A]"
    >
      <span className="flex h-6 w-6 items-center justify-center">{children}</span>
    </a>
  );
}
