import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertDatasetSchema, insertMlModelSchema, insertTrainingSessionSchema, insertPredictionSchema, insertUserSettingsSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.json', '.txt', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV, JSON, TXT, and Excel files are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dataset routes
  app.get('/api/datasets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const datasets = await storage.getDatasets(userId);
      res.json(datasets);
    } catch (error) {
      console.error("Error fetching datasets:", error);
      res.status(500).json({ message: "Failed to fetch datasets" });
    }
  });

  app.post('/api/datasets', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { name, description } = req.body;
      const ext = path.extname(req.file.originalname).toLowerCase();
      const format = ext.substring(1); // Remove the dot

      const dataset = await storage.createDataset({
        userId,
        name: name || req.file.originalname,
        description: description || '',
        filename: req.file.originalname,
        format,
        size: req.file.size,
        filePath: req.file.path,
        status: "ready"
      });

      res.json(dataset);
    } catch (error) {
      console.error("Error uploading dataset:", error);
      res.status(500).json({ message: "Failed to upload dataset" });
    }
  });

  app.delete('/api/datasets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const datasetId = req.params.id;
      
      // Verify ownership
      const dataset = await storage.getDataset(datasetId);
      if (!dataset || dataset.userId !== userId) {
        return res.status(404).json({ message: "Dataset not found" });
      }

      // Delete file
      try {
        await fs.unlink(dataset.filePath);
      } catch (error) {
        console.warn("Could not delete file:", dataset.filePath);
      }

      await storage.deleteDataset(datasetId);
      res.json({ message: "Dataset deleted successfully" });
    } catch (error) {
      console.error("Error deleting dataset:", error);
      res.status(500).json({ message: "Failed to delete dataset" });
    }
  });

  // ML Model routes
  app.get('/api/models', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const models = await storage.getMlModels(userId);
      res.json(models);
    } catch (error) {
      console.error("Error fetching models:", error);
      res.status(500).json({ message: "Failed to fetch models" });
    }
  });

  app.post('/api/models', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const modelData = insertMlModelSchema.parse({ ...req.body, userId });
      
      const model = await storage.createMlModel(modelData);
      res.json(model);
    } catch (error) {
      console.error("Error creating model:", error);
      res.status(500).json({ message: "Failed to create model" });
    }
  });

  app.patch('/api/models/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const modelId = req.params.id;
      
      // Verify ownership
      const model = await storage.getMlModel(modelId);
      if (!model || model.userId !== userId) {
        return res.status(404).json({ message: "Model not found" });
      }

      await storage.updateMlModel(modelId, req.body);
      res.json({ message: "Model updated successfully" });
    } catch (error) {
      console.error("Error updating model:", error);
      res.status(500).json({ message: "Failed to update model" });
    }
  });

  app.post('/api/models/:id/activate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const modelId = req.params.id;
      
      // Verify ownership
      const model = await storage.getMlModel(modelId);
      if (!model || model.userId !== userId) {
        return res.status(404).json({ message: "Model not found" });
      }

      await storage.setActiveModel(userId, modelId);
      res.json({ message: "Model activated successfully" });
    } catch (error) {
      console.error("Error activating model:", error);
      res.status(500).json({ message: "Failed to activate model" });
    }
  });

  app.delete('/api/models/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const modelId = req.params.id;
      
      // Verify ownership
      const model = await storage.getMlModel(modelId);
      if (!model || model.userId !== userId) {
        return res.status(404).json({ message: "Model not found" });
      }

      await storage.deleteMlModel(modelId);
      res.json({ message: "Model deleted successfully" });
    } catch (error) {
      console.error("Error deleting model:", error);
      res.status(500).json({ message: "Failed to delete model" });
    }
  });

  // Training Session routes
  app.get('/api/training-sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getTrainingSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching training sessions:", error);
      res.status(500).json({ message: "Failed to fetch training sessions" });
    }
  });

  app.get('/api/training-sessions/active', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getActiveTrainingSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching active training sessions:", error);
      res.status(500).json({ message: "Failed to fetch active training sessions" });
    }
  });

  app.post('/api/training-sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionData = insertTrainingSessionSchema.parse({ ...req.body, userId });
      
      const session = await storage.createTrainingSession(sessionData);
      res.json(session);
    } catch (error) {
      console.error("Error creating training session:", error);
      res.status(500).json({ message: "Failed to create training session" });
    }
  });

  app.patch('/api/training-sessions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionId = req.params.id;
      
      // Verify ownership
      const session = await storage.getTrainingSessions(userId);
      const targetSession = session.find(s => s.id === sessionId);
      if (!targetSession) {
        return res.status(404).json({ message: "Training session not found" });
      }

      await storage.updateTrainingSession(sessionId, req.body);
      res.json({ message: "Training session updated successfully" });
    } catch (error) {
      console.error("Error updating training session:", error);
      res.status(500).json({ message: "Failed to update training session" });
    }
  });

  // Predictions routes
  app.get('/api/predictions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const predictions = await storage.getPredictions(userId, limit);
      res.json(predictions);
    } catch (error) {
      console.error("Error fetching predictions:", error);
      res.status(500).json({ message: "Failed to fetch predictions" });
    }
  });

  app.get('/api/predictions/model/:modelId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const modelId = req.params.modelId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      
      // Verify model ownership
      const model = await storage.getMlModel(modelId);
      if (!model || model.userId !== userId) {
        return res.status(404).json({ message: "Model not found" });
      }

      const predictions = await storage.getPredictionsByModel(modelId, limit);
      res.json(predictions);
    } catch (error) {
      console.error("Error fetching model predictions:", error);
      res.status(500).json({ message: "Failed to fetch model predictions" });
    }
  });

  // User Settings routes
  app.get('/api/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.getUserSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ message: "Failed to fetch user settings" });
    }
  });

  app.post('/api/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.upsertUserSettings({ ...req.body, userId });
      res.json(settings);
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).json({ message: "Failed to update user settings" });
    }
  });

  // Dashboard stats route
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Statistics routes
  app.get('/api/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const [models, datasets, predictions] = await Promise.all([
        storage.getMlModels(userId),
        storage.getDatasets(userId),
        storage.getPredictions(userId, 1000)
      ]);

      const activeModels = models.filter(m => m.status === 'completed').length;
      const todayPredictions = predictions.filter(p => {
        const today = new Date();
        const predDate = new Date(p.createdAt!);
        return predDate.toDateString() === today.toDateString();
      }).length;

      const fraudDetected = predictions.filter(p => p.prediction === 'fraud').length;
      const avgAccuracy = models.length > 0 
        ? models.filter(m => m.accuracy).reduce((sum, m) => sum + (m.accuracy || 0), 0) / models.filter(m => m.accuracy).length
        : 0;

      res.json({
        activeModels,
        datasets: datasets.length,
        accuracy: avgAccuracy,
        predictions: todayPredictions,
        fraudDetected
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
