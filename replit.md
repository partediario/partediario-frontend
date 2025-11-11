# Parte Diario PRO - Sistema de Gestión Ganadera

## Overview

Parte Diario PRO is a comprehensive livestock management system built with Next.js 14, React, and TypeScript. The application enables ranchers and agricultural managers to track daily operations, manage multiple establishments, monitor livestock movements, weather data, supplies, and activities across cattle ranching operations. The system features a role-based permission system with multi-company and multi-establishment support.

## Recent Changes

**November 11, 2025 - Registros Mobile Layout Improvements**
- Enhanced mobile UX in Registros section with strategic component reorganization
- **Floating "Agregar Parte Diario" Button:**
  - Moved AddParteDiarioDrawer state management to InformesView for centralized control
  - Created mobile-only floating action button (fixed top-4 right-4, md:hidden) aligned with hamburger menu
  - Desktop button remains in DashboardHeader (hidden md:flex) to avoid duplication
  - Both buttons trigger same drawer via shared state
- **KPIs Mobile Grid (2x2 Layout):**
  - Changed from grid-cols-1 to grid-cols-2 on mobile (<md breakpoint)
  - Reduced padding from p-6 to p-3 on mobile (md:p-6 on larger screens)
  - Decreased text size from text-2xl to text-lg on mobile (md:text-2xl)
  - Reduced gap from gap-4 to gap-3 on mobile (md:gap-4)
  - Layout: Nacimientos + Compra (top row), Venta + Lluvia Total (bottom row)
- **Refresh Button Repositioning:**
  - Moved refresh button from SearchAndFilters to DashboardHeader
  - Now positioned next to date selector for better mobile accessibility
  - Updated SearchAndFiltersProps interface to remove onRefresh and isLoading
  - Refresh dispatches reloadPartesDiarios event from InformesView
- **TypeScript & Architecture:**
  - Cleaned up DashboardHeader: removed unused user context, drawer state, and isConsultor logic
  - Extended DashboardHeaderProps with onRefresh prop
  - Updated imports to remove unused AddParteDiarioDrawer and useUser
  - 0 LSP errors after refactor

**November 11, 2025 - Mobile-Responsive Design Implementation**
- Implemented comprehensive mobile-first responsive design across the application
- **Mobile Sidebar Navigation:**
  - Created `useMobileSidebar` hook for controlling sidebar state in mobile devices
  - Added hamburger menu button (visible only on <768px screens)
  - Sidebar renders as Sheet drawer on mobile, fixed panel on desktop (≥768px)
  - Main content area uses responsive margin (`md:ml-64`) and padding (`pt-16 md:pt-0`)
  - Company/establishment selector dialog made responsive with stacked buttons on mobile
- **Registros Section Responsive:**
  - ParteDiarioCard: flex-wrap layout, responsive padding (p-3 sm:p-4), responsive text sizes (text-xs sm:text-sm)
  - RegistrosList: responsive padding throughout (px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-4)
  - SearchAndFilters: already had responsive grid layout, corrected TypeScript interfaces
- **TypeScript Improvements:**
  - Fixed SearchAndFiltersProps interface in types.tsx (added selectedDate, onDateChange, selectedType, onTypeChange, onRefresh, isLoading)
  - Enhanced ParteDiario interface in lib/types.ts (added pd_detalles with flexible structure)
  - Resolved all LSP errors (38 → 0)
- **Responsive Component Infrastructure:**
  - Created ResponsiveDrawer wrapper component for consistent mobile drawer behavior
  - Breakpoint strategy: base (<640px), sm (≥640px), md (≥768px), lg (≥1024px)
  - Mobile-first approach with progressive enhancement for larger screens

**November 10, 2025 - Authentication & Environment Variable Fixes**
- Fixed login authentication to use correct environment variables (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)
- Added HTTPS Agent configuration to handle self-signed SSL certificates in development environment
- Fixed server not reloading environment variables by requiring workflow restart after changes
- Verified login flow uses https://supabase.partediario.com endpoint correctly
- Fixed Next.js 15 async params error in /api/empresas/[id] route (params now properly awaited)
- Improved login error handling with detailed logging (URL, status, headers, response text)
- Fixed supabaseServer null check errors in app/login/actions.ts
- Resolved all TypeScript LSP errors (0 errors)

**November 7, 2025 - Branding & Deployment Updates**
- Updated favicon to high-resolution "PDP" branded icon (PNG format at 32x32, 192x192, 512x512 sizes)
- Configured multi-size favicon support for better display across devices and browsers
- Fixed deployment configuration for Replit autoscale deployment (port 5000, binding to 0.0.0.0)
- Verified all environment secrets for production deployment

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