import npm from "rollup-plugin-node-resolve";

export default {
  entry: "d3-package.js",
  format: "iife",
  moduleName: "d3",
  plugins: [npm({jsnext: true})],
  dest: "lib/d3.js"
};
