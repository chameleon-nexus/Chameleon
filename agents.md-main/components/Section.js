"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
function Section({ className = "", id, title, children, center = false, maxWidthClass = "max-w-6xl", }) {
    const containerClasses = `${maxWidthClass} mx-auto flex flex-col gap-6`;
    return (<section id={id} className={className + " px-6"}>
      <div className={containerClasses}>
        <h2 className={`text-3xl font-semibold tracking-tight ${center ? "mx-auto text-center" : ""}`}>
          {title}
        </h2>
        {/* prose class is useful for markdown-like content. For centered sections we don't want automatic left
            margin on headings, so we keep it unconditionally; centering is handled by parent flex alignment. */}
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          {children}
        </div>
      </div>
    </section>);
}
exports.default = Section;
//# sourceMappingURL=Section.js.map