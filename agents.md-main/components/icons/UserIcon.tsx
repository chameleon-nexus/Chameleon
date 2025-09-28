import React from "react";

export default function UserIcon({ className = "w-6 h-6 flex-shrink-0" }) {
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
        d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 20v-1a4 4 0 014-4h8a4 4 0 014 4v1"
      />
    </svg>
  );
}

