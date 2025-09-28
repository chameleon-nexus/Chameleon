"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const Section_1 = __importDefault(require("@/components/Section"));
const CodeExample_1 = __importDefault(require("@/components/CodeExample"));
const ExampleListSection_1 = __importDefault(require("@/components/ExampleListSection"));
function ExamplesSection({ contributorsByRepo }) {
    return (<Section_1.default id="examples" title="Examples" className="py-12" center>
      {/* Wide code example */}
      <div className="mb-4">
        <CodeExample_1.default compact/>
      </div>

      {/* Repo cards */}
      <ExampleListSection_1.default contributorsByRepo={contributorsByRepo} standalone/>
    </Section_1.default>);
}
exports.default = ExamplesSection;
//# sourceMappingURL=ExamplesSection.js.map