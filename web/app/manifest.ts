import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Todo Quest",
    short_name: "Todo Quest",
    description: "Focus clearly. Progress quietly.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#080b10",
    theme_color: "#080b10",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
