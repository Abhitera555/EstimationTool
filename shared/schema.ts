import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  serial,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("viewer"), // admin, estimator, viewer
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Screens table
export const screens = pgTable("screens", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Complexity Master table
export const complexityMaster = pgTable("complexity_master", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  hours: integer("hours").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Screen Type Master table
export const screenTypeMaster = pgTable("screen_type_master", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  hours: integer("hours").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Estimations table
export const estimations = pgTable("estimations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  name: varchar("name", { length: 255 }).notNull(),
  totalHours: integer("total_hours").notNull(),
  versionNumber: varchar("version_number", { length: 50 }).notNull(),
  notes: text("notes"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Estimation Details table
export const estimationDetails = pgTable("estimation_details", {
  id: serial("id").primaryKey(),
  estimationId: integer("estimation_id").notNull().references(() => estimations.id, { onDelete: "cascade" }),
  screenId: integer("screen_id").notNull().references(() => screens.id),
  complexityId: integer("complexity_id").notNull().references(() => complexityMaster.id),
  screenTypeId: integer("screen_type_id").notNull().references(() => screenTypeMaster.id),
  calculatedHours: integer("calculated_hours").notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  estimations: many(estimations),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [projects.createdBy],
    references: [users.id],
  }),
  screens: many(screens),
  estimations: many(estimations),
}));

export const screensRelations = relations(screens, ({ one, many }) => ({
  project: one(projects, {
    fields: [screens.projectId],
    references: [projects.id],
  }),
  estimationDetails: many(estimationDetails),
}));

export const estimationsRelations = relations(estimations, ({ one, many }) => ({
  project: one(projects, {
    fields: [estimations.projectId],
    references: [projects.id],
  }),
  createdBy: one(users, {
    fields: [estimations.createdBy],
    references: [users.id],
  }),
  details: many(estimationDetails),
}));

export const estimationDetailsRelations = relations(estimationDetails, ({ one }) => ({
  estimation: one(estimations, {
    fields: [estimationDetails.estimationId],
    references: [estimations.id],
  }),
  screen: one(screens, {
    fields: [estimationDetails.screenId],
    references: [screens.id],
  }),
  complexity: one(complexityMaster, {
    fields: [estimationDetails.complexityId],
    references: [complexityMaster.id],
  }),
  screenType: one(screenTypeMaster, {
    fields: [estimationDetails.screenTypeId],
    references: [screenTypeMaster.id],
  }),
}));

export const complexityMasterRelations = relations(complexityMaster, ({ many }) => ({
  estimationDetails: many(estimationDetails),
}));

export const screenTypeMasterRelations = relations(screenTypeMaster, ({ many }) => ({
  estimationDetails: many(estimationDetails),
}));

// Schemas for validation
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScreenSchema = createInsertSchema(screens).omit({
  id: true,
  createdAt: true,
});

export const insertComplexitySchema = createInsertSchema(complexityMaster).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScreenTypeSchema = createInsertSchema(screenTypeMaster).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEstimationSchema = createInsertSchema(estimations).omit({
  id: true,
  createdAt: true,
});

export const insertEstimationDetailSchema = createInsertSchema(estimationDetails).omit({
  id: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Screen = typeof screens.$inferSelect;
export type InsertScreen = z.infer<typeof insertScreenSchema>;
export type ComplexityMaster = typeof complexityMaster.$inferSelect;
export type InsertComplexity = z.infer<typeof insertComplexitySchema>;
export type ScreenTypeMaster = typeof screenTypeMaster.$inferSelect;
export type InsertScreenType = z.infer<typeof insertScreenTypeSchema>;
export type Estimation = typeof estimations.$inferSelect;
export type InsertEstimation = z.infer<typeof insertEstimationSchema>;
export type EstimationDetail = typeof estimationDetails.$inferSelect;
export type InsertEstimationDetail = z.infer<typeof insertEstimationDetailSchema>;
