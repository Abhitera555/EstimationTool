# Estimation Tool

## Overview

The Estimation Tool is a full-stack web application designed for project estimation management. It enables teams to create, manage, and track project estimations based on configurable complexity levels and screen types. The application provides role-based access control with three user roles (Admin, Estimator, Viewer), comprehensive CRUD operations for project masters, and visual analytics through dashboard charts.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite for development and build tooling
- **UI Library**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Routing**: Wouter for client-side routing with role-based navigation
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Charts**: Recharts library for dashboard analytics (bar charts, pie charts)

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with comprehensive CRUD endpoints for all entities
- **Middleware**: Custom logging, JSON parsing, and error handling middleware
- **Development**: Hot reload with Vite integration for full-stack development

### Authentication & Authorization
- **Provider**: Replit's OAuth2/OpenID Connect integration
- **Session Management**: Express sessions with PostgreSQL storage using connect-pg-simple
- **Role-based Access**: Three roles (admin, estimator, viewer) with different permission levels
- **Security**: JWT tokens with role-based route protection

### Database Design
- **Database**: PostgreSQL with connection pooling via Neon serverless
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Normalized relational design with proper foreign key relationships
- **Tables**: Users, projects, screens, complexity_master, screen_type_master, estimations, estimation_details, sessions

### Data Flow & Business Logic
- **Estimation Calculation**: Automatic hour calculation based on complexity + screen type weightages
- **Version Control**: Estimations support version numbers for historical tracking
- **Master Data Management**: Configurable complexity and screen type masters with editable hour weightages
- **Project-Screen Hierarchy**: Projects contain multiple screens, each estimated individually

### API Structure
- Authentication endpoints (`/api/auth/*`)
- Dashboard analytics (`/api/dashboard/*`)
- CRUD operations for all entities (`/api/projects`, `/api/screens`, `/api/complexity`, `/api/screen-types`, `/api/estimations`)
- Nested resource endpoints (e.g., project-specific screens)

## External Dependencies

### Database & Infrastructure
- **Neon Serverless PostgreSQL**: Cloud-hosted PostgreSQL database with connection pooling
- **Replit Authentication**: OAuth2/OpenID Connect provider for user authentication
- **Replit Hosting**: Development and deployment platform

### Key Libraries
- **@neondatabase/serverless**: PostgreSQL client with WebSocket support
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Headless UI component primitives
- **recharts**: Chart library for data visualization
- **wouter**: Lightweight React router
- **tailwindcss**: Utility-first CSS framework
- **zod**: TypeScript-first schema validation

### Development Tools
- **Vite**: Build tool with HMR and development server
- **TypeScript**: Static type checking
- **ESLint/Prettier**: Code formatting and linting
- **Drizzle Kit**: Database migrations and schema management

### Session & Security
- **connect-pg-simple**: PostgreSQL session store
- **express-session**: Session middleware
- **openid-client**: OpenID Connect client library