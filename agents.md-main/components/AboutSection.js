"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Section_1 = __importDefault(require("@/components/Section"));
const AboutSection = () => (<Section_1.default title="About" className="pb-0" center maxWidthClass="max-w-3xl">
    <p className="max-w-3xl">
      AGENTS.md emerged from collaborative efforts across the AI software
      development ecosystem, including{" "}
      <a href="https://openai.com/codex/" className="underline hover:no-underline" target="_blank" rel="noopener noreferrer">OpenAI Codex</a>,{" "}
      <a href="https://ampcode.com" className="underline hover:no-underline" target="_blank" rel="noopener noreferrer">Amp</a>,{" "}
      <a href="https://jules.google" className="underline hover:no-underline" target="_blank" rel="noopener noreferrer">Jules from Google</a>,{" "}
      <a href="https://cursor.com" className="underline hover:no-underline" target="_blank" rel="noopener noreferrer">Cursor</a>, and{" "}
      <a href="https://factory.ai" className="underline hover:no-underline" target="_blank" rel="noopener noreferrer">Factory</a>.
    </p>

    <p className="max-w-3xl mt-4">
      We&rsquo;re committed to helping maintain and evolve this as an open format that benefits the entire developer community,
      regardless of which coding agent you use.
    </p>

    
  </Section_1.default>);
exports.default = AboutSection;
//# sourceMappingURL=AboutSection.js.map