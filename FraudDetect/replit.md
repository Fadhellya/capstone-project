# Overview

FraudGuard ML is a comprehensive machine learning fraud detection platform designed for medium-sized fintech and trading companies that handle high-value transactions. The application provides a complete workflow for dataset management, ML model training, prediction analysis, and real-time fraud detection with professional visualization and analytics capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library built on Radix UI primitives for accessibility and consistency
- **Styling**: Tailwind CSS with custom design system implementing professional color schemes and typography
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database ORM**: Drizzle ORM for type-safe database interactions
- **Database**: PostgreSQL with Neon serverless hosting
- **Authentication**: OpenID Connect (OIDC) integration with Replit authentication system
- **Session Management**: Express sessions with PostgreSQL session store using connect-pg-simple
- **File Upload**: Multer middleware for handling dataset uploads with validation for CSV, JSON, TXT, and Excel formats

## Database Schema Design
- **Users**: Store user profiles with company information and authentication details
- **Datasets**: Track uploaded datasets with metadata, file information, and processing status
- **ML Models**: Store trained model information, metrics, and deployment status
- **Training Sessions**: Log training progress, parameters, and results
- **Predictions**: Store prediction results and fraud detection outcomes
- **User Settings**: Manage application preferences and configuration

## Authentication & Authorization
- **Single Sign-On**: Replit OIDC integration for seamless authentication
- **Session Persistence**: Server-side session storage with automatic cleanup
- **Route Protection**: Middleware-based authentication checks for all API endpoints
- **User Context**: React context for maintaining authentication state across components

## File Management System
- **Upload Validation**: Strict file type checking (CSV, JSON, TXT, Excel) with 10MB size limits
- **Storage**: Local file system storage with organized directory structure
- **Processing Pipeline**: Automatic dataset validation and preprocessing for ML training

## API Architecture
- **RESTful Design**: Clean API endpoints following REST conventions
- **Error Handling**: Centralized error handling with consistent response formats
- **Request Logging**: Detailed API request logging for monitoring and debugging
- **Data Validation**: Schema validation using Zod for all API inputs

# External Dependencies

## Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL database hosting with connection pooling
- **Drizzle Kit**: Database migration and schema management tools

## Authentication Services
- **Replit OIDC**: OpenID Connect provider for user authentication and authorization
- **Passport.js**: Authentication middleware for handling OIDC strategies

## Development Tools
- **Vite**: Fast development server and build tool with hot module replacement
- **TypeScript**: Static type checking for both frontend and backend code
- **ESBuild**: Fast JavaScript bundler for production builds

## UI Libraries
- **Radix UI**: Headless UI primitives for accessibility-compliant components
- **Lucide React**: Icon library providing consistent iconography
- **React Dropzone**: File upload component with drag-and-drop functionality
- **Date-fns**: Date manipulation and formatting utilities

## Monitoring & Development
- **Replit Runtime**: Development environment with integrated debugging and deployment
- **Express Logging**: Custom request logging middleware for API monitoring