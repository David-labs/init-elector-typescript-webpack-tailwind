import { rules } from "./webpack.shared.rules";
import { plugins } from "./webpack.shared.plugins";

const config =  {
  entry: {
    index: "./src/main/main.ts",
  },
  module: {
    rules,
  },
  output: {
    devtoolModuleFilenameTemplate: "[absolute-resource-path]",
    filename: "[name].js",
  },
  plugins,
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css", ".json"],
  },
  target: "electron-main",
};

export default config;