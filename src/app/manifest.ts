import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "عسل نوجا | Asal Noja",
    short_name: "نوجا",
    start_url: "/",
    display: "standalone",
    background_color: "#fffcf5",
    theme_color: "#f2a71b",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
