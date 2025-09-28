import React from "react";

export default function ClipboardIcon({ className = "w-6 h-6 flex-shrink-0" }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 2.25h6a.75.75 0 01.75.75v1.5h1.5A2.25 2.25 0 0120.25 6.75v12A2.25 2.25 0 0118 21h-12a2.25 2.25 0 01-2.25-2.25v-12A2.25 2.25 0 016 4.5h1.5V3a.75.75 0 01.75-.75z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6"
      />
    </svg>
  );
}

