import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { IrrigationEnv } from "./src/openenv/environment";
import { TASKS, gradeTask } from "./src/openenv/tasks";
import { ActionSchema } from "./src/openenv/types";

import OpenAI from "openai";

let openai: OpenAI | null = null;

function getOpenAI() {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '7860');

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // In-memory store for environments (sessions)
  const sessions: Record<string, { env: IrrigationEnv; taskId: string }> = {};

  // --- OpenAI Vision Analysis Endpoint ---
  app.post("/api/vision-analyze", async (req, res) => {
    const { image } = req.body; // Base64 image
    try {
      const client = getOpenAI();
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this soil image. Estimate the moisture level as a percentage (0-100%) and provide a brief recommendation for irrigation in liters. Format: Moisture: X%, Recommendation: YL." },
              {
                type: "image_url",
                image_url: {
                  "url": image,
                },
              },
            ],
          },
        ],
      });

      res.json({ result: response.choices[0].message.content });
    } catch (err) {
      console.error("OpenAI Error:", err);
      const message = err instanceof Error ? err.message : "Failed to analyze image";
      res.status(500).json({ error: message });
    }
  });

  // --- OpenEnv API Endpoints ---

  app.get("/api/tasks", (req, res) => {
    res.json(TASKS);
  });

  app.post("/api/reset", (req, res) => {
    const { task_id, seed } = req.body;
    const task = TASKS.find((t) => t.id === task_id) || TASKS[0];
    const sessionId = uuidv4();
    const env = new IrrigationEnv();
    const observation = env.reset(task, seed);
    
    sessions[sessionId] = { env, taskId: task.id };
    
    res.json({
      session_id: sessionId,
      observation,
    });
  });

  app.post("/api/step", (req, res) => {
    const { session_id, action } = req.body;
    const session = sessions[session_id];

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    try {
      const validatedAction = ActionSchema.parse(action);
      const result = session.env.step(validatedAction);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: "Invalid action", details: err });
    }
  });

  app.get("/api/state/:session_id", (req, res) => {
    const session = sessions[req.params.session_id];
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.json(session.env.getState());
  });

  app.get("/api/grade/:session_id", (req, res) => {
    const session = sessions[req.params.session_id];
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    const state = session.env.getState();
    const task = TASKS.find(t => t.id === session.taskId)!;
    const score = gradeTask(state, task);
    res.json({ score });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
