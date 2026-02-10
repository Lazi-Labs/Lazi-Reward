import {defineConfig} from 'vite'
import laravel from 'laravel-vite-plugin'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
	plugins: [
		laravel({
			input: [
				'resources/css/app.css',
				'resources/js/app.js',
				'resources/css/admin/theme.css',
			],
			refresh: true,
			detectTls: 'lazi-rewards.test',
		}),
		{
			name: 'configure-server',
			configureServer(server) {
				server.watcher.add('resources/**/*')
			},
		},
		tailwindcss(),
	],
})
