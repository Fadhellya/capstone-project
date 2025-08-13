kimport { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  real,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  company: varchar("company"),
  jobTitle: varchar("job_title"),
  department: varchar("department"),
  phone: varchar("phone"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Datasets table
export const datasets = pgTable("datasets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  filename: varchar("filename").notNull(),
  format: varchar("format").notNull(), // csv, json, txt, xlsx
  size: integer("size").notNull(), // in bytes
  status: varchar("status").notNull().default("processing"), // processing, ready, error
  filePath: varchar("file_path").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ML Models table
export const mlModels = pgTable("ml_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  algorithm: varchar("algorithm").notNull(), // random_forest, xgboost, logistic_regression, etc.
  status: varchar("status").notNull().default("training"), // training, completed, failed
  accuracy: real("accuracy"),
  precision: real("precision"),
  recall: real("recall"),
  f1Score: real("f1_score"),
  trainingDatasetId: varchar("training_dataset_id").references(() => datasets.id),
  testDatasetId: varchar("test_dataset_id").references(() => datasets.id),
  modelPath: varchar("model_path"),
  isActive: boolean("is_active").default(false),
  trainingTime: integer("training_time"), // in minutes
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Training Sessions table
export const trainingSessions = pgTable("training_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  modelId: varchar("model_id").notNull().references(() => mlModels.id),
  status: varchar("status").notNull().default("running"), // running, completed, failed, stopped
  progress: real("progress").default(0), // 0-100
  currentEpoch: integer("current_epoch").default(0),
  totalEpochs: integer("total_epochs"),
  estimatedTimeRemaining: integer("estimated_time_remaining"), // in minutes
  logs: text("logs"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Predictions table
export const predictions = pgTable("predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  modelId: varchar("model_id").notNull().references(() => mlModels.id),
  transactionId: varchar("transaction_id").notNull(),
  amount: real("amount"),
  prediction: varchar("prediction").notNull(), // fraud, legitimate
  confidence: real("confidence").notNull(), // 0-1
  riskScore: real("risk_score").notNull(), // 0-1
  features: jsonb("features"), // input features used for prediction
  createdAt: timestamp("created_at").defaultNow(),
});

// User Settings table
export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").unique().notNull().references(() => users.id),
  activeModelId: varchar("active_model_id").references(() => mlModels.id),
  defaultTrainingDatasetId: varchar("default_training_dataset_id").references(() => datasets.id),
  defaultTestDatasetId: varchar("default_test_dataset_id").references(() => datasets.id),
  fraudAlertThreshold: real("fraud_alert_threshold").default(0.85),
  highRiskAlerts: boolean("high_risk_alerts").default(true),
  trainingNotifications: boolean("training_notifications").default(true),
  maintenanceAlerts: boolean("maintenance_alerts").default(false),
  maxConcurrentJobs: integer("max_concurrent_jobs").default(2),
  predictionBatchSize: integer("prediction_batch_size").default(500),
  autoBackupModels: varchar("auto_backup_models").default("daily"),
  dataRetentionDays: integer("data_retention_days").default(180),
  apiRateLimit: integer("api_rate_limit").default(1000),
  enableApiLogging: boolean("enable_api_logging").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Dataset = typeof datasets.$inferSelect;
export type MlModel = typeof mlModels.$inferSelect;
export type TrainingSession = typeof trainingSessions.$inferSelect;
export type Prediction = typeof predictions.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;

// Insert schemas using drizzle-zod
export const insertDatasetSchema = createInsertSchema(datasets).omit({
  id: true,
  createdAt: true,
});

export const insertMlModelSchema = createInsertSchema(mlModels).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertTrainingSessionSchema = createInsertSchema(trainingSessions).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertPredictionSchema = createInsertSchema(predictions).omit({
  id: true,
  createdAt: true,
});

// Insert types
export type InsertDataset = z.infer<typeof insertDatasetSchema>;
export type InsertMlModel = z.infer<typeof insertMlModelSchema>;
export type InsertTrainingSession = z.infer<typeof insertTrainingSessionSchema>;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;