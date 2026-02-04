import type { SVGProps } from "react";

export function ShurikenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 2 2.39 3.42L18 6l-1.39 4.24L18 18l-3.61.58L12 22l-2.39-3.42L6 18l1.39-4.24L6 6l3.61-.58L12 2z" />
      <path d="m12 2 3.42 2.39L18 6l-4.24 1.39L18 18l-.58 3.61L12 22l-3.42-2.39L6 18l4.24-1.39L6 6l.58-3.61L12 2z" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
