/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export so the site keeps deploying to GitHub Pages
  // (themoyoabiodun.com) from the generated `out/` folder.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
