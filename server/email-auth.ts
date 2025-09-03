import express, { type Express } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Simple in-memory OTP storage (in production, use Redis or database)
const otpStore = new Map<string, { otp: string; expires: number; userId?: string }>();

// OTP configuration
const OTP_EXPIRY_MINUTES = 10;
const OTP_LENGTH = 6;

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Session configuration
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: sessionTtl,
    },
  });
}

// Middleware to check authentication
export function isAuthenticated(req: any, res: any, next: any) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
}

export function setupEmailAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Send OTP to email
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({ message: "Valid email is required" });
      }

      const otp = generateOTP();
      const expires = Date.now() + (OTP_EXPIRY_MINUTES * 60 * 1000);
      
      // Store OTP (in memory for now)
      otpStore.set(email.toLowerCase(), { otp, expires });
      
      // In a real application, you would send this via email
      // For now, we'll print it to console as requested
      console.log(`🔐 OTP for ${email}: ${otp} (expires in ${OTP_EXPIRY_MINUTES} minutes)`);
      
      res.json({ 
        message: "OTP sent successfully",
        debug: process.env.NODE_ENV === 'development' ? { otp } : undefined
      });
    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  // Verify OTP and login
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, otp } = req.body;
      
      if (!email || !otp) {
        return res.status(400).json({ message: "Email and OTP are required" });
      }

      const emailLower = email.toLowerCase();
      const storedData = otpStore.get(emailLower);
      
      if (!storedData) {
        return res.status(400).json({ message: "OTP not found or expired" });
      }

      if (Date.now() > storedData.expires) {
        otpStore.delete(emailLower);
        return res.status(400).json({ message: "OTP expired" });
      }

      if (storedData.otp !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      // OTP is valid, create or get user
      let user = await storage.getUserByEmail(emailLower);
      if (!user) {
        // Create new user
        const emailParts = emailLower.split('@');
        const username = emailParts[0];
        
        user = await storage.createUser({
          email: emailLower,
          firstName: username,
          lastName: "",
          profileImageUrl: null,
        });
      }

      // Clean up OTP
      otpStore.delete(emailLower);
      
      // Set session
      (req as any).session.userId = user.id;
      (req as any).session.userEmail = user.email;
      
      res.json({ 
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        }
      });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  // Get current user
  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: "admin", // Default role
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    (req as any).session.destroy((err: any) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Legacy route compatibility
  app.get("/api/login", (req, res) => {
    res.redirect("/?auth=true");
  });

  app.post("/api/logout", (req, res) => {
    (req as any).session.destroy((err: any) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.redirect("/");
    });
  });
}