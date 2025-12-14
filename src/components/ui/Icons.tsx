import React from 'react';

interface IconProps {
  className?: string;
  size?: number | string;
}

// Helper to standardise SVG attributes
const getIconProps = ({ size = 20, className = "" }: IconProps) => ({
  width: size,
  height: size,
  className,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  xmlns: "http://www.w3.org/2000/svg"
});

// --- Navigation Icons ---

export const HomeIcon = (props: IconProps) => (
  <svg {...getIconProps(props)} viewBox="0 0 20 20" strokeWidth="1.5">
    <path d="M10 2L3 7V17H7V12H13V17H17V7L10 2Z" />
  </svg>
);

export const FeedIcon = (props: IconProps) => (
  <svg {...getIconProps(props)} viewBox="0 0 20 20" strokeWidth="1.5">
    <rect x="3" y="3" width="6" height="6" />
    <rect x="11" y="3" width="6" height="6" />
    <rect x="3" y="11" width="6" height="6" />
    <rect x="11" y="11" width="6" height="6" />
  </svg>
);

export const ExploreIcon = (props: IconProps) => (
  <svg {...getIconProps(props)} viewBox="0 0 20 20" strokeWidth="1.5">
    <circle cx="10" cy="10" r="7" />
    <path d="M10 3V10L14 12" />
  </svg>
);

export const CreateIcon = (props: IconProps) => (
  <svg {...getIconProps(props)} viewBox="0 0 20 20" strokeWidth="1.5">
    <path d="M10 4V16M4 10H16" />
  </svg>
);

export const ProfileIcon = (props: IconProps) => (
  <svg {...getIconProps(props)} viewBox="0 0 20 20" strokeWidth="1.5">
    <circle cx="10" cy="7" r="3" />
    <path d="M4 17C4 14 6.5 12 10 12C13.5 12 16 14 16 17" />
  </svg>
);

export const MyStacksIcon = (props: IconProps) => (
  <svg {...getIconProps(props)} viewBox="0 0 20 20" strokeWidth="1.5">
    <rect x="3" y="3" width="14" height="14" rx="1" />
    <path d="M3 7H17" />
    <path d="M7 3V17" />
  </svg>
);

// --- Action Icons ---

export const SearchIcon = (props: IconProps) => (
  <svg {...getIconProps(props)}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export const NotificationIcon = (props: IconProps) => (
  <svg {...getIconProps(props)} viewBox="0 0 20 20" strokeWidth="1.5">
    <path d="M10 2C7.2 2 5 4.2 5 7V11L3 13V14H17V13L15 11V7C15 4.2 12.8 2 10 2Z" />
    <path d="M7 14V15C7 16.1 7.9 17 9 17H11C12.1 17 13 16.1 13 15V14" />
  </svg>
);

export const SavedIcon = (props: IconProps) => (
  <svg {...getIconProps(props)}>
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

// --- UI Utility Icons ---

export const XIcon = (props: IconProps) => (
  <svg {...getIconProps(props)}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export const MenuIcon = (props: IconProps) => (
  <svg {...getIconProps(props)}>
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

export const ChevronDownIcon = (props: IconProps) => (
  <svg {...getIconProps(props)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const ExternalLinkIcon = (props: IconProps) => (
  <svg {...getIconProps(props)}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);