import {
  users,
  projects,
  screens,
  complexityMaster,
  screenTypeMaster,
  genericScreenTypes,
  estimations,
  estimationDetails,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type Screen,
  type InsertScreen,
  type ComplexityMaster,
  type InsertComplexity,
  type ScreenTypeMaster,
  type InsertScreenType,
  type GenericScreenType,
  type Estimation,
  type InsertEstimation,
  type EstimationDetail,
  type InsertEstimationDetail,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Project operations
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: number): Promise<void>;

  // Screen operations
  getScreensByProject(projectId: number): Promise<Screen[]>;
  getScreen(id: number): Promise<Screen | undefined>;
  createScreen(screen: InsertScreen): Promise<Screen>;
  updateScreen(id: number, screen: Partial<InsertScreen>): Promise<Screen>;
  deleteScreen(id: number): Promise<void>;

  // Complexity Master operations
  getComplexityMaster(): Promise<ComplexityMaster[]>;
  getComplexity(id: number): Promise<ComplexityMaster | undefined>;
  createComplexity(complexity: InsertComplexity): Promise<ComplexityMaster>;
  updateComplexity(id: number, complexity: Partial<InsertComplexity>): Promise<ComplexityMaster>;
  deleteComplexity(id: number): Promise<void>;

  // Screen Type Master operations
  getScreenTypeMaster(): Promise<ScreenTypeMaster[]>;
  getScreenType(id: number): Promise<ScreenTypeMaster | undefined>;
  createScreenType(screenType: InsertScreenType): Promise<ScreenTypeMaster>;
  updateScreenType(id: number, screenType: Partial<InsertScreenType>): Promise<ScreenTypeMaster>;
  deleteScreenType(id: number): Promise<void>;

  // Generic Screen Types operations
  getGenericScreenTypes(): Promise<GenericScreenType[]>;

  // Estimation operations
  getEstimations(): Promise<any[]>;
  getEstimationsByProject(projectId: number): Promise<any[]>;
  getEstimation(id: number): Promise<any>;
  createEstimation(estimation: InsertEstimation, details: InsertEstimationDetail[]): Promise<Estimation>;
  getEstimationDetails(estimationId: number): Promise<any[]>;

  // Dashboard stats
  getDashboardStats(): Promise<any>;
  getProjectHoursData(): Promise<any[]>;
  getScreenTypeDistribution(): Promise<any[]>;
  getComplexityDistribution(): Promise<any[]>;
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

  // Project operations
  async getProjects(): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...project, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Screen operations
  async getScreensByProject(projectId: number): Promise<Screen[]> {
    return await db
      .select()
      .from(screens)
      .where(eq(screens.projectId, projectId))
      .orderBy(screens.name);
  }

  async getScreen(id: number): Promise<Screen | undefined> {
    const [screen] = await db.select().from(screens).where(eq(screens.id, id));
    return screen;
  }

  async createScreen(screen: InsertScreen): Promise<Screen> {
    const [newScreen] = await db.insert(screens).values(screen).returning();
    return newScreen;
  }

  async updateScreen(id: number, screen: Partial<InsertScreen>): Promise<Screen> {
    const [updatedScreen] = await db
      .update(screens)
      .set(screen)
      .where(eq(screens.id, id))
      .returning();
    return updatedScreen;
  }

  async deleteScreen(id: number): Promise<void> {
    await db.delete(screens).where(eq(screens.id, id));
  }

  // Complexity Master operations
  async getComplexityMaster(): Promise<ComplexityMaster[]> {
    return await db
      .select()
      .from(complexityMaster)
      .orderBy(complexityMaster.hours);
  }

  async getComplexity(id: number): Promise<ComplexityMaster | undefined> {
    const [complexity] = await db
      .select()
      .from(complexityMaster)
      .where(eq(complexityMaster.id, id));
    return complexity;
  }

  async createComplexity(complexity: InsertComplexity): Promise<ComplexityMaster> {
    const [newComplexity] = await db
      .insert(complexityMaster)
      .values(complexity)
      .returning();
    return newComplexity;
  }

  async updateComplexity(id: number, complexity: Partial<InsertComplexity>): Promise<ComplexityMaster> {
    const [updatedComplexity] = await db
      .update(complexityMaster)
      .set({ ...complexity, updatedAt: new Date() })
      .where(eq(complexityMaster.id, id))
      .returning();
    return updatedComplexity;
  }

  async deleteComplexity(id: number): Promise<void> {
    await db.delete(complexityMaster).where(eq(complexityMaster.id, id));
  }

  // Screen Type Master operations
  async getScreenTypeMaster(): Promise<ScreenTypeMaster[]> {
    return await db
      .select()
      .from(screenTypeMaster)
      .orderBy(screenTypeMaster.hours);
  }

  async getScreenType(id: number): Promise<ScreenTypeMaster | undefined> {
    const [screenType] = await db
      .select()
      .from(screenTypeMaster)
      .where(eq(screenTypeMaster.id, id));
    return screenType;
  }

  async createScreenType(screenType: InsertScreenType): Promise<ScreenTypeMaster> {
    const [newScreenType] = await db
      .insert(screenTypeMaster)
      .values(screenType)
      .returning();
    return newScreenType;
  }

  async updateScreenType(id: number, screenType: Partial<InsertScreenType>): Promise<ScreenTypeMaster> {
    const [updatedScreenType] = await db
      .update(screenTypeMaster)
      .set({ ...screenType, updatedAt: new Date() })
      .where(eq(screenTypeMaster.id, id))
      .returning();
    return updatedScreenType;
  }

  async deleteScreenType(id: number): Promise<void> {
    await db.delete(screenTypeMaster).where(eq(screenTypeMaster.id, id));
  }

  // Generic Screen Types operations
  async getGenericScreenTypes(): Promise<GenericScreenType[]> {
    return await db.select().from(genericScreenTypes).orderBy(genericScreenTypes.name);
  }

  // Estimation operations
  async getEstimations(): Promise<any[]> {
    return await db
      .select({
        id: estimations.id,
        name: estimations.name,
        totalHours: estimations.totalHours,
        versionNumber: estimations.versionNumber,
        notes: estimations.notes,
        createdAt: estimations.createdAt,
        projectId: estimations.projectId,
        projectName: projects.name,
        createdBy: estimations.createdBy,
        creatorName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`,
      })
      .from(estimations)
      .leftJoin(projects, eq(estimations.projectId, projects.id))
      .leftJoin(users, eq(estimations.createdBy, users.id))
      .orderBy(desc(estimations.createdAt));
  }

  async getEstimationsByProject(projectId: number): Promise<any[]> {
    return await db
      .select({
        id: estimations.id,
        name: estimations.name,
        totalHours: estimations.totalHours,
        versionNumber: estimations.versionNumber,
        notes: estimations.notes,
        createdAt: estimations.createdAt,
        createdBy: estimations.createdBy,
        creatorName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`,
      })
      .from(estimations)
      .leftJoin(users, eq(estimations.createdBy, users.id))
      .where(eq(estimations.projectId, projectId))
      .orderBy(desc(estimations.createdAt));
  }

  async getEstimation(id: number): Promise<any> {
    const [estimation] = await db
      .select({
        id: estimations.id,
        name: estimations.name,
        totalHours: estimations.totalHours,
        versionNumber: estimations.versionNumber,
        notes: estimations.notes,
        createdAt: estimations.createdAt,
        projectId: estimations.projectId,
        projectName: projects.name,
        createdBy: estimations.createdBy,
        creatorName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`,
      })
      .from(estimations)
      .leftJoin(projects, eq(estimations.projectId, projects.id))
      .leftJoin(users, eq(estimations.createdBy, users.id))
      .where(eq(estimations.id, id));
    return estimation;
  }

  async createEstimation(estimation: InsertEstimation, details: InsertEstimationDetail[]): Promise<Estimation> {
    return await db.transaction(async (tx) => {
      const [newEstimation] = await tx
        .insert(estimations)
        .values(estimation)
        .returning();

      const detailsWithEstimationId = details.map(detail => ({
        ...detail,
        estimationId: newEstimation.id,
      }));

      await tx.insert(estimationDetails).values(detailsWithEstimationId);

      return newEstimation;
    });
  }

  async getEstimationDetails(estimationId: number): Promise<any[]> {
    return await db
      .select({
        id: estimationDetails.id,
        screenId: estimationDetails.screenId,
        screenName: screens.name,
        complexityId: estimationDetails.complexityId,
        complexityName: complexityMaster.name,
        complexityHours: complexityMaster.hours,
        screenTypeId: estimationDetails.screenTypeId,
        screenTypeName: screenTypeMaster.name,
        screenTypeHours: screenTypeMaster.hours,
        calculatedHours: estimationDetails.calculatedHours,
      })
      .from(estimationDetails)
      .leftJoin(screens, eq(estimationDetails.screenId, screens.id))
      .leftJoin(complexityMaster, eq(estimationDetails.complexityId, complexityMaster.id))
      .leftJoin(screenTypeMaster, eq(estimationDetails.screenTypeId, screenTypeMaster.id))
      .where(eq(estimationDetails.estimationId, estimationId));
  }

  // Dashboard stats
  async getDashboardStats(): Promise<any> {
    const [stats] = await db
      .select({
        totalProjects: sql<number>`COUNT(DISTINCT ${projects.id})`,
        totalScreens: sql<number>`COUNT(DISTINCT ${screens.id})`,
        totalEstimations: sql<number>`COUNT(DISTINCT ${estimations.id})`,
        totalHours: sql<number>`COALESCE(SUM(${estimations.totalHours}), 0)`,
      })
      .from(projects)
      .leftJoin(screens, eq(projects.id, screens.projectId))
      .leftJoin(estimations, eq(projects.id, estimations.projectId));

    return stats;
  }

  async getProjectHoursData(): Promise<any[]> {
    return await db
      .select({
        projectName: projects.name,
        totalHours: sql<number>`COALESCE(SUM(${estimations.totalHours}), 0)`,
      })
      .from(projects)
      .leftJoin(estimations, eq(projects.id, estimations.projectId))
      .groupBy(projects.id, projects.name)
      .orderBy(desc(sql<number>`COALESCE(SUM(${estimations.totalHours}), 0)`))
      .limit(10);
  }

  async getScreenTypeDistribution(): Promise<any[]> {
    return await db
      .select({
        screenTypeName: screenTypeMaster.name,
        count: sql<number>`COUNT(${estimationDetails.id})`,
      })
      .from(screenTypeMaster)
      .leftJoin(estimationDetails, eq(screenTypeMaster.id, estimationDetails.screenTypeId))
      .groupBy(screenTypeMaster.id, screenTypeMaster.name)
      .orderBy(desc(sql<number>`COUNT(${estimationDetails.id})`));
  }

  async getComplexityDistribution(): Promise<any[]> {
    return await db
      .select({
        complexityName: complexityMaster.name,
        count: sql<number>`COUNT(${estimationDetails.id})`,
        totalHours: sql<number>`COALESCE(SUM(${estimationDetails.calculatedHours}), 0)`,
      })
      .from(complexityMaster)
      .leftJoin(estimationDetails, eq(complexityMaster.id, estimationDetails.complexityId))
      .groupBy(complexityMaster.id, complexityMaster.name)
      .orderBy(desc(sql<number>`COUNT(${estimationDetails.id})`));
  }
}

export const storage = new DatabaseStorage();
