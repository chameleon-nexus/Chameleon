import React from "react";

export type SectionProps = React.PropsWithChildren<{
  id?: string;
  className?: string;
  title: string;
  /**
   * Center the heading and inner content horizontally (text-center).
   */
  center?: boolean;
  /**
   * Tailwind max-width utility to override the default container width.
   * e.g. "max-w-4xl".  Defaults to "max-w-6xl".
   */
  maxWidthClass?: string;
}>;

export default function Section({
  className = "",
  id,
  title,
  children,
  center = false,
  maxWidthClass = "max-w-6xl",
}: SectionProps) {
  const containerClasses = `${maxWidthClass} mx-auto flex flex-col gap-6`;

  return (
    <section id={id} className={className + " px-6"}>
      <div className={containerClasses}>
        <h2
          className={`text-3xl font-semibold tracking-tight ${center ? "mx-auto text-center" : ""}`}
        >
          {title}
        </h2>
        {/* prose class is useful for markdown-like content. For centered sections we don't want automatic left
            margin on headings, so we keep it unconditionally; centering is handled by parent flex alignment. */}
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          {children}
        </div>
      </div>
    </section>
  );
}
