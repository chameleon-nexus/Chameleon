"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("@/styles/globals.css");
const head_1 = __importDefault(require("next/head"));
const next_1 = require("@vercel/analytics/next");
function App({ Component, pageProps }) {
    return <>
    <head_1.default>
      <title>AGENTS.md</title>
      <meta name="description" content="AGENTS.md is a simple, open format for guiding coding agents, used by over 20k open-source projects. Think of it as a README for agents."/>
      <meta name="twitter:card" content="summary_large_image"/>
      <meta name="twitter:title" content="AGENTS.md"/>
      <meta name="twitter:description" content="AGENTS.md is a simple, open format for guiding coding agents. Think of it as a README for agents."/>
      <meta name="twitter:image" content="https://agents.md/og.png"/>
      <meta name="twitter:domain" content="agents.md"/>
      <meta name="twitter:url" content="https://agents.md"/>
      <meta property="og:type" content="website"/>
      <meta property="og:title" content="AGENTS.md"/>
      <meta property="og:description" content="AGENTS.md is a simple, open format for guiding coding agents. Think of it as a README for agents."/>
      <meta property="og:image" content="https://agents.md/og.png"/>
    </head_1.default>
    <Component {...pageProps}/>
    <next_1.Analytics />
  </>;
}
exports.default = App;
//# sourceMappingURL=_app.js.map