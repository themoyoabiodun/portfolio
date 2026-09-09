import Avatar from "./components/Avatar.jsx";

export default function App() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#F5F5F5]">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="animate-fade-in-up motion-reduce:animate-fade-in">
          <Avatar
            src={`${import.meta.env.BASE_URL}asset/moyo.png`}
            alt="Moyo Abiodun"
          />
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

        <a
          href="https://themoyo.framer.website/"
          target="_blank"
          rel="noopener noreferrer"
          className="portfolio-button inline-flex items-center justify-center rounded-full bg-[#171717] px-4 py-2 text-sm font-medium text-white animate-fade-in-up motion-reduce:animate-fade-in"
          style={{ animationDelay: "120ms" }}
        >
          Portfolio
        </a>
      </div>
    </div>
  );
}
