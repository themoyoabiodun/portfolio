import Avatar from "./components/Avatar.jsx";
import SocialLink from "./components/SocialLink.jsx";
import { LinkedInIcon, XIcon, InstagramIcon } from "./components/icons.jsx";

const socials = [
  { href: "https://www.linkedin.com/in/moyo99/", label: "LinkedIn", Icon: LinkedInIcon },
  { href: "https://x.com/themoyoabiodun", label: "X", Icon: XIcon },
  {
    href: "https://www.instagram.com/themoyoabiodun?igsh=M3J1YXBtOTJzb2Fp&utm_source=qr/",
    label: "Instagram",
    Icon: InstagramIcon,
  },
];

export default function App() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#F5F5F5]">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="animate-fade-in-up motion-reduce:animate-fade-in">
          <Avatar src={`${import.meta.env.BASE_URL}asset/moyo.png`} alt="Moyo Abiodun" />
        </div>

        <div
          className="flex flex-col items-center justify-center animate-fade-in-up motion-reduce:animate-fade-in"
          style={{ animationDelay: "60ms" }}
        >
          <h1 className="m-0 text-[15px] font-medium leading-[26px] text-[#1A1A1A]">
            Moyo Abiodun
          </h1>
          <p className="m-0 text-[15px] font-normal leading-[26px] text-[#676767]">
            Product designer, Rank
          </p>
        </div>

        <ul
          className="m-0 flex list-none gap-1 p-0 animate-fade-in-up motion-reduce:animate-fade-in"
          style={{ animationDelay: "120ms" }}
        >
          {socials.map(({ href, label, Icon }) => (
            <li key={label}>
              <SocialLink href={href} label={label}>
                <Icon />
              </SocialLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
