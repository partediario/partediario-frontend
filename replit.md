# Parte Diario PRO - Sistema de Gestión Ganadera

## Overview

Parte Diario PRO is a comprehensive livestock management system built with Next.js 14, React, and TypeScript. The application enables ranchers and agricultural managers to track daily operations, manage multiple establishments, monitor livestock movements, weather data, supplies, and activities across cattle ranching operations. The system features a role-based permission system with multi-company and multi-establishment support.

## Recent Changes

**November 7, 2025 - Insumos Section Data Flow Fixes**
- Fixed empty "Historial de Movimientos" table by parsing `pd_detalles` JSON field in `useInsumosData` hook
- Updated `InsumoData` interface to include all 11+ missing properties from API response (clase, tipo, subtipo names, unidades, contenido, stock)
- Added robust JSON parsing with error handling for malformed database data
- Fixed `filtrosAvanzados` state to include `tipoInsumo` and `subtipoInsumo` properties
- Resolved all TypeScript LSP errors (41 → 0) in Insumos section
- Implemented helper function `parsePdDetalles` with try/catch for safe JSON parsing

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Core Technologies**
- Next.js 14 with App Router and React Server Components
- TypeScript for type safety
- Tailwind CSS with shadcn/ui component library
- Client-side rendering with authentication checks on protected routes

**State Management Pattern**
- React Context API for global state (user, establishment selection, navigation)
- Three primary contexts:
  - `UserContext`: Manages authenticated user data and profile
  - `EstablishmentContext`: Handles company/establishment selection and switching
  - `ConfigNavigationContext`: Controls multi-level navigation in configuration section
- Local storage for session persistence (tokens and user data)

**Component Architecture**
- Shared UI components from shadcn/ui in `/components/ui`
- Feature-specific components organized by section in `/components/sections`
- Custom components for date/time pickers and comboboxes to override default behavior
- Permission wrapper component for role-based UI rendering
- Reusable layout components (AppLayout, Sidebar)

**Routing Structure**
- Public routes: `/login`, `/register`
- Protected routes: `/registros`, `/movimientos`, `/actividades`, `/clima`, `/insumos`, `/reportes`, `/configuracion`
- Root page (`/`) redirects based on authentication status
- Middleware adds security headers and logging

### Backend Architecture

**API Layer**
- Next.js API routes in `/app/api` directory
- Server-side data fetching and mutations
- RESTful endpoint pattern with query parameters for filtering

**Authentication Flow**
- Supabase Auth for user authentication
- Token-based session management stored in localStorage
- Server actions for login/register operations
- Middleware protection on sensitive routes
- User profile data fetched and cached in context after authentication

**Data Fetching Strategy**
- Custom hooks for data fetching (e.g., `useClimaData`, `useInsumosData`, `usePluviometriaData`)
- Establishment-scoped queries (data filtered by selected establishment)
- Client-side caching in React state
- Automatic refetching on establishment change

### Data Storage

**Database**
- Supabase PostgreSQL database
- Neon Database integration (@neondatabase/serverless)
- Schema includes:
  - Multi-tenant structure (empresas → establecimientos)
  - User management with roles and privileges
  - Parte diario (daily reports) system
  - Livestock movements, activities, weather, supplies tracking
  - Potreros (paddocks), lotes (lots), and insumos (supplies)

**Data Models**
- Type definitions in `/lib/types.ts` and `/types.tsx`
- Key entities:
  - Empresa (Company) → Establecimiento (Establishment) hierarchy
  - Usuario (User) with role-based permissions
  - ParteDiario (Daily Report) as central record type
  - Movimiento (Movement), Actividad (Activity), Clima (Weather), Insumo (Supply)
  - Potrero (Paddock), Lote (Lot), Maquinaria (Machinery)

**Permission System**
- Role hierarchy: Operativo (1) → Gerente (2) → Consultor (3) → Administrador (4)
- 20+ granular privileges for different features
- Privilege-based access control defined in `/lib/permissions.ts`
- User roles and privileges stored per establishment
- Custom hook (`usePermissions`) for checking permissions throughout app

### External Dependencies

**Supabase Integration**
- Authentication service (email/password)
- PostgreSQL database backend
- Environment variables required:
  - `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Two client patterns:
  - Server client (`/lib/supabase-server.ts`) for API routes
  - Browser client (`/lib/supabase-client.ts`) for client components

**UI Component Libraries**
- shadcn/ui built on Radix UI primitives
- Radix UI for accessible components (dialogs, dropdowns, etc.)
- Tailwind CSS for styling with custom design system
- Lucide React for icons

**Build & Deployment**
- Vercel for hosting and deployment
- Auto-sync with v0.dev for design iterations
- Custom Next.js configuration for port 5000
- Development and production build scripts

**Excel Export**
- ExcelJS library for generating reports and exports
- Used in reportes section for data export functionality

**Date Handling**
- date-fns library for date manipulation and formatting
- Custom date/time picker components for consistent UX

**Development Tools**
- TypeScript with strict mode enabled
- ESLint for code quality
- React Hook Form with Zod resolvers for form validation
- Custom hooks pattern for reusable logic

**Configuration Management**
- Environment-based configuration in `/lib/env.ts`
- Fallback handling for missing environment variables
- Development vs production mode detection