# EcoSort — Intelligent Waste Segregation Admin Portal

EcoSort is a municipal Smart City Waste Management Control Center. This repository contains the **Admin Web Portal** plus the shared REST backend required by the future Raspberry Pi, Customer App, and Driver App.

The portal is intentionally operations-first: the admin activates a **daily driver → van → ward** assignment once in the morning, then sensor-triggered pickup requests route to that active ward fleet automatically. Admins do not manually assign individual household collections under normal conditions.

## Architecture

```text
Smart Bin / Raspberry Pi
  └─ POST sensor readings
       └─ Express API + pickup automation service
            ├─ PostgreSQL via Prisma
            ├─ Socket.IO events
            ├─ Driver App APIs
            ├─ Customer App APIs
            └─ React Admin Portal
```

## Stack

- Client: React, TypeScript, Vite, Tailwind CSS, React Router, Axios, Recharts, Lucide
- Server: Node.js, Express, TypeScript, Prisma, Socket.IO, Zod
- Database: PostgreSQL
- Authentication: JWT + bcrypt

## Administrator login

Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and optionally `ADMIN_NAME` in `server/.env` before running the seed. The seed provisions only that administrator and creates no operational fixture data.

## Setup

Prerequisites: Node.js 20+ and PostgreSQL 15+.

1. Create a PostgreSQL database named `ecosort`.
2. Copy [.env.example](./.env.example) to `server/.env` and update `DATABASE_URL` and `JWT_SECRET`.
3. Install dependencies and set up the database:

```powershell
cd server
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run seed
```

4. Start the API in one terminal:

```powershell
cd server
npm run dev
```

5. Start the portal in another terminal:

```powershell
cd client
npm install
npm run dev
```

Open `http://localhost:5173`.

## Database and seed data

The Prisma schema models the full operational domain:

- Admin, Driver, Van, DailyFleetAssignment
- Household, Bin, BinCompartment, SensorReading
- PickupRequest, PickupNotification, WasteCollection
- Complaint, Feedback, Notification, EcoPointTransaction

The seed provisions only the administrator account. Households, bins, fleet assignments, readings, pickups, complaints, feedback, and notifications remain empty until created through the application APIs.

Useful Prisma commands:

```powershell
npm run prisma:generate
npm run prisma:migrate -- --name change_description
npm run seed
npm exec prisma studio
```

## Core pickup automation

`POST /api/bins/:binId/readings` is the Raspberry Pi ingestion endpoint.

```json
{
  "dry": 92,
  "wet": 45,
  "metal": 61,
  "ewaste": 32,
  "timestamp": "2026-08-11T10:30:00Z"
}
```

The backend validates and records all four values, updates the current compartment state, then runs this logic for every compartment at or above 90%:

1. Finds an existing active pickup for the same **household + waste type**.
2. If one exists, updates fill percentage and priority only—no duplicate is created.
3. If none exists, finds today’s active **ward** fleet assignment.
4. Creates an `ASSIGNED` pickup plus a driver notification when a fleet exists; otherwise creates an `UNASSIGNED` pickup and a `FLEET_ATTENTION` notification.
5. Emits Socket.IO `bin:reading` and `dashboard:update` events.

The application keeps three independent thresholds:

| Threshold | Purpose |
| --- | --- |
| 80% | Edge AI classification confidence; never creates a pickup. |
| 90% | Household pickup request creation. |
| 85% | Municipal suggested-route planning. |

Pickup priority is based on fill only: `90–94 = NORMAL`, `95–99 = HIGH`, `100 = CRITICAL`.

## Morning fleet workflow

1. An admin opens **Today’s Fleet Assignment**.
2. They select an available driver, an available van, and a ward.
3. `POST /api/fleet/assignments` activates that date-specific assignment.
4. Database uniqueness constraints prevent one driver or van from receiving a second assignment on the same date.
5. Incoming bin alerts for the ward route to that driver and van automatically.
6. `PATCH /api/fleet/assignments/:id/end` retains the historical record and returns its driver/van to availability.

## API overview

All Admin Portal endpoints except authentication require `Authorization: Bearer <jwt>`.

| Area | Endpoint examples |
| --- | --- |
| Admin auth | `POST /api/auth/login`, `GET /api/auth/me` |
| Dashboard | `GET /api/admin/dashboard`, `GET /api/analytics` |
| Bins and Raspberry Pi | `GET /api/bins`, `GET /api/bins/:binId`, `POST /api/bins/:binId/readings` |
| Fleet | `GET /api/fleet`, `POST /api/fleet/assignments`, `PATCH /api/fleet/assignments/:id/end` |
| Pickups | `GET /api/pickups`, `PATCH /api/pickups/:id`, `PATCH /api/pickups/:id/complete` |
| Admin resources | `GET /api/drivers`, `/api/vans`, `/api/households`, `/api/complaints`, `/api/feedback`, `/api/notifications` |
| Driver App | `POST /api/driver/login`, `GET /api/driver/:employeeId/today`, `/assignments`, `/pickups`, `/route` |
| Customer App | `GET /api/customer/:houseNumber/bin`, `/fill-levels`, `/pickups`, `/rewards`; `POST /complaints`, `/feedback` |

The prototype exposes Raspberry Pi and Driver App service endpoints without a device/API-key middleware. Add service credentials or scoped JWT validation before a production deployment.

## Reports and exports

The Admin Portal includes report cards for waste collection, pickup, driver, ward, complaint, and environmental impact. The interface provides CSV export affordances; connect these to a server-side CSV/PDF generation package if PDFs are required for the final deployment.

## Validation

The project includes a deterministic threshold check:

```powershell
cd server
npm run test:logic
```

It verifies normal, high, and critical pickup priorities plus normal/monitor/pickup-required bin status bands. Run `npm run build` in both `client` and `server` before release.

## Security notes

- Never commit `.env` or production secrets.
- Replace the example JWT secret.
- Require a service credential on sensor ingestion in production.
- Add scoped Driver and Customer JWT middleware when their mobile apps are connected.
- Enable a restrictive production CORS origin list and TLS at deployment.
