# Threat Model & GDPR / Data Privacy

## 1. Context
Определя обхвата на системата, участниците и активите, които трябва да бъдат защитени.

## 2. Attack Surface Overview
_Диаграми и описания на всички публични интерфейси (API Gateway, CDN, админ портали)._ 

## 3. STRIDE анализ
| Category | Example Threats | Mitigations |
|----------|-----------------|-------------|
| Spoofing | Претендиране на чужд JWT | JWT signature + kid rotation |
| Tampering | Подмяна на данни в транзит | TLS 1.3, HMAC checks |
| Repudiation | Отричане на действия | Audit logs + immutability |
| Information Disclosure | SQL Injection, необезпечени S3 обекти | ORM, IAM policies |
| Denial of Service | DDoS, brute-force login | Cloudflare WAF, rate limiting |
| Elevation of Privilege | Broken access control | RBAC/ABAC + integration tests |

## 4. GDPR Data Mapping
| Data Category | Purpose | Legal Basis | Retention | Storage Location |
|---------------|---------|------------|-----------|------------------|
| Email | Account identification | Consent | Until account deletion + 30 d grace | PostgreSQL |
| Progress Data | Personalization | Legitimate interest | Unlimited unless user requests erasure | PostgreSQL |
| Logs (IP) | Security monitoring | Legitimate interest | 30 days | Loki |

## 5. Risk Register
_Списък с идентифицирани рискове, вероятност, въздействие и планирани мерки._

## 6. Review & Update Cadence
- Преглед на модела при всяка значима архитектурна промяна
- Поне веднъж годишно формален одит
