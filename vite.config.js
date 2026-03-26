import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

<<<<<<< Updated upstream
  server: {
    hmr: {
      overlay: false,
    },
  },
});
=======
  plugins: [
    react(),
    tailwindcss(),
  ],
})
>>>>>>> Stashed changes
