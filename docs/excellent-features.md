# Excellence Feature Rollout Status

This document maps the requested feature list to delivered foundations in this release.

## Implemented Foundations
1. **RBAC permission matrix**: role/resource/action policy engine in `src/lib/rbac.ts` and permission-aware auth checks in `src/lib/authz.ts`.
2. **Waitlists + auto-promotion**: waitlist APIs and admin promotion endpoint (`/api/admin/events/waitlist/promote`).
3. **Recurring templates**: CRUD API for recurring booking templates (`/api/admin/recurring-templates`).
4. **Scoring module**: discipline scores + leaderboard season models and score API (`/api/admin/scoring`).
5. **Coaching module**: lesson packages, coaching sessions, notes models + coaching session API (`/api/admin/coaching/sessions`).
6. **Compliance center**: compliance document model + API (`/api/admin/compliance/documents`).
7. **Incident logs**: incident model + API (`/api/admin/incidents`).
8. **Accounting exports**: CSV export endpoint (`/api/admin/finance/export`).
9. **Advanced comms**: campaign model + API (`/api/admin/campaigns`).
10. **PWA baseline**: manifest for installability (`src/app/manifest.ts`).
11. **Multi-location baseline**: `Location` model with facility location relation.
12. **Analytics suite baseline**: overview metrics endpoint (`/api/admin/analytics/overview`).

## GDPR / Privacy
- Added `/privacy-policy` and `/data-protection-policy` pages.
- Added privacy request workflow API (`/api/user/privacy/requests`) and personal data export endpoint (`/api/user/privacy/export`).
