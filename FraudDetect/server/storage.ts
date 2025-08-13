import {
  users,
  datasets,
  mlModels,
  trainingSessions,
  predictions,
  userSettings,
  type User,
  type UpsertUser,
  type Dataset,
  type InsertDataset,
  type MlModel,
  type InsertMlModel,
  type TrainingSession,
  type InsertTrainingSession,
  type Prediction,
  type InsertPrediction,
  type UserSettings,
  type InsertUserSettings,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Dataset operations
  createDataset(dataset: InsertDataset): Promise<Dataset>;
  getDatasets(userId: string): Promise<Dataset[]>;
  getDataset(id: string): Promise<Dataset | undefined>;
  updateDatasetStatus(id: string, status: string): Promise<void>;
  deleteDataset(id: string): Promise<void>;
  
  // ML Model operations
  createMlModel(model: InsertMlModel): Promise<MlModel>;
  getMlModels(userId: string): Promise<MlModel[]>;
  getMlModel(id: string): Promise<MlModel | undefined>;
  updateMlModel(id: string, updates: Partial<MlModel>): Promise<void>;
  setActiveModel(userId: string, modelId: string): Promise<void>;
  deleteMlModel(id: string): Promise<void>;
  
  // Training Session operations
  createTrainingSession(session: InsertTrainingSession): Promise<TrainingSession>;
  getTrainingSessions(userId: string): Promise<TrainingSession[]>;
  getActiveTrainingSessions(userId: string): Promise<TrainingSession[]>;
  updateTrainingSession(id: string, updates: Partial<TrainingSession>): Promise<void>;
  
  // Prediction operations
  createPrediction(prediction: InsertPrediction): Promise<Prediction>;
  getPredictions(userId: string, limit?: number): Promise<Prediction[]>;
  getPredictionsByModel(modelId: string, limit?: number): Promise<Prediction[]>;
  
  // User Settings operations
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  upsertUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  
  // Dashboard stats
  getDashboardStats(userId: string): Promise<{
    activeModels: number;
    datasets: number;
    accuracy: number;
    predictions: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Dataset operations
  async createDataset(dataset: InsertDataset): Promise<Dataset> {
    const [newDataset] = await db.insert(datasets).values(dataset).returning();
    return newDataset;
  }

  async getDatasets(userId: string): Promise<Dataset[]> {
    return await db
      .select()
      .from(datasets)
      .where(eq(datasets.userId, userId))
      .orderBy(desc(datasets.createdAt));
  }

  async getDataset(id: string): Promise<Dataset | undefined> {
    const [dataset] = await db.select().from(datasets).where(eq(datasets.id, id));
    return dataset;
  }

  async updateDatasetStatus(id: string, status: string): Promise<void> {
    await db.update(datasets).set({ status }).where(eq(datasets.id, id));
  }

  async deleteDataset(id: string): Promise<void> {
    await db.delete(datasets).where(eq(datasets.id, id));
  }

  // ML Model operations
  async createMlModel(model: InsertMlModel): Promise<MlModel> {
    const [newModel] = await db.insert(mlModels).values(model).returning();
    return newModel;
  }

  async getMlModels(userId: string): Promise<MlModel[]> {
    return await db
      .select()
      .from(mlModels)
      .where(eq(mlModels.userId, userId))
      .orderBy(desc(mlModels.createdAt));
  }

  async getMlModel(id: string): Promise<MlModel | undefined> {
    const [model] = await db.select().from(mlModels).where(eq(mlModels.id, id));
    return model;
  }

  async updateMlModel(id: string, updates: Partial<MlModel>): Promise<void> {
    await db.update(mlModels).set(updates).where(eq(mlModels.id, id));
  }

  async setActiveModel(userId: string, modelId: string): Promise<void> {
    // First set all models for this user to inactive
    await db.update(mlModels).set({ isActive: false }).where(eq(mlModels.userId, userId));
    // Then set the selected model to active
    await db.update(mlModels).set({ isActive: true }).where(eq(mlModels.id, modelId));
    // Update user settings
    await db
      .update(userSettings)
      .set({ activeModelId: modelId })
      .where(eq(userSettings.userId, userId));
  }

  async deleteMlModel(id: string): Promise<void> {
    await db.delete(mlModels).where(eq(mlModels.id, id));
  }

  // Training Session operations
  async createTrainingSession(session: InsertTrainingSession): Promise<TrainingSession> {
    const [newSession] = await db.insert(trainingSessions).values(session).returning();
    return newSession;
  }

  async getTrainingSessions(userId: string): Promise<TrainingSession[]> {
    return await db
      .select()
      .from(trainingSessions)
      .where(eq(trainingSessions.userId, userId))
      .orderBy(desc(trainingSessions.startedAt));
  }

  async getActiveTrainingSessions(userId: string): Promise<TrainingSession[]> {
    return await db
      .select()
      .from(trainingSessions)
      .where(
        and(
          eq(trainingSessions.userId, userId),
          eq(trainingSessions.status, "running")
        )
      )
      .orderBy(desc(trainingSessions.startedAt));
  }

  async updateTrainingSession(id: string, updates: Partial<TrainingSession>): Promise<void> {
    await db.update(trainingSessions).set(updates).where(eq(trainingSessions.id, id));
  }

  // Prediction operations
  async createPrediction(prediction: InsertPrediction): Promise<Prediction> {
    const [newPrediction] = await db.insert(predictions).values(prediction).returning();
    return newPrediction;
  }

  async getPredictions(userId: string, limit = 100): Promise<Prediction[]> {
    return await db
      .select()
      .from(predictions)
      .where(eq(predictions.userId, userId))
      .orderBy(desc(predictions.createdAt))
      .limit(limit);
  }

  async getPredictionsByModel(modelId: string, limit = 100): Promise<Prediction[]> {
    return await db
      .select()
      .from(predictions)
      .where(eq(predictions.modelId, modelId))
      .orderBy(desc(predictions.createdAt))
      .limit(limit);
  }

  // User Settings operations
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    return settings;
  }

  async upsertUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    const [upsertedSettings] = await db
      .insert(userSettings)
      .values(settings)
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          ...settings,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upsertedSettings;
  }

  // Dashboard stats
  async getDashboardStats(userId: string): Promise<{
    activeModels: number;
    datasets: number;
    accuracy: number;
    predictions: number;
  }> {
    const [modelsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(mlModels)
      .where(and(eq(mlModels.userId, userId), eq(mlModels.isActive, true)));

    const [datasetsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(datasets)
      .where(eq(datasets.userId, userId));

    const [avgAccuracy] = await db
      .select({ avg: sql<number>`avg(${mlModels.accuracy})` })
      .from(mlModels)
      .where(and(eq(mlModels.userId, userId), eq(mlModels.status, "completed")));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [predictionsToday] = await db
      .select({ count: sql<number>`count(*)` })
      .from(predictions)
      .where(and(
        eq(predictions.userId, userId),
        sql`${predictions.createdAt} >= ${today}`
      ));

    return {
      activeModels: modelsCount?.count || 0,
      datasets: datasetsCount?.count || 0,
      accuracy: avgAccuracy?.avg || 0,
      predictions: predictionsToday?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();
