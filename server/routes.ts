import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./revalsys-auth";
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
  setupAuth(app);

  // Auth routes are now handled in setupEmailAuth

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

  app.get('/api/dashboard/complexity-distribution', isAuthenticated, async (req, res) => {
    try {
      const data = await storage.getComplexityDistribution();
      res.json(data);
    } catch (error) {
      console.error("Error fetching complexity distribution:", error);
      res.status(500).json({ message: "Failed to fetch complexity distribution" });
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
  app.get('/api/screens', isAuthenticated, async (req, res) => {
    try {
      const screens = await storage.getAllScreens();
      res.json(screens);
    } catch (error) {
      console.error("Error fetching all screens:", error);
      res.status(500).json({ message: "Failed to fetch screens" });
    }
  });

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

  // Complexity Screen Behavior Mapping routes
  app.get('/api/hour-mapping', isAuthenticated, async (req, res) => {
    try {
      const mapping = await storage.getComplexityScreenBehaviorMapping();
      res.json(mapping);
    } catch (error) {
      console.error("Error fetching hour mapping:", error);
      res.status(500).json({ message: "Failed to fetch hour mapping" });
    }
  });

  app.get('/api/hour-mapping/:complexity/:behavior', isAuthenticated, async (req, res) => {
    try {
      const { complexity, behavior } = req.params;
      const hours = await storage.getHoursByComplexityAndBehavior(complexity, behavior);
      res.json({ hours });
    } catch (error) {
      console.error("Error fetching hours for complexity and behavior:", error);
      res.status(500).json({ message: "Failed to fetch hours" });
    }
  });

  app.post('/api/hour-mapping', isAuthenticated, async (req, res) => {
    try {
      const { complexityName, screenBehavior, hours } = req.body;
      
      if (!complexityName || !screenBehavior || typeof hours !== 'number' || hours < 0) {
        return res.status(400).json({ message: "Complexity name, screen behavior, and non-negative hours are required" });
      }
      
      const newMapping = await storage.createHourMapping(complexityName, screenBehavior, hours);
      res.status(201).json(newMapping);
    } catch (error) {
      console.error("Error creating hour mapping:", error);
      res.status(500).json({ message: "Failed to create hour mapping" });
    }
  });

  app.put('/api/hour-mapping/:complexity/:behavior', isAuthenticated, async (req, res) => {
    try {
      const { complexity, behavior } = req.params;
      const { hours } = req.body;
      
      if (typeof hours !== 'number' || hours < 0) {
        return res.status(400).json({ message: "Hours must be a non-negative number" });
      }
      
      const updatedMapping = await storage.updateHourMapping(complexity, behavior, hours);
      res.json(updatedMapping);
    } catch (error) {
      console.error("Error updating hour mapping:", error);
      res.status(500).json({ message: "Failed to update hour mapping" });
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
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
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
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid estimation ID" });
      }
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
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid estimation ID" });
      }
      const details = await storage.getEstimationDetails(id);
      res.json(details);
    } catch (error) {
      console.error("Error fetching estimation details:", error);
      res.status(500).json({ message: "Failed to fetch estimation details" });
    }
  });

  // Get all estimations with detailed breakdown for reports
  app.get('/api/estimations/detailed', isAuthenticated, async (req, res) => {
    try {
      const estimations = await storage.getEstimationsWithDetails();
      res.json(estimations);
    } catch (error) {
      console.error("Error fetching detailed estimations:", error);
      res.status(500).json({ message: "Failed to fetch detailed estimations" });
    }
  });

  // Email reports route
  app.post('/api/reports/email', isAuthenticated, async (req: any, res) => {
    try {
      const { to, subject, message, reportData } = req.body;
      
      if (!to || !subject) {
        return res.status(400).json({ message: "Missing required fields: to, subject" });
      }

      // Import email functions
      const { sendEmail, generateReportHTML } = await import('./email');
      
      // Generate HTML content
      const htmlContent = generateReportHTML(reportData);
      
      // Send email
      await sendEmail({
        to,
        subject,
        text: message,
        html: htmlContent
      });
      
      res.json({ message: "Email sent successfully" });
    } catch (error: any) {
      console.error("Error sending email:", error);
      if (error.message?.includes('SENDGRID_API_KEY')) {
        res.status(503).json({ message: "Email service not configured. Please contact administrator." });
      } else {
        res.status(500).json({ message: "Failed to send email" });
      }
    }
  });

  // Create a custom schema for API requests that excludes server-managed fields
  const createEstimationRequestSchema = z.object({
    estimation: z.object({
      projectId: z.number(),
      name: z.string(),
      totalHours: z.number(),
      versionNumber: z.string(),
      notes: z.string().optional(),
    }),
    details: z.array(z.object({
      screenId: z.number(),
      complexityId: z.number(),
      screenTypeId: z.number(),
      calculatedHours: z.number(),
    })),
  });

  app.post('/api/estimations', isAuthenticated, async (req: any, res) => {
    try {
      // Skip validation temporarily to isolate the issue
      const requestData = req.body;
      console.log('Raw request data:', JSON.stringify(requestData, null, 2));
      
      // Get the user ID from the authenticated session
      const userId = req.user?.id;
      console.log('User ID from session:', userId);
      console.log('Full user object:', req.user);
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated properly" });
      }
      
      // Manually construct the estimation object
      const estimation = {
        projectId: requestData.estimation.projectId,
        name: requestData.estimation.name,
        totalHours: requestData.estimation.totalHours,
        versionNumber: requestData.estimation.versionNumber,
        notes: requestData.estimation.notes || '',
        createdBy: userId,
      };
      
      console.log('Final estimation object:', JSON.stringify(estimation, null, 2));
      console.log('Details array:', JSON.stringify(requestData.details, null, 2));
      
      const newEstimation = await storage.createEstimation(estimation, requestData.details);
      res.status(201).json(newEstimation);
    } catch (error) {
      console.error("Error creating estimation:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ message: "Failed to create estimation", error: error instanceof Error ? error.message : String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
