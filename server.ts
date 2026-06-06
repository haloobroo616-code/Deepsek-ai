import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { DeepSeekThinking } from "./src/lib/deepseek.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add middleware to parse JSON request bodies
  app.use(express.json());

  app.post("/api/chat", async (req, res) => {
    try {
      const { prompt, history } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }
      
      console.log(`Received chat request: "${prompt}", history length: ${history?.length || 0}`);
      
      const result = await DeepSeekThinking(prompt, history || []);
      res.json(result);
    } catch (error) {
      console.error("Error in /api/chat:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
