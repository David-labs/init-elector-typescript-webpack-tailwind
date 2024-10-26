# TypeScript + Electron + Tailwind CSS + Webpack 项目配置

### Installation
```
git clone https://github.com/David-labs/init-elector-typescript-webpack-tailwind
```
```
cd init-elector-typescript-webpack-tailwind
npm install
npm start
```

# 安装详情

## 新建React项目

```bash
npx create-react-app my-electron --template typescript
```
因为目前 Electron 仅支持 CommonJS 模块，所以要将 tsconfig.json 中 module 改为 CommonJS， target 改为 ES5

### 安装 React 相关库
```
npm install react-router-dom
npm install --save-dev @types/react @types/react-dom
```

### 安装 Electron

```
npm install electron --save-dev
```

### 安装 Electron Forge
```
npm install --save-dev @electron-forge/cli @electron-forge/maker-zip
```
### 安装 Webpack 打包工具
```
npm install --save-dev @electron-forge/plugin-webpack
npm install --save-dev @vercel/webpack-asset-relocator-loader node-loader ts-loader css-loader style-loader
```

### 安装 Tailwind CSS
```
npm install --save-dev tailwindcss postcss-loader
npx tailwindcss init
```
### 配置
**package.json**

配置 package.json，来支持 npm start、npm run package 和 npm run make 命令

```
"scripts": {
  // ...
  "start": "npm run build && electron-forge start --inspect-electron",
  "package": "electron-forge package",
  "make": "electron-forge make"
}
```

修改 package.json 中的 main
```
"main": ".webpack/main",
```

**tailwind.config.js**

配置 tailwind.config.js
```
content: ["./src/renderer/**/*.{html,js,jsx,ts,tsx}"],
```

**postcss.config.js**

添加 postcss.config.js 配置来让 Webpack 打包支持 Tailwind CSS，内容如下：
```
const tailwindcss = require("tailwindcss");

module.exports = {
  plugins: [tailwindcss("./tailwind.config.js")],
};
```
**webpack.shared.rules.ts**

添加 webpack.shared.rules.ts 配置文件，内容如下：
```
export const rules = [
  {
    test: /native_modules[/\\].+\.node$/,
    use: "node-loader",
  },
  {
    test: /[/\\]node_modules[/\\].+\.(m?js|node)$/,
    parser: { amd: false },
    use: {
      loader: "@vercel/webpack-asset-relocator-loader",
      options: {
        outputAssetBase: "native_modules",
      },
    },
  },
  {
    test: /\.tsx?$/,
    exclude: /(node_modules|\.webpack)/,
    use: {
      loader: "ts-loader",
      options: {
        transpileOnly: true,
      },
    },
  },
];
```

**webpack.shared.plugins.ts**

添加 webpack.shared.plugins.ts 配置文件，内容如下：
```
export const plugins = [];
```

**webpack.main.config.ts**

添加 webpack.main.config.ts 配置文件，内容如下：
```
import { rules } from "./webpack.shared.rules";
import { plugins } from "./webpack.shared.plugins";

export default {
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
```

**webpack.preload.config.ts**

添加 webpack.preload.config.ts 配置文件，内容如下：
```
import { rules } from "./webpack.shared.rules";
import { plugins } from "./webpack.shared.plugins";

export default {
  entry: {
    preload: "./src/renderer/preload.ts",
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
  target: "electron-preload",
};
```

**webpack.renderer.config.ts**

添加 webpack.renderer.config.ts 配置文件，内容如下：

```
import { rules } from "./webpack.shared.rules";
import { plugins } from "./webpack.shared.plugins";

export default {
  module: {
    rules: [
      ...rules,
      {
        test: /\.css$/,
        use: [
          { loader: "style-loader" },
          { loader: "css-loader" },
          { loader: "postcss-loader" },
        ],
      },
    ],
  },
  output: {
    devtoolModuleFilenameTemplate: "[absolute-resource-path]",
  },
  plugins,
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css"],
  },
  target: "electron-renderer",
};
```
**forge.config.ts**

添加配置文件 forge.config.ts，内容如下：
```
import { WebpackPlugin } from "@electron-forge/plugin-webpack";
import { MakerZIP } from "@electron-forge/maker-zip";
import mainConfig from "./webpack.main.config";
import preloadConfig from "./webpack.preload.config";
import rendererConfig from "./webpack.renderer.config";

export default {
  packagerConfig: {
    name: "ElectronStartup",
    icon: "./icons/favicon",
    asar: true,
    ignore: [
      "dist",
      "src",
      "test",
      "node_modules",
      ".eslintrc.json",
      ".prettierrc.json",
      "forge.config.ts",
      "jest.config.json",
      "postcss.config.js",
      "tailwind.config.js",
      "tsconfig.json",
      "webpack.main.config.ts",
      "webpack.preload.config.ts",
      "webpack.renderer.config.ts",
      "webpack.shared.plugins.ts",
      "webpack.shared.rules.ts",
      "README.md",
    ],
  },
  rebuildConfig: {},
  makers: [new MakerZIP({}, ["darwin", "win32", "linux"])],
  plugins: [
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            name: "main_window",
            html: "./src/renderer/index.html",
            js: "./src/renderer/renderer.tsx",
            preload: {
              config: preloadConfig,
              js: "./src/renderer/preload.ts",
            },
          },
        ],
      },
    }),
  ],
};
```

### 程序代码
-  创建 src/main/main.ts 文件，内容如下：
```
import { app, BrowserWindow, screen } from "electron";

declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;

const createWindow = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const mainWindow = new BrowserWindow({
    width,
    height,
    show: false,
    icon: "./icons/favicon.png",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  mainWindow.webContents.once("did-finish-load", () => {
    mainWindow.maximize();
    mainWindow.show();
    mainWindow.focus();
  });

  //开发者模式
  mainWindow.webContents.openDevTools();
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  app.quit();
});
```

- 创建 src/renderer/preload.ts 文件，内容如下：
```
export {};
```
- 创建 src/renderer/index.html 文件，内容如下：
```
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Electron Startup</title>

    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'"
    />
    <meta
      http-equiv="X-Content-Security-Policy"
      content="default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'"
    />
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

- 创建 src/renderer/styles.css 文件，内容如下：
```
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light dark;
}

@media (prefers-color-scheme: dark) {
  body {
    background: #333;
    color: white;
  }
}

@media (prefers-color-scheme: light) {
  body {
    background: #ddd;
    color: black;
  }
}
```

- 创建 src/renderer/views/home.tsx，文件内容如下：
```
const Home = () => <div className="m-4">TypeScript Electron App Starter</div>;

export default Home;
```

- 创建 src/renderer/renderer.tsx 文件，内容如下：
```
import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import Home from "../views/home";
import "./styles.css";

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
```

####  npm start 启动项目就可以看到窗口界面了