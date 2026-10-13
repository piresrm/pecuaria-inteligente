import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import { historyChartUrl } from './history-chart-url.config.ts';
export default defineConfig({
  build: {
    manifest: true,
    rolldownOptions: {
      output: { codeSplitting: { groups: [{ name: 'mercado', test: /[\\/]src[\\/]main\.tsx$/ }] } },
    },
  },
  plugins: [historyChartUrl(), react(), tailwind()],
});
