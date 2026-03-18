import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
export default defineConfig({
    plugins: [react()],
    resolve: {
        tsconfigPaths: true,
    },
    server: {
        host: true,
        port: 5173,
    },
});
