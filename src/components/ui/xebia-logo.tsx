import { ComponentProps } from "react";

export function XebiaLogo(props: ComponentProps<"svg">) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M2 2h20v20H2V2z" fill="currentColor"/>
      <path d="M6 6l6 6-6 6M12 18h6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}