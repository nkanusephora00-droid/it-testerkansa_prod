// TypeScript types for CSS custom properties (CSS variables)
export interface CSSVariables {
  '--fa-font-solid'?: string;
  '--fa-font-regular'?: string;
  '--fa-font-light'?: string;
  '--fa-font-thin'?: string;
  '--fa-font-duotone'?: string;
  '--fa-font-brands'?: string;
  '--fa-font-sharp-solid'?: string;
  '--fa-font-sharp-regular'?: string;
  '--fa-font-sharp-light'?: string;
  '--fa-font-sharp-thin'?: string;
  '--fa-font-sharp-duotone-solid'?: string;
  '--fa-font-sharp-duotone-regular'?: string;
  '--fa-font-sharp-duotone-light'?: string;
  '--fa-font-sharp-duotone-thin'?: string;
  
  // Custom CSS variables for the application
  '--primary-color'?: string;
  '--secondary-color'?: string;
  '--success-color'?: string;
  '--danger-color'?: string;
  '--warning-color'?: string;
  '--info-color'?: string;
  '--bg-primary'?: string;
  '--bg-secondary'?: string;
  '--bg-card'?: string;
  '--text-primary'?: string;
  '--text-secondary'?: string;
  '--text-muted'?: string;
  '--border-color'?: string;
  '--border-light'?: string;
  '--input-bg'?: string;
  '--hover-bg'?: string;
  '--shadow-color'?: string;
}

// Enhanced CSSProperties type that includes CSS variables
export type EnhancedCSSProperties = React.CSSProperties & CSSVariables;
