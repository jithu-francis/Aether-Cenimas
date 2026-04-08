/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  env: {
    MOVIE_TITLE: process.env.MOVIE_TITLE || "I Am Kathalan",
    MOVIE_DESCRIPTION:
      process.env.MOVIE_DESCRIPTION ||
      "A gripping cyber thriller following Vishnu, an engineering graduate who uses his hacking skills for revenge against his ex-girlfriend's powerful father — only to find himself trapped in a dangerous game with devastating consequences.",
    MOVIE_POSTER: process.env.MOVIE_POSTER || "/poster.webp",
  },
  serverExternalPackages: ["artplayer"],
  experimental: {},
  allowedDevOrigins: ['10.89.109.226', 'localhost:3010'],
};

export default nextConfig;
