import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'var(--border)',
				input: 'var(--input)',
				ring: 'var(--ring)',
				background: 'var(--background)',
				foreground: 'var(--foreground)',
				primary: {
					DEFAULT: 'var(--primary)',
					foreground: 'var(--primary-foreground)'
				},
				secondary: {
					DEFAULT: 'var(--secondary)',
					foreground: 'var(--secondary-foreground)'
				},
				destructive: {
					DEFAULT: 'var(--destructive)',
					foreground: 'var(--destructive-foreground)'
				},
				muted: {
					DEFAULT: 'var(--muted)',
					foreground: 'var(--muted-foreground)'
				},
				accent: {
					DEFAULT: 'var(--accent)',
					foreground: 'var(--accent-foreground)'
				},
				popover: {
					DEFAULT: 'var(--popover)',
					foreground: 'var(--popover-foreground)'
				},
				card: {
					DEFAULT: 'var(--card)',
					foreground: 'var(--card-foreground)'
				},
				sidebar: {
					DEFAULT: 'var(--sidebar-background)',
					foreground: 'var(--sidebar-foreground)',
					primary: 'var(--sidebar-primary)',
					'primary-foreground': 'var(--sidebar-primary-foreground)',
					accent: 'var(--sidebar-accent)',
					'accent-foreground': 'var(--sidebar-accent-foreground)',
					border: 'var(--sidebar-border)',
					ring: 'var(--sidebar-ring)'
				},
				// EHRDC Brand Colors (canonical source)
				'ehrdc-teal': '#006E6D',
				'ehrdc-dark-teal': '#005A59',
				'ehrdc-light-teal': '#4A9B9A',
				'ehrdc-subtle': '#F0F7F7',
				'ehrdc-gold': '#C3992A',
				'ehrdc-neutral-dark': '#1A1A1A',
				'ehrdc-neutral-light': '#F4F5F7',
				'ehrdc-white': '#FFFFFF',
				// Emirati aliases
				'emirati-teal': '#006E6D',
				'emirati-navy': '#1A1A1A',
				'emirati-gold': '#C3992A',
				// Keep the old structure for backwards compatibility
				ehrdc: {
					teal: '#006E6D',
					darkTeal: '#005A59',
					lightTeal: '#4A9B9A',
					subtle: '#F0F7F7',
					gold: '#C3992A',
					neutralDark: '#1A1A1A',
					neutralLight: '#F4F5F7',
				},
				// ── EHRDC canonical ramps — values defined in src/styles/ehrdc-tokens.css ──
				// Namespaced under `brand-` so they cannot collide with Tailwind's
				// built-in `teal` / `gold` scales already used across the app.
				brand: {
					teal: {
						50: 'var(--ehrdc-teal-50)',
						100: 'var(--ehrdc-teal-100)',
						200: 'var(--ehrdc-teal-200)',
						300: 'var(--ehrdc-teal-300)',
						400: 'var(--ehrdc-teal-400)',
						500: 'var(--ehrdc-teal-500)',
						600: 'var(--ehrdc-teal-600)',
						700: 'var(--ehrdc-teal-700)',
						800: 'var(--ehrdc-teal-800)',
						900: 'var(--ehrdc-teal-900)',
						DEFAULT: 'var(--ehrdc-teal-600)',
					},
					gold: {
						100: 'var(--ehrdc-gold-100)',
						400: 'var(--ehrdc-gold-400)',
						600: 'var(--ehrdc-gold-600)',
						800: 'var(--ehrdc-gold-800)',
						DEFAULT: 'var(--ehrdc-gold-600)',
					},
				},
				surface: 'var(--ehrdc-surface)',
				paper: 'var(--ehrdc-paper)',
				ink: 'var(--ehrdc-ink)',
				line: 'var(--ehrdc-line)',
				success: 'var(--ehrdc-success)',
				warning: 'var(--ehrdc-warning)',
				danger: 'var(--ehrdc-danger)',
				info: 'var(--ehrdc-info)',
				// Dubai Design System Colors
				dubai: {
					blue: '#0079C1',
					teal: '#00ABB3',
					green: '#00A651',
					orange: '#F57C00',
					red: '#D32F2F',
					purple: '#7B1FA2',
					gray: {
						50: '#FAFAFA',
						100: '#F5F5F5',
						200: '#EEEEEE',
						300: '#E0E0E0',
						400: '#BDBDBD',
						500: '#9E9E9E',
						600: '#757575',
						700: '#616161',
						800: '#424242',
						900: '#212121',
					}
				},
				// Government theme colors updated based on Dubai Design System
				gov: {
					red: '#D32F2F',
					green: '#00A651',
					blue: '#0079C1',
					gold: '#C3992A',
					black: '#171717',
					darkGray: '#616161',
					mediumGray: '#9E9E9E',
					lightGray: '#E0E0E0',
					white: '#FFFFFF',
					teal: '#00ABB3',
					dubai: '#0079C1',
					ehrdc: {
						primary: '#00ABB3',
						secondary: '#0079C1',
						light: '#E6F2F1',
					}
				}
			},
			fontFamily: {
				// Single source of truth: src/styles/ehrdc-tokens.css
				// Readex Pro — self-hosted, covers Latin AND Arabic in one superfamily.
				sans: ['var(--font-sans)'],
				display: ['var(--font-sans)'],
				arabic: ['var(--font-arabic)'],
				mono: ['var(--font-mono)'],
				// Legacy aliases retained so existing `font-gov` / `font-dubai` markup
				// keeps working — they now resolve to the canonical brand face.
				gov: ['var(--font-sans)'],
				dubai: ['var(--font-sans)'],
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				pill: 'var(--radius-pill)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'fade-in-up': {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-in-right': {
					'0%': { transform: 'translateX(100%)' },
					'100%': { transform: 'translateX(0)' }
				},
				'slide-in-left': {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(0)' }
				},
				'scale-in': {
					'0%': { transform: 'scale(0.9)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.7s ease-in-out',
				'fade-in-up': 'fade-in-up 0.7s ease-out',
				'slide-in-right': 'slide-in-right 0.5s ease-out',
				'slide-in-left': 'slide-in-left 0.5s ease-out',
				'scale-in': 'scale-in 0.5s ease-out',
				'float': 'float 6s ease-in-out infinite'
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
				'dot-pattern': 'radial-gradient(circle, #0079C1 1px, transparent 1px)',
				'dubai-pattern': 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 0H0V1H1V0ZM3 0H2V1H3V0ZM5 0H4V1H5V0ZM7 0H6V1H7V0ZM9 0H8V1H9V0ZM11 0H10V1H11V0ZM13 0H12V1H13V0ZM15 0H14V1H15V0ZM17 0H16V1H17V0ZM19 0H18V1H19V0ZM1 2H0V3H1V2ZM3 2H2V3H3V2ZM5 2H4V3H5V2ZM7 2H6V3H7V2ZM9 2H8V3H9V2ZM11 2H10V3H11V2ZM13 2H12V3H13V2ZM15 2H14V3H15V2ZM17 2H16V3H17V2ZM19 2H18V3H19V2ZM1 4H0V5H1V4ZM3 4H2V5H3V4ZM5 4H4V5H5V4ZM7 4H6V5H7V4ZM9 4H8V5H9V4ZM11 4H10V5H11V4ZM13 4H12V5H13V4ZM15 4H14V5H15V4ZM17 4H16V5H17V4ZM19 4H18V5H19V4ZM1 6H0V7H1V6ZM3 6H2V7H3V6ZM5 6H4V7H5V6ZM7 6H6V7H7V6ZM9 6H8V7H9V6ZM11 6H10V7H11V6ZM13 6H12V7H13V6ZM15 6H14V7H15V6ZM17 6H16V7H17V6ZM19 6H18V7H19V6ZM1 8H0V9H1V8ZM3 8H2V9H3V8ZM5 8H4V9H5V8ZM7 8H6V9H7V8ZM9 8H8V9H9V8ZM11 8H10V9H11V8ZM13 8H12V9H13V8ZM15 8H14V9H15V8ZM17 8H16V9H17V8ZM19 8H18V9H19V8ZM1 10H0V11H1V10ZM3 10H2V11H3V10ZM5 10H4V11H5V10ZM7 10H6V11H7V10ZM9 10H8V11H9V10ZM11 10H10V11H11V10ZM13 10H12V11H13V10ZM15 10H14V11H15V10ZM17 10H16V11H17V10ZM19 10H18V11H19V10ZM1 12H0V13H1V12ZM3 12H2V13H3V12ZM5 12H4V13H5V12ZM7 12H6V13H7V12ZM9 12H8V13H9V12ZM11 12H10V13H11V12ZM13 12H12V13H13V12ZM15 12H14V13H15V12ZM17 12H16V13H17V12ZM19 12H18V13H19V12ZM1 14H0V15H1V14ZM3 14H2V15H3V14ZM5 14H4V15H5V14ZM7 14H6V15H7V14ZM9 14H8V15H9V14ZM11 14H10V15H11V14ZM13 14H12V15H13V14ZM15 14H14V15H15V14ZM17 14H16V15H17V14ZM19 14H18V15H19V14ZM1 16H0V17H1V16ZM3 16H2V17H3V16ZM5 16H4V17H5V16ZM7 16H6V17H7V16ZM9 16H8V17H9V16ZM11 16H10V17H11V16ZM13 16H12V17H13V16ZM15 16H14V17H15V16ZM17 16H16V17H17V16ZM19 16H18V17H19V16ZM1 18H0V19H1V18ZM3 18H2V19H3V18ZM5 18H4V19H5V18ZM7 18H6V19H7V18ZM9 18H8V19H9V18ZM11 18H10V19H11V18ZM13 18H12V19H13V18ZM15 18H14V19H15V18ZM17 18H16V17H17V16ZM19 18H18V19H19V18Z\' fill=\'%23E5E7EB\' fill-opacity=\'0.1\'/%3E%3C/svg%3E")',
			},
			boxShadow: {
				'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
				'subtle': '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.06)',
				'stitch': '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.06)',
				'stitch-md': '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
				'stitch-lg': '0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)',
				'premium': '0 8px 24px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.04)',
				'card': '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.06)',
				'dubai': '0 2px 8px rgba(0, 110, 109, 0.08)',
				'dubai-strong': '0 4px 16px rgba(0, 110, 109, 0.12)',
				// Canonical elevation — teal-tinted, never pure black on light.
				'elev-1': 'var(--elev-1)',
				'elev-2': 'var(--elev-2)'
			},
			backdropFilter: {
				'glass': 'blur(10px)'
			}
		}
	},
	plugins: [
		require("tailwindcss-animate"),
		// Add RTL support plugin functionality
		function ({ addUtilities }: { addUtilities: any }) {
			const rtlUtilities = {
				'.rtl\\:text-right': {
					'[dir="rtl"] &': {
						'text-align': 'right'
					}
				},
				'.rtl\\:text-left': {
					'[dir="rtl"] &': {
						'text-align': 'left'
					}
				},
				'.rtl\\:flex-row-reverse': {
					'[dir="rtl"] &': {
						'flex-direction': 'row-reverse'
					}
				},
				'.rtl\\:space-y-2': {
					'[dir="rtl"] & > :not([hidden]) ~ :not([hidden])': {
						'margin-top': '0.5rem'
					}
				},
				'.rtl\\:font-arabic': {
					'[dir="rtl"] &': {
						'font-family': 'var(--font-arabic)',
						'line-height': '1.8'
					}
				},
				'.rtl\\:leading-relaxed': {
					'[dir="rtl"] &': {
						'line-height': '1.9'
					}
				}
			};
			addUtilities(rtlUtilities);
		}
	],
} satisfies Config;
