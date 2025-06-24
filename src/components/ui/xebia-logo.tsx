import { ComponentProps } from "react";

export function XebiaLogo(props: ComponentProps<"svg">) {
  return (
    <svg
      width="80"
      height="24"
      viewBox="0 0 80 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* X */}
      <path d="M2 4L8 10L2 16H5L9 12L13 16H16L10 10L16 4H13L9 8L5 4H2Z" fill="currentColor"/>
      
      {/* e */}
      <path d="M20 16C23 16 25 14 25 11C25 8 23 6 20 6C17 6 15 8 15 11C15 14 17 16 20 16ZM20 8C21.5 8 22.5 9 22.5 11C22.5 13 21.5 14 20 14C18.5 14 17.5 13 17.5 11C17.5 9 18.5 8 20 8Z" fill="currentColor"/>
      
      {/* b */}
      <path d="M27 16V4H29.5V7C30.5 6.2 31.8 6 32.5 6C35 6 36.5 7.5 36.5 10.5C36.5 13.5 35 15 32.5 15C31.8 15 30.5 14.8 29.5 14V16H27ZM32 8C30.5 8 29.5 9 29.5 10.5C29.5 12 30.5 13 32 13C33.5 13 34 12 34 10.5C34 9 33.5 8 32 8Z" fill="currentColor"/>
      
      {/* i */}
      <path d="M40 4V5.5H42.5V4H40ZM40 6.5V15H42.5V6.5H40Z" fill="currentColor"/>
      
      {/* a */}
      <path d="M46 15C49 15 51 13 51 10.5C51 8 49 6.5 46 6.5C43 6.5 41 8 41 10.5C41 13 43 15 46 15ZM46 8C47.5 8 48.5 9 48.5 10.5C48.5 12 47.5 13 46 13C44.5 13 43.5 12 43.5 10.5C43.5 9 44.5 8 46 8Z" fill="currentColor"/>
    </svg>
  );
}