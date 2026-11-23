import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" makes the build work at any path, including https://<user>.github.io/<repo>/
export default defineConfig({ base: "./", plugins: [react()] });
