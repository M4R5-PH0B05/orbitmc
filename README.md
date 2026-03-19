# orbitmc — Minecraft Server Manager

A self-hosted web panel for managing Minecraft servers, built with React + Express and deployable via Docker.

## Features

- **Server Management** — Create and manage Java, Vanilla, Paper, Forge, Fabric, Spigot, Purpur servers
- **Start / Stop / Restart** — Power controls with real-time status updates
- **Live Console** — Real-time server output via WebSockets, with command input
- **File Manager** — Browse, create, edit, save, and download server files (server.properties, ops.json, plugins, etc.)
- **Modpack Manager** — Create modpack profiles, track mod lists (Forge, Fabric, NeoForge, Quilt)
- **User Accounts** — Invite friends with role-based access (Admin, Operator, Viewer)
- **Dark theme** — Clean, dark UI purpose-built for server management

## Quick Start with Docker

```bash
# Clone or extract the project
cd craftpanel

# Start with Docker Compose
docker compose up -d

# Panel is now available at http://your-server-ip:8080
# On first launch, create the initial admin account in the web UI
```

## Docker Compose

```bash
# Start
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down

# Rebuild after updates
docker compose up -d --build
```

## Manual / Development Setup

```bash
npm install
npm run dev
# Runs on http://localhost:5000
```

## Build for Production

```bash
npm run build
NODE_ENV=production node dist/index.cjs
```

## Roles

| Role | Permissions |
|------|------------|
| **Admin** | Full control — manage users, servers, modpacks, files |
| **Operator** | Start/stop servers, view console, edit files, manage modpacks |
| **Viewer** | View-only access to panel |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | HTTP port to listen on |
| `SESSION_SECRET` | `craftpanel-secret-...` | Secret for session encryption — change in production! |
| `DATABASE_URL` | unset | PostgreSQL connection string used for persistent panel state |
| `NODE_ENV` | `development` | Set to `production` for production builds |

## Connecting Real Minecraft Servers

CraftPanel currently manages server metadata and files in its own database. To connect real Minecraft Docker containers, add them to `docker-compose.yml` and configure the panel to control them via Docker API (advanced setup — see docker-compose.yml comments).

## Notes

- **Bootstrap**: OrbitMC now uses a first-run initialization flow instead of shipping a permanent default admin account.
- **Persistence**: Configure `DATABASE_URL` to keep users, servers, and panel state across restarts.
- **2FA**: TOTP-based two-factor authentication can be enabled per account from the Users page.
- **File Management**: The file manager in this version uses a virtual filesystem stored in the panel database. For production use with real Minecraft server files, mount the server directory and extend the file API routes to use the local filesystem.
