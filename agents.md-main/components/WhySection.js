"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Section_1 = __importDefault(require("@/components/Section"));
const react_1 = __importDefault(require("react"));
const ClipboardIcon_1 = __importDefault(require("@/components/icons/ClipboardIcon"));
const UserIcon_1 = __importDefault(require("@/components/icons/UserIcon"));
const LinkIcon_1 = __importDefault(require("@/components/icons/LinkIcon"));
function WhySection() {
    return (<Section_1.default id="why" title="Why AGENTS.md?" className="pt-24 pb-12" center maxWidthClass="max-w-3xl">
      <div className="space-y-4">
        <p className="mb-4">
          README.md files are for humans: quick starts, project descriptions,
          and contribution guidelines.
        </p>
        <p className="mb-4">
          AGENTS.md complements this by containing the extra, sometimes detailed
          context coding agents need: build steps, tests, and conventions that
          might clutter a README or aren&rsquo;t relevant to human contributors.
        </p>
        <p className="mb-4">We intentionally kept it separate to:</p>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <ClipboardIcon_1.default />
            <p>
              <span className="font-semibold block">
                Give agents a clear, predictable place for instructions.
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <UserIcon_1.default />
            <p>
              <span className="font-semibold block">
                Keep READMEs concise and focused on human contributors.
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <LinkIcon_1.default />
            <p>
              <span className="font-semibold block">
                Provide precise, agent-focused guidance that complements
                existing README and docs.
              </span>
            </p>
          </div>
        </div>
        <p>
          Rather than introducing another proprietary file, we chose a name and
          format that could work for anyone. If you&rsquo;re building or using
          coding agents and find this helpful, feel free to adopt it.
        </p>
      </div>
    </Section_1.default>);
}
exports.default = WhySection;
//# sourceMappingURL=WhySection.js.map