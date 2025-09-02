import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertProjectSchema,
  insertScreenSchema,
  insertComplexitySchema,
  insertScreenTypeSchema,
  insertEstimationSchema,
  insertEstimationDetailSchema,
} from "@shared/schema";
import { z } from "zod";

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

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/project-hours', isAuthenticated, async (req, res) => {
    try {
      const data = await storage.getProjectHoursData();
      res.json(data);
    } catch (error) {
      console.error("Error fetching project hours data:", error);
      res.status(500).json({ message: "Failed to fetch project hours data" });
    }
  });

  app.get('/api/dashboard/screen-type-distribution', isAuthenticated, async (req, res) => {
    try {
      const data = await storage.getScreenTypeDistribution();
      res.json(data);
    } catch (error) {
      console.error("Error fetching screen type distribution:", error);
      res.status(500).json({ message: "Failed to fetch screen type distribution" });
    }
  });

  // Project routes
  app.get('/api/projects', isAuthenticated, async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const projectData = insertProjectSchema.parse({
        ...req.body,
        createdBy: req.user.claims.sub,
      });
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.put('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const projectData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, projectData);
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProject(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Screen routes
  app.get('/api/projects/:projectId/screens', isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const screens = await storage.getScreensByProject(projectId);
      res.json(screens);
    } catch (error) {
      console.error("Error fetching screens:", error);
      res.status(500).json({ message: "Failed to fetch screens" });
    }
  });

  app.post('/api/screens', isAuthenticated, async (req, res) => {
    try {
      const screenData = insertScreenSchema.parse(req.body);
      const screen = await storage.createScreen(screenData);
      res.status(201).json(screen);
    } catch (error) {
      console.error("Error creating screen:", error);
      res.status(500).json({ message: "Failed to create screen" });
    }
  });

  app.put('/api/screens/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const screenData = insertScreenSchema.partial().parse(req.body);
      const screen = await storage.updateScreen(id, screenData);
      res.json(screen);
    } catch (error) {
      console.error("Error updating screen:", error);
      res.status(500).json({ message: "Failed to update screen" });
    }
  });

  app.delete('/api/screens/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteScreen(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting screen:", error);
      res.status(500).json({ message: "Failed to delete screen" });
    }
  });

  // Complexity Master routes
  app.get('/api/complexity', isAuthenticated, async (req, res) => {
    try {
      const complexities = await storage.getComplexityMaster();
      res.json(complexities);
    } catch (error) {
      console.error("Error fetching complexities:", error);
      res.status(500).json({ message: "Failed to fetch complexities" });
    }
  });

  app.post('/api/complexity', isAuthenticated, async (req, res) => {
    try {
      const complexityData = insertComplexitySchema.parse(req.body);
      const complexity = await storage.createComplexity(complexityData);
      res.status(201).json(complexity);
    } catch (error) {
      console.error("Error creating complexity:", error);
      res.status(500).json({ message: "Failed to create complexity" });
    }
  });

  app.put('/api/complexity/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const complexityData = insertComplexitySchema.partial().parse(req.body);
      const complexity = await storage.updateComplexity(id, complexityData);
      res.json(complexity);
    } catch (error) {
      console.error("Error updating complexity:", error);
      res.status(500).json({ message: "Failed to update complexity" });
    }
  });

  app.delete('/api/complexity/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteComplexity(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting complexity:", error);
      res.status(500).json({ message: "Failed to delete complexity" });
    }
  });

  // Screen Type Master routes
  app.get('/api/screen-types', isAuthenticated, async (req, res) => {
    try {
      const screenTypes = await storage.getScreenTypeMaster();
      res.json(screenTypes);
    } catch (error) {
      console.error("Error fetching screen types:", error);
      res.status(500).json({ message: "Failed to fetch screen types" });
    }
  });

  app.post('/api/screen-types', isAuthenticated, async (req, res) => {
    try {
      const screenTypeData = insertScreenTypeSchema.parse(req.body);
      const screenType = await storage.createScreenType(screenTypeData);
      res.status(201).json(screenType);
    } catch (error) {
      console.error("Error creating screen type:", error);
      res.status(500).json({ message: "Failed to create screen type" });
    }
  });

  app.put('/api/screen-types/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const screenTypeData = insertScreenTypeSchema.partial().parse(req.body);
      const screenType = await storage.updateScreenType(id, screenTypeData);
      res.json(screenType);
    } catch (error) {
      console.error("Error updating screen type:", error);
      res.status(500).json({ message: "Failed to update screen type" });
    }
  });

  app.delete('/api/screen-types/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteScreenType(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting screen type:", error);
      res.status(500).json({ message: "Failed to delete screen type" });
    }
  });

  // Generic Screen Types routes
  app.get('/api/generic-screen-types', isAuthenticated, async (req, res) => {
    try {
      const genericScreenTypes = await storage.getGenericScreenTypes();
      res.json(genericScreenTypes);
    } catch (error) {
      console.error("Error fetching generic screen types:", error);
      res.status(500).json({ message: "Failed to fetch generic screen types" });
    }
  });

  // Estimation routes
  app.get('/api/estimations', isAuthenticated, async (req, res) => {
    try {
      const estimations = await storage.getEstimations();
      res.json(estimations);
    } catch (error) {
      console.error("Error fetching estimations:", error);
      res.status(500).json({ message: "Failed to fetch estimations" });
    }
  });

  app.get('/api/projects/:projectId/estimations', isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const estimations = await storage.getEstimationsByProject(projectId);
      res.json(estimations);
    } catch (error) {
      console.error("Error fetching project estimations:", error);
      res.status(500).json({ message: "Failed to fetch project estimations" });
    }
  });

  app.get('/api/estimations/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const estimation = await storage.getEstimation(id);
      if (!estimation) {
        return res.status(404).json({ message: "Estimation not found" });
      }
      res.json(estimation);
    } catch (error) {
      console.error("Error fetching estimation:", error);
      res.status(500).json({ message: "Failed to fetch estimation" });
    }
  });

  app.get('/api/estimations/:id/details', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const details = await storage.getEstimationDetails(id);
      res.json(details);
    } catch (error) {
      console.error("Error fetching estimation details:", error);
      res.status(500).json({ message: "Failed to fetch estimation details" });
    }
  });

  const createEstimationSchema = z.object({
    estimation: insertEstimationSchema,
    details: z.array(insertEstimationDetailSchema.omit({ estimationId: true })),
  });

  app.post('/api/estimations', isAuthenticated, async (req: any, res) => {
    try {
      console.log('Request body:', req.body);
      console.log('User claims:', req.user?.claims);
      
      const { estimation, details } = createEstimationSchema.parse(req.body);
      const estimationWithUser = {
        ...estimation,
        createdBy: req.user?.claims?.sub || 'anonymous',
      };
      const newEstimation = await storage.createEstimation(estimationWithUser, details);
      res.status(201).json(newEstimation);
    } catch (error) {
      console.error("Error creating estimation:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
      res.status(500).json({ message: "Failed to create estimation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
