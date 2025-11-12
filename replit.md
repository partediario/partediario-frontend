# Parte Diario PRO - Sistema de Gestión Ganadera

## Overview

Parte Diario PRO is a comprehensive livestock management system built with Next.js 14, React, and TypeScript. The application enables ranchers and agricultural managers to track daily operations, manage multiple establishments, monitor livestock movements, weather data, supplies, and activities across cattle ranching operations. The system features a role-based permission system with multi-company and multi-establishment support. Its purpose is to streamline agricultural management, enhance decision-making, and improve operational efficiency for ranching businesses.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

The frontend is built with Next.js 14, leveraging App Router and React Server Components, and TypeScript for type safety. Tailwind CSS with the shadcn/ui component library is used for styling. State management relies on React Context API for global states (user, establishment selection, navigation) and local storage for session persistence. The component architecture utilizes shared shadcn/ui components, feature-specific components organized by section, and custom components for enhanced functionality. Routing includes public, protected, and root pages with middleware for security.

### Backend

The backend utilizes Next.js API routes for server-side data fetching and mutations, following a RESTful endpoint pattern. Authentication is handled by Supabase Auth with token-based session management and server actions for login/register. Data fetching uses custom hooks with establishment-scoped queries and client-side caching.

### Data Storage

The application uses a Supabase PostgreSQL database, integrated with Neon Database, featuring a multi-tenant structure (empresas → establecimientos). The schema supports user management with role-based privileges, a daily reports system, and tracking for livestock movements, activities, weather, and supplies. Key entities include Empresa, Establecimiento, Usuario, ParteDiario, Movimiento, Actividad, Clima, Insumo, Potrero, Lote, and Maquinaria. A robust role-based permission system with granular privileges is implemented using a custom hook (`usePermissions`).

### UI/UX Decisions

The design prioritizes a mobile-first, responsive approach, ensuring optimal display across various devices. All 74 drawers are fully responsive, appearing as full-screen sheets on mobile and lateral panels on desktop (default: 850px, narrow: 384px). Configuration drawers use responsive padding (p-4 md:p-6), titles (text-lg md:text-xl), and spacing (space-y-4 md:space-y-6). The sidebar features white close button for dark background and vertical scrolling.

**Mobile Viewport Optimization**: The viewport uses `initialScale: 0.90` to provide a slightly zoomed-out view (~10% reduction) on mobile devices, allowing users to see more data at once while maintaining WCAG-compliant text sizes. Users can zoom up to 2x manually. This approach maximizes data visibility without sacrificing legibility in field conditions.

**Responsive Tables - Densified Mobile View**: Data-heavy tables in Movimientos and Clima sections are optimized for mobile with:
- **Pluviometría calendar** (31-day grid): min-w reduced from 1200px to 1000px, sticky MES/TOTAL columns, text-xs (12px) for badges (~11px effective with viewport scale), mobile-only summary grid, compact row heights (h-9)
- **Stock Actual tables**: min-w reduced from 600px to 480px, text-xs sm:text-sm responsive typography, abbreviated headers ("Peso Prom" vs "Peso Promedio"), compact paddings (px-2 sm:px-4), responsive toggle buttons showing icons-only on mobile
- **Column optimization**: Reduced min-widths across all data tables (e.g., 140px→100px, 100px→70px) to fit more columns in viewport while maintaining ~11px minimum effective text size

**Chart Optimizations**: Charts are optimized to prevent label clipping on mobile:
- **Carga por Potrero**: Height increased to 450px, bottom margin 90px, interval=0 to show all potrero labels, fontSize 11px
- **Distribución de Lluvias**: Height increased to 500px, month labels abbreviated to 3 letters (Ene, Feb, etc.), extra 30px spacing for rotated labels

**Configuración Section - Mobile Sub-Sidebars** (November 2025):
- **ConfigNavigationContext** extended with mobile state: `isSubSidebarOpen`, `toggleSubSidebar()`, `setSubSidebarOpen()`
- **ConfigSubSidebarLayout** component: Reusable wrapper for all 3 configuration sub-sidebars (Empresas, Empresa Config, Establecimiento Config)
  - Mobile (<md): Renders as Sheet overlay with side="left", controlled by context state
  - Desktop (≥md): Renders as fixed sidebar with w-64
- **NuevaConfiguracionView**: Hamburger menu button (Menu icon) visible on mobile when sub-sidebar active, margin-left (ml-64) only applies on desktop (md:ml-64)
- Sub-sidebars remain closed by default on mobile, users tap hamburger to open Sheet overlay

**Insumos Section - Mobile Filter Optimization** (November 2025):
- **GestionInsumoEspecifico** header/filter section: Stacks vertically on mobile (`flex-col`), horizontal on desktop (`md:flex-row`)
- Filter widths: `w-full` on mobile, `md:min-w-[Npx]` on desktop for Clase selector (220px), Insumo selector (280px), Period filter (280px)
- Responsive gaps: `gap-2` on mobile, `md:gap-4` on desktop
- Stock summary and movement history tables already had proper responsive patterns (grid-cols-1/2/5, overflow-x-auto)

Key UI elements like cards and data grids adapt fluidly using Tailwind breakpoints. Branding includes a high-resolution "PDP" favicon.

## External Dependencies

- **Supabase:** Authentication and PostgreSQL database services.
- **Neon Database:** Serverless PostgreSQL integration.
- **shadcn/ui & Radix UI:** UI component libraries for accessible and styled components.
- **Tailwind CSS:** Utility-first CSS framework for styling.
- **Lucide React:** Icon library.
- **Vercel:** Hosting and deployment platform.
- **ExcelJS:** Library for generating Excel reports.
- **date-fns:** Library for date manipulation and formatting.
- **React Hook Form & Zod:** For form validation.