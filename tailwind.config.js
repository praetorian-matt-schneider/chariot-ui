/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const colors = require('tailwindcss/colors');
const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    colors: {
      ...colors,
      transparent: 'transparent',
      current: 'currentColor',
      error: '#dc2626',
      'error-selected': '#fbe9e9',
      'error-light': colors.red[200],
      success: '#16a34a',
      'success-light': '#dcfce7',
      brand: {
        DEFAULT: addOpacity('var(--brand)'),
        dark: addAlphaValue('var(--brand-dark)'),
        light: addAlphaValue('var(--brand-light)'),
        lighter: addAlphaValue('var(--brand-lighter)'),
      },
      primary: {
        DEFAULT: addOpacity('var(--primary)'),
        dark: addAlphaValue('var(--primary-dark)'),
        light: addAlphaValue('var(--primary-light)'),
      },
      contract: addOpacity('var(--contract)'),
      highlight: addOpacity('var(--highlight)'),
      checkbox: {
        DEFAULT: 'var(--border-default)',
        checked: addAlphaValue('var(--primary-light)'),
      },
      header: {
        light: addAlphaValue('var(--header-light)'),
        DEFAULT: addAlphaValue('var(--header)'),
        dark: addAlphaValue('var(--header-dark)'),
      },
      default: {
        light: addAlphaValue('var(--default-light)'),
        DEFAULT: addAlphaValue('var(--default)'),
        dark: addAlphaValue('var(--default-dark)'),
      },
      layer0: addAlphaValue('var(--layer0)'),
      layer1: addAlphaValue('var(--layer1)'),
    },
    textColor: theme => {
      return {
        ...theme('colors'),
        header: {
          light: addAlphaValue('var(--text-header-light)'),
          DEFAULT: addAlphaValue('var(--text-header)'),
          dark: addAlphaValue('var(--text-header-dark)'),
        },
        default: {
          light: addAlphaValue('var(--text-default-light)'),
          DEFAULT: addAlphaValue('var(--text-default)'),
          dark: addAlphaValue('var(--text-default-dark)'),
        },
        disabled: {
          DEFAULT: addAlphaValue('var(--text-disabled)'),
        },
      };
    },
    borderColor: theme => ({
      ...theme('colors'),
      header: {
        DEFAULT: addAlphaValue('var(--border-header)'),
      },
      default: {
        DEFAULT: addAlphaValue('var(--border-default)'),
      },
    }),
    extend: {
      fontFamily: {
        sans: ['Inter var', 'Inter', ...defaultTheme.fontFamily.sans],
        mono: ['IBM Plex Mono', ...defaultTheme.fontFamily.mono],
      },
    },
  },
  plugins: [],
};

function addAlphaValue(variable) {
  return variable;
}

function addOpacity(variable) {
  return `rgb(${variable} / <alpha-value>)`;
}
