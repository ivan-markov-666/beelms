# Privacy & Compliance

| Personal Data | Storage | Encryption | Retention | Lawful Basis |
|---------------|---------|-----------|-----------|--------------|
| Email | PostgreSQL `users.email` | AES-256 at rest, TLS in transit | Until account deletion | Consent |
| Name | PostgreSQL `profiles.name` | AES-256 | Until account deletion | Legitimate interest |
| Progress events | ClickHouse `progress` | None (non-personal) | 3 years | Legitimate interest |
| IP Address | Redis session | None | 30 days | Legitimate interest |

## GDPR Flows
1. **DSAR (Data Subject Access Request)** – export with `scripts/dsar-export.sh` within 30 days.
2. **Right to be forgotten** – trigger `DELETE /gdpr/users/:id` which soft-deletes and schedules hard-delete.
