# Микросервисна архитектура

## Общ преглед на архитектурата

```mermaid
graph TB
    subgraph "Cloudflare Edge Network"
        cf["Cloudflare CDN/WAF<br>(DDoS Protection, Global SSL)"]
    end
    
    subgraph "VPS Infrastructure"
        nginx["Nginx Gateway<br>(Origin SSL, Load Balancer)"]
        
        subgraph "Микросервиси"
            auth["Auth Service"]
            user["User Service"]
            course["Course Service"]
            test["Test Service"]
            analytics["Analytics Service"]
            ads["Ads Service"]
        end
        
        subgraph "Data Layer"
            postgres["PostgreSQL"]
            redis["Redis Cache"]
        end
    end
    
    client["Потребители"] --> cf
    cf --> nginx
    nginx --> auth & user & course & test & analytics & ads
```

## Описание на микросервисите

### Auth Service
- JWT token management
- Регистрация и вписване
- Възстановяване на пароли
- Session management

### User Service
- Потребителски профили
- Управление на роли
- Потребителски настройки

### Course Service
- CRUD операции за курсове
- Управление на съдържание
- Версиониране
- Проследяване на прогрес

### Test Service
- Управление на тестове
- Обработка на отговори
- Оценяване и резултати

### Analytics Service
- Събиране на данни
- Генериране на отчети
- Експорт функционалности

### Ads Service
- Управление на реклами
- Anti-adblocker механизми
- Статистики и отчети

## Междусервисна комуникация

```mermaid
flowchart LR
    subgraph "API Gateway"
        nginx[Nginx]
    end
    
    subgraph "Auth Domain"
        auth[Auth Service]
    end
    
    subgraph "User Domain"
        user[User Service]
    end
    
    subgraph "Course Domain"
        course[Course Service]
        progress[Progress Tracking]
    end
    
    subgraph "Test Domain"
        test[Test Service]
    end
    
    subgraph "Analytics Domain"
        analytics[Analytics Service]
    end
    
    subgraph "Ads Domain"
        ads[Ads Service]
    end
    
    subgraph "Shared Services"
        redis[(Redis)]
        postgres[(PostgreSQL)]
        rabbitmq[RabbitMQ]
    end
    
    nginx --> auth
    nginx --> user
    nginx --> course
    nginx --> test
    nginx --> analytics
    nginx --> ads
    
    auth <--> user
    course <--> progress
    course --> analytics
    test --> analytics
    progress --> analytics
    ads --> user
    ads --> analytics
    
    auth --> redis
    user --> redis
    course --> redis
    test --> redis
    
    auth --> postgres
    user --> postgres
    course --> postgres
    test --> postgres
    analytics --> postgres
    ads --> postgres
    
    course --> rabbitmq
    test --> rabbitmq
    analytics --> rabbitmq
    ads --> rabbitmq
```
