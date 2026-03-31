# Shooting App Implementation Plan (Security + Waitlist + Quality)

## Goal
Ship organization-safe RBAC and waitlist support without regressions, with a clear rollout and verification path.

## Phase 1 — Authorization & Tenant Safety (Done in code)
1. Centralize session/user resolution in a single helper (`getRequestContext`).
2. Enforce admin-only protection for admin APIs.
3. Scope every admin lookup/write by `organizationId`.
4. Ensure user resolution uses session context (user id + organization), not global tenant fallbacks.

## Phase 2 — Waitlist MVP (Done in code)
1. Add waitlist domain model (`WaitlistEntry`, `WaitlistStatus`) and role model (`UserRole`) in Prisma.
2. Add API for explicit waitlist enrollment (`POST /api/events/waitlist`).
3. Integrate auto-waitlist path into event registration when event capacity is full (`joinWaitlist=true`).
4. Return deterministic API response payloads for full/waitlisted outcomes.

## Phase 3 — Database & Migration
1. Generate Prisma migration:
   - `npx prisma migrate dev --name add-rbac-and-waitlist`
2. Regenerate Prisma client:
   - `npx prisma generate`
3. Verify schema drift and run migration in staging/prod pipelines.

## Phase 4 — QA & Validation
1. API security checks:
   - member role denied on admin endpoints.
   - admin role allowed only for same-org resources.
2. Waitlist checks:
   - full event with `joinWaitlist=false` returns `canJoinWaitlist=true`.
   - full event with `joinWaitlist=true` creates/updates waitlist record.
3. Regression checks:
   - check-in and QR verification still function for admin users.

## Phase 5 — Production Hardening (Next)
1. Replace remaining `getCurrentOrganizationId` fallback paths with session/subdomain resolution.
2. Add structured validation (e.g., Zod) for route payloads.
3. Add integration tests around org isolation and waitlist behavior.
4. Add admin waitlist management operations (offer/promote/cancel).

## Rollback Plan
1. Revert API authz helper usage from modified endpoints.
2. Revert waitlist route and event registration waitlist logic.
3. Roll back Prisma migration that introduced role/waitlist models.

## Release Checklist
- [ ] Migration applied in target environment.
- [ ] Environment has dependencies installed (`npm ci`).
- [ ] Smoke-test all modified endpoints.
- [ ] Verify one member and one admin account in at least two orgs.
