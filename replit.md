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

The design prioritizes a mobile-first, responsive approach, ensuring optimal display across various devices. Drawers are consistently responsive, appearing as full-screen sheets on mobile and lateral panels on desktop. Key UI elements like the sidebar, cards, and data grids are designed to adapt fluidly to different screen sizes, using breakpoints for progressive enhancement. Branding includes a high-resolution "PDP" favicon.

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