import type { Config } from "tailwindcss";
import preset from "@dossier/config/tailwind/preset";

const config: Config = {
  presets: [preset],
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/*/src/**/*.{ts,tsx}",
  ],
};

export default config;
