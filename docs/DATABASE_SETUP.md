# Database Setup Guide

Currently, the **Cyber Defense Console** runs with structured client-side initial data (`src/data/socData.ts`) and reactive React state. To persist incidents, analyst notes, host isolation states, SIEM telemetry logs, and threat IOCs across sessions and users, choose one of the two recommended database setups below.

---

## Option 1: PostgreSQL (Cloud SQL / Supabase / Local Postgres) — Recommended for SIEM & SecOps

PostgreSQL fits relational SecOps data (incidents linked to timelines, process trees, and assets) and high-volume telemetry queries.

### 1. Provision a PostgreSQL Instance
- **Local Development**: Install PostgreSQL 16+ or run via Docker:
  ```bash
  docker run --name cyber-console-db \
    -e POSTGRES_USER=secops \
    -e POSTGRES_PASSWORD=your_secure_password \
    -e POSTGRES_DB=cyber_defense \
    -p 5432:5432 -d postgres:16
  ```
- **Managed Cloud**: Create a PostgreSQL instance in Google Cloud SQL, Supabase, or Neon and copy the connection string.

### 2. Configure Environment Variables
Add your database connection string to `.env` (never commit `.env` to GitHub):

```env
DATABASE_URL="postgresql://secops:your_secure_password@localhost:5432/cyber_defense"
```

### 3. Recommended Core Tables
Map the domain types in `src/types/soc.ts` to five primary tables:

| Table | Purpose | Key Columns |
| --- | --- | --- |
| `incidents` | Active & resolved security incidents | `id`, `title`, `severity`, `status`, `host`, `host_ip`, `assignee`, `host_isolated`, `token_revoked`, `created_at` |
| `incident_notes` | Timestamped analyst investigation notes | `id`, `incident_id` (FK), `author`, `content`, `created_at` |
| `telemetry_events` | SIEM / EDR / Firewall / DNS log stream | `id`, `timestamp`, `severity`, `source`, `host`, `src_ip`, `dst_ip`, `port`, `protocol`, `action`, `mitre_id`, `raw_payload` (JSONB) |
| `assets` | Managed endpoint & K8s fleet inventory | `id`, `hostname`, `ipv4`, `os`, `os_family`, `status`, `cpu_pct`, `mem_pct`, `open_cves` (JSONB), `last_heartbeat` |
| `threat_iocs` | Blocked & monitored threat indicators | `id`, `type`, `value`, `threat_actor`, `confidence`, `tlp`, `blocked`, `first_seen` |

### 4. Backend API Wiring
Because database credentials must remain server-side:
1. Run an Express backend (`server.ts`) alongside Vite (`"dev": "tsx server.ts"`).
2. Connect using `pg` or Drizzle ORM (`drizzle-orm/node-postgres`) with `process.env.DATABASE_URL`.
3. Expose `/api/incidents`, `/api/telemetry`, `/api/assets`, and `/api/iocs` endpoints and fetch them from the React UI instead of `INITIAL_*` constants.

---

## Option 2: Firebase Firestore (Real-Time NoSQL & Auth)

If you want real-time multi-analyst synchronization without managing a SQL server:

1. Create a Firebase project and enable **Firestore Database** and **Firebase Authentication**.
2. Create top-level collections matching the console entities:
   - `incidents` (with subcollections or arrays for `timeline`, `artifacts`, and `notes`)
   - `telemetry_events`
   - `assets`
   - `threat_iocs`
   - `detection_rules`
3. Configure `firestore.rules` so only authenticated SOC analysts (`request.auth != null`) can read/write incident containment states (`hostIsolated`, `tokenRevoked`, `status`) and append investigation notes.
4. Use Firestore `onSnapshot` listeners in `src/App.tsx` so host isolation and live SIEM alerts update across all open analyst consoles in real time.

---

## Security Checklist
- Keep `DATABASE_URL` and service account credentials strictly on the backend (`.env`), never inside `VITE_*` client variables.
- Parameterize all SQL queries when filtering KQL/SIEM searches to prevent SQL injection.
- Restrict database network access via SSL (`?sslmode=require`) and IP allowlists in production.
