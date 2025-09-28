import React from "react";

export default function LinkIcon({ className = "w-6 h-6 flex-shrink-0" }) {
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
        d="M13.828 10.172a4 4 0 015.657 5.656l-3.535 3.535a4 4 0 01-5.657-5.656l1.414-1.415"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.172 13.828a4 4 0 01-5.657-5.656l3.535-3.535a4 4 0 015.657 5.656l-1.414 1.415"
      />
    </svg>
  );
}

