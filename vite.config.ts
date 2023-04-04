import solid from "solid-start/vite";
import "sass"; // https://github.com/withastro/astro/issues/2623#issuecomment-1119409741
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [solid()],
  build: { target: "esnext" },
});
