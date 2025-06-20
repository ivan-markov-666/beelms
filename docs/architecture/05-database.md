# База данни

## Схема на базата данни

```mermaid
erDiagram
    User ||--o{ UserProfile : has
    User ||--o{ UserProgress : tracks
    User ||--o{ UserTestAttempt : takes
    User ||--o{ Session : maintains
    
    Course ||--o{ Chapter : contains
    Chapter ||--o{ Content : includes
    Chapter ||--o{ Test : assesses
    Chapter ||--o{ UserProgress : tracked_in
    
    Content ||--o{ ContentVersion : versioned_as
    Content ||--o{ UserProgress : progress_on
    
    Test ||--o{ Question : consists_of
    Test ||--o{ UserTestAttempt : completed_by
    
    UserTestAttempt ||--o{ UserAnswer : records
    Question ||--o{ UserAnswer : answered_by
    
    Advertisement ||--o{ UserAdView : shown_to
```

## Ключови таблици

### User
- Основна информация за автентикация
- Роли и права
- Security fields (failed_login_attempts, last_login)

### Course/Chapter/Content
- Йерархична структура на учебното съдържание
- Поддръжка на версиониране
- Метаданни и настройки

### UserProgress
- Детайлно проследяване на напредъка
- Време прекарано на съдържание
- Процент на завършеност

### Test/Question/UserAnswer
- Гъвкава система за тестове
- Различни типове въпроси
- Детайлни резултати

## Оптимизационни стратегии

1. Индексиране на често използвани полета
2. Кеширане на често достъпвани данни в Redis
3. Партициониране на големи таблици за по-добра производителност 
4. Периодично архивиране на стари данни
5. Оптимизирани заявки с внимателно проектирани JOIN операции
