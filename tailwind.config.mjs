/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			animation: {
				'spin-slow': 'spin 20s linear infinite',
				'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
			},
			scale: {
				'85': '0.85',
				'115': '1.15',
			},
			blur: {
				xs: '2px',
			},
			height: {
				screen: ['100vh', '100dvh'],
			},
			minHeight: {
				screen: ['100vh', '100dvh'],
			},
		},
	},
	plugins: [],
}
