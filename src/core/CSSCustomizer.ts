import logger from '../utils/logger.js';

/**
 * CSS Customizer
 * Generates CSS from design specifications
 */
class CSSCustomizer {
  /**
   * Generate CSS for color scheme
   */
  generateColorSchemeCSS(colorScheme: any): string {
    const { primary, secondary, accent, background, text } = colorScheme;

    return `
/* Flora Color Scheme */
:root {
  --color-primary: ${primary || '#007bff'};
  --color-secondary: ${secondary || '#6c757d'};
  --color-accent: ${accent || '#ffc107'};
  --color-background: ${background || '#ffffff'};
  --color-text: ${text || '#212529'};
}

body {
  background-color: var(--color-background);
  color: var(--color-text);
}

a {
  color: var(--color-primary);
}

a:hover {
  color: var(--color-secondary);
}

.btn-primary {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.btn-secondary {
  background-color: var(--color-secondary);
  border-color: var(--color-secondary);
}

.accent {
  color: var(--color-accent);
}
    `.trim();
  }

  /**
   * Generate CSS for typography
   */
  generateTypographyCSS(typography: any): string {
    const {
      fontFamily,
      headingFont,
      fontSize,
      lineHeight,
      headingSizes,
    } = typography;

    return `
/* Flora Typography */
${fontFamily ? `@import url('https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}&display=swap');` : ''}

:root {
  --font-family-base: ${fontFamily || 'system-ui, -apple-system, sans-serif'};
  --font-family-heading: ${headingFont || fontFamily || 'system-ui, -apple-system, sans-serif'};
  --font-size-base: ${fontSize || '16px'};
  --line-height-base: ${lineHeight || '1.5'};
}

body {
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-family-heading);
  line-height: 1.2;
}

${headingSizes ? this.generateHeadingSizes(headingSizes) : ''}
    `.trim();
  }

  /**
   * Generate heading sizes
   */
  private generateHeadingSizes(sizes: any): string {
    const { h1, h2, h3, h4, h5, h6 } = sizes;

    return `
h1 { font-size: ${h1 || '2.5rem'}; }
h2 { font-size: ${h2 || '2rem'}; }
h3 { font-size: ${h3 || '1.75rem'}; }
h4 { font-size: ${h4 || '1.5rem'}; }
h5 { font-size: ${h5 || '1.25rem'}; }
h6 { font-size: ${h6 || '1rem'}; }
    `.trim();
  }

  /**
   * Generate CSS for layout
   */
  generateLayoutCSS(layout: any): string {
    const {
      maxWidth,
      containerPadding,
      gridGap,
      borderRadius,
      boxShadow,
    } = layout;

    return `
/* Flora Layout */
:root {
  --container-max-width: ${maxWidth || '1200px'};
  --container-padding: ${containerPadding || '1rem'};
  --grid-gap: ${gridGap || '1rem'};
  --border-radius: ${borderRadius || '4px'};
  --box-shadow: ${boxShadow || '0 2px 4px rgba(0,0,0,0.1)'};
}

.container {
  max-width: var(--container-max-width);
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--container-padding);
  padding-right: var(--container-padding);
}

.grid {
  display: grid;
  gap: var(--grid-gap);
}

.card {
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
}

.btn {
  border-radius: var(--border-radius);
}
    `.trim();
  }

  /**
   * Generate CSS for spacing
   */
  generateSpacingCSS(spacing: any): string {
    const { unit, scale } = spacing;

    return `
/* Flora Spacing */
:root {
  --spacing-unit: ${unit || '8px'};
  ${scale ? this.generateSpacingScale(scale) : ''}
}
    `.trim();
  }

  /**
   * Generate spacing scale
   */
  private generateSpacingScale(scale: number[]): string {
    return scale
      .map((multiplier, index) => {
        return `--spacing-${index}: calc(var(--spacing-unit) * ${multiplier});`;
      })
      .join('\n  ');
  }

  /**
   * Parse and validate CSS
   */
  validateCSS(css: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic CSS validation
    const openBraces = (css.match(/{/g) || []).length;
    const closeBraces = (css.match(/}/g) || []).length;

    if (openBraces !== closeBraces) {
      errors.push('Mismatched curly braces');
    }

    // Check for basic syntax errors
    const invalidChars = css.match(/[^\w\s\-:;{}.#@(),'"/[\]%!+=*>~]/g);
    if (invalidChars) {
      errors.push(`Invalid characters found: ${invalidChars.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Minify CSS
   */
  minifyCSS(css: string): string {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/\s*{\s*/g, '{')
      .replace(/\s*}\s*/g, '}')
      .replace(/\s*:\s*/g, ':')
      .replace(/\s*;\s*/g, ';')
      .replace(/\s*,\s*/g, ',')
      .trim();
  }

  /**
   * Beautify CSS
   */
  beautifyCSS(css: string): string {
    let formatted = css;

    // Add newlines after braces
    formatted = formatted.replace(/{/g, ' {\n  ');
    formatted = formatted.replace(/}/g, '\n}\n');
    formatted = formatted.replace(/;/g, ';\n  ');

    // Clean up extra spaces
    formatted = formatted.replace(/\n\s*\n/g, '\n');
    formatted = formatted.replace(/  \n}/g, '\n}');

    return formatted.trim();
  }

  /**
   * Generate responsive CSS
   */
  generateResponsiveCSS(breakpoints: any, rules: any): string {
    const css = [];

    for (const [breakpoint, value] of Object.entries(breakpoints)) {
      const breakpointRules = rules[breakpoint];
      if (breakpointRules) {
        css.push(`
@media (min-width: ${value}) {
${this.beautifyCSS(breakpointRules)}
}
        `.trim());
      }
    }

    return css.join('\n\n');
  }

  /**
   * Merge CSS rules
   */
  mergeCSS(...cssStrings: string[]): string {
    return cssStrings.filter(Boolean).join('\n\n');
  }

  /**
   * Extract CSS variables from CSS string
   */
  extractCSSVariables(css: string): Map<string, string> {
    const variables = new Map();
    const regex = /--[\w-]+:\s*([^;]+)/g;
    let match;

    while ((match = regex.exec(css)) !== null) {
      const varName = match[0].split(':')[0].trim();
      const varValue = match[1].trim();
      variables.set(varName, varValue);
    }

    return variables;
  }

  /**
   * Generate custom CSS from design tokens
   */
  generateFromDesignTokens(tokens: any): string {
    const sections = [];

    if (tokens.colors) {
      sections.push(this.generateColorSchemeCSS(tokens.colors));
    }

    if (tokens.typography) {
      sections.push(this.generateTypographyCSS(tokens.typography));
    }

    if (tokens.layout) {
      sections.push(this.generateLayoutCSS(tokens.layout));
    }

    if (tokens.spacing) {
      sections.push(this.generateSpacingCSS(tokens.spacing));
    }

    return this.mergeCSS(...sections);
  }
}

export default new CSSCustomizer();
