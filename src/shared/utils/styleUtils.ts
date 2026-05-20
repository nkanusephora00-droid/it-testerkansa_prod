import { EnhancedCSSProperties } from '../types/CSSVariables';

/**
 * Crée un objet de styles avec le typage correct pour les variables CSS
 * @param styles - Objet de styles React.CSSProperties
 * @returns Styles avec typage étendu pour les variables CSS
 */
export function createStyles<T extends Record<string, React.CSSProperties>>(styles: T): T {
  return styles;
}

/**
 * Crée un style individuel avec typage correct pour les variables CSS
 * @param style - Objet de style
 * @returns Style avec typage étendu
 */
export function createStyle(style: EnhancedCSSProperties): EnhancedCSSProperties {
  return style;
}

/**
 * Convertit un style React.CSSProperties en EnhancedCSSProperties
 * @param style - Style React standard
 * @returns Style avec support des variables CSS
 */
export function enhanceStyle(style: React.CSSProperties): EnhancedCSSProperties {
  return style as EnhancedCSSProperties;
}

/**
 * Crée un style FontAwesome compatible avec TypeScript
 * @param style - Objet de style React.CSSProperties
 * @returns Style compatible pour les icônes FontAwesome
 */
export function createFontAwesomeStyle(style: React.CSSProperties): React.CSSProperties {
  return style;
}
