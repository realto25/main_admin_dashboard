This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev update
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
"# Realestate_project" 

```
Realestate_project-main
├─ app
│  ├─ api
│  │  ├─ plots
│  │  │  ├─ route.ts
│  │  │  └─ [id]
│  │  │     └─ route.ts
│  │  ├─ projects
│  │  │  └─ route.ts
│  │  ├─ upload
│  │  └─ uploadthing
│  ├─ favicon.ico
│  ├─ globals.css
│  ├─ layout.tsx
│  ├─ login
│  │  └─ page.tsx
│  ├─ page.tsx
│  ├─ plots
│  │  ├─ AddPlotForm.tsx
│  │  ├─ AddProjectForm.tsx
│  │  ├─ EditPlotForm.tsx
│  │  ├─ page.tsx
│  │  ├─ PlotList.tsx
│  │  └─ [id]
│  │     ├─ page.tsx
│  │     └─ ProjectDetailClient.tsx
│  └─ _components
│     └─ SideBar.tsx
├─ components
│  ├─ app-sidebar.tsx
│  ├─ nav-main.tsx
│  ├─ nav-projects.tsx
│  ├─ nav-user.tsx
│  ├─ team-switcher.tsx
│  └─ ui
│     ├─ avatar.tsx
│     ├─ badge.tsx
│     ├─ breadcrumb.tsx
│     ├─ button.tsx
│     ├─ card.tsx
│     ├─ collapsible.tsx
│     ├─ dialog.tsx
│     ├─ dropdown-menu.tsx
│     ├─ form.tsx
│     ├─ input.tsx
│     ├─ label.tsx
│     ├─ select.tsx
│     ├─ separator.tsx
│     ├─ sheet.tsx
│     ├─ sidebar.tsx
│     ├─ skeleton.tsx
│     ├─ sonner.tsx
│     └─ tooltip.tsx
├─ components.json
├─ hooks
│  └─ use-mobile.ts
├─ lib
│  ├─ auth.ts
│  ├─ collections
│  ├─ prisma.ts
│  ├─ types.ts
│  └─ utils.ts
├─ next.config.ts
├─ package-lock.json
├─ package.json
├─ postcss.config.mjs
├─ prisma
│  ├─ migrations
│  │  ├─ 20250524182734_init
│  │  │  └─ migration.sql
│  │  ├─ 20250525033928_add_map_embed_url
│  │  │  └─ migration.sql
│  │  └─ migration_lock.toml
│  └─ schema.prisma
├─ public
│  ├─ globe.svg
│  ├─ logo.svg
│  ├─ next.svg
│  ├─ vercel.svg
│  └─ window.svg
├─ README.md
└─ tsconfig.json

```"# admin_main_dashboard" 
"# main_admin_dashboard" 
"# main_admin_dashboard" 

```
Realestate_project-main
├─ app
│  ├─ api
│  │  ├─ auth
│  │  │  └─ [...nextauth]
│  │  ├─ cameras
│  │  │  ├─ route.ts
│  │  │  └─ [id]
│  │  │     └─ route.ts
│  │  ├─ clients
│  │  │  ├─ route.ts
│  │  │  └─ [id]
│  │  │     └─ route.ts
│  │  ├─ feedback
│  │  │  └─ route.ts
│  │  ├─ messages
│  │  │  └─ route.ts
│  │  ├─ notifications
│  │  │  └─ route.ts
│  │  ├─ plots
│  │  │  ├─ route.ts
│  │  │  └─ [id]
│  │  │     ├─ assign
│  │  │     │  └─ route.ts
│  │  │     └─ route.ts
│  │  ├─ projects
│  │  │  └─ route.ts
│  │  ├─ upload
│  │  ├─ uploadthing
│  │  └─ visit-requests
│  │     ├─ route.ts
│  │     └─ [id]
│  │        ├─ approve
│  │        │  └─ route.ts
│  │        └─ reject
│  │           └─ route.ts
│  ├─ dashboard
│  │  ├─ cameras
│  │  │  └─ page.tsx
│  │  ├─ clients
│  │  │  └─ page.tsx
│  │  └─ layout.tsx
│  ├─ favicon.ico
│  ├─ feedback
│  │  ├─ columns.tsx
│  │  └─ page.tsx
│  ├─ globals.css
│  ├─ layout.tsx
│  ├─ page.tsx
│  ├─ plots
│  │  ├─ AddPlotForm.tsx
│  │  ├─ AddProjectForm.tsx
│  │  ├─ EditPlotForm.tsx
│  │  ├─ page.tsx
│  │  ├─ PlotList.tsx
│  │  └─ [id]
│  │     ├─ page.tsx
│  │     └─ ProjectDetailClient.tsx
│  ├─ visit-requests
│  │  └─ page.tsx
│  └─ _components
│     └─ SideBar.tsx
├─ components
│  ├─ app-sidebar.tsx
│  ├─ AssignCameraDialog.tsx
│  ├─ AssignPlotDialog.tsx
│  ├─ CameraList.tsx
│  ├─ nav-main.tsx
│  ├─ nav-projects.tsx
│  ├─ nav-user.tsx
│  ├─ NotificationBell.tsx
│  ├─ team-switcher.tsx
│  └─ ui
│     ├─ avatar.tsx
│     ├─ badge.tsx
│     ├─ breadcrumb.tsx
│     ├─ button.tsx
│     ├─ card.tsx
│     ├─ collapsible.tsx
│     ├─ data-table.tsx
│     ├─ dialog.tsx
│     ├─ dropdown-menu.tsx
│     ├─ form.tsx
│     ├─ input.tsx
│     ├─ label.tsx
│     ├─ select.tsx
│     ├─ separator.tsx
│     ├─ sheet.tsx
│     ├─ sidebar.tsx
│     ├─ skeleton.tsx
│     ├─ sonner.tsx
│     ├─ table.tsx
│     └─ tooltip.tsx
├─ components.json
├─ hooks
│  └─ use-mobile.ts
├─ lib
│  ├─ collections
│  ├─ notifications.ts
│  ├─ prisma.ts
│  ├─ types.ts
│  └─ utils.ts
├─ next.config.ts
├─ package-lock.json
├─ package.json
├─ postcss.config.mjs
├─ prisma
│  ├─ migrations
│  │  ├─ 20250524182734_init
│  │  │  └─ migration.sql
│  │  ├─ 20250525033928_add_map_embed_url
│  │  │  └─ migration.sql
│  │  ├─ 20250525135734_add_plot_description
│  │  │  └─ migration.sql
│  │  ├─ 20250525145302_add_visit_requests
│  │  │  └─ migration.sql
│  │  ├─ 20250526051311_add_feedback_table
│  │  │  └─ migration.sql
│  │  ├─ 20250529180020_add_client_functionality
│  │  │  └─ migration.sql
│  │  └─ migration_lock.toml
│  └─ schema.prisma
├─ public
│  ├─ globe.svg
│  ├─ logo.svg
│  ├─ next.svg
│  ├─ vercel.svg
│  └─ window.svg
├─ README.md
└─ tsconfig.json

```
```
main_admin_dashboard
├─ app
│  ├─ api
│  │  ├─ all-users
│  │  │  └─ route.ts
│  │  ├─ cameras
│  │  │  ├─ route.ts
│  │  │  └─ [id]
│  │  │     └─ route.ts
│  │  ├─ clients
│  │  │  └─ [id]
│  │  │     └─ route.ts
│  │  ├─ feedback
│  │  │  └─ route.ts
│  │  ├─ lands
│  │  │  ├─ route.ts
│  │  │  └─ [plotId]
│  │  │     └─ route.ts
│  │  ├─ messages
│  │  │  └─ route.ts
│  │  ├─ plots
│  │  │  ├─ route.ts
│  │  │  └─ [id]
│  │  │     ├─ assign
│  │  │     │  └─ route.ts
│  │  │     └─ route.ts
│  │  ├─ projects
│  │  │  └─ route.ts
│  │  ├─ sell-requests
│  │  │  ├─ route.ts
│  │  │  └─ [id]
│  │  │     └─ route.ts
│  │  ├─ users
│  │  │  ├─ create
│  │  │  │  └─ route.ts
│  │  │  ├─ profile
│  │  │  │  └─ route.ts
│  │  │  ├─ route.ts
│  │  │  ├─ [id]
│  │  │  │  └─ route.ts
│  │  │  └─ [userId]
│  │  ├─ visit-requests
│  │  │  ├─ route.ts
│  │  │  └─ [id]
│  │  │     ├─ approve
│  │  │     │  └─ route.ts
│  │  │     └─ reject
│  │  │        └─ route.ts
│  │  └─ webhooks
│  │     └─ clerk
│  │        └─ route.ts
│  ├─ cameras
│  │  └─ page.tsx
│  ├─ clients
│  │  ├─ AddClientForm.tsx
│  │  ├─ ClientTable.tsx
│  │  └─ page.tsx
│  ├─ favicon.ico
│  ├─ feedback
│  │  ├─ columns.tsx
│  │  └─ page.tsx
│  ├─ globals.css
│  ├─ land-layout
│  │  └─ page.tsx
│  ├─ layout.tsx
│  ├─ managers
│  ├─ page.tsx
│  ├─ plots
│  │  ├─ AddPlotForm.tsx
│  │  ├─ AddProjectForm.tsx
│  │  ├─ EditPlotForm.tsx
│  │  ├─ layouts
│  │  ├─ page.tsx
│  │  ├─ PlotList.tsx
│  │  └─ [id]
│  │     ├─ page.tsx
│  │     └─ ProjectDetailClient.tsx
│  ├─ sell-requests
│  │  └─ page.tsx
│  ├─ users
│  │  ├─ clients
│  │  │  └─ page.tsx
│  │  ├─ create
│  │  │  └─ page.tsx
│  │  ├─ managers
│  │  │  └─ page.tsx
│  │  └─ page.tsx
│  ├─ visit-requests
│  │  └─ page.tsx
│  └─ _components
│     └─ SideBar.tsx
├─ bash.exe.stackdump
├─ components
│  ├─ app-sidebar.tsx
│  ├─ AssignCameraDialog.tsx
│  ├─ AssignPlotDialog.tsx
│  ├─ CameraList.tsx
│  ├─ ClientDetails.tsx
│  ├─ ClientPlotList.tsx
│  ├─ EditCameraDialog.tsx
│  ├─ LandLayoutEditor.tsx
│  ├─ nav-main.tsx
│  ├─ nav-projects.tsx
│  ├─ nav-user.tsx
│  ├─ NotificationBell.tsx
│  ├─ SellRequestActions.tsx
│  ├─ SellRequestTable.tsx
│  ├─ Sidebar.tsx
│  ├─ team-switcher.tsx
│  └─ ui
│     ├─ alert-dialog.tsx
│     ├─ alert.tsx
│     ├─ avatar.tsx
│     ├─ badge.tsx
│     ├─ breadcrumb.tsx
│     ├─ button.tsx
│     ├─ card.tsx
│     ├─ collapsible.tsx
│     ├─ data-table.tsx
│     ├─ dialog.tsx
│     ├─ dropdown-menu.tsx
│     ├─ form.tsx
│     ├─ input.tsx
│     ├─ label.tsx
│     ├─ select.tsx
│     ├─ separator.tsx
│     ├─ sheet.tsx
│     ├─ sidebar.tsx
│     ├─ skeleton.tsx
│     ├─ sonner.tsx
│     ├─ table.tsx
│     ├─ tabs.tsx
│     ├─ textarea.tsx
│     └─ tooltip.tsx
├─ components.json
├─ hooks
│  └─ use-mobile.ts
├─ lib
│  ├─ api.ts
│  ├─ clerk.ts
│  ├─ prisma.ts
│  ├─ types.ts
│  └─ utils.ts
├─ next.config.ts
├─ package-lock.json
├─ package.json
├─ postcss.config.mjs
├─ prisma
│  └─ schema.prisma
├─ public
│  ├─ globe.svg
│  ├─ logo.svg
│  ├─ next.svg
│  ├─ vercel.svg
│  └─ window.svg
├─ README.md
└─ tsconfig.json

```