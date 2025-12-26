import { defineConfig } from "rollup";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import json from "@rollup/plugin-json";

export default defineConfig([
  // Main plugin bundle
  {
    input: "src/index.tsx",
    output: {
      dir: "dist",
      format: "iife",
      entryFileNames: "index.js",
      sourcemap: false,
      globals: {
        "react": "React",
        "react-dom": "ReactDOM",
        "@decky/ui": "DeckyUI"
      }
    },
    plugins: [
      nodeResolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs(),
      typescript({
        tsconfig: false,
        declaration: false,
        target: "esnext",
        jsx: "react",
        jsxFactory: "React.createElement",
        jsxFragmentFactory: "React.Fragment",
      }),
      json(),
    ],
    external: ["react", "react-dom", "@decky/ui"],
    context: "window",
  },
]);