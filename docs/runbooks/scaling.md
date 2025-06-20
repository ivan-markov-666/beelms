# Ръководство: Скалиране нагоре / надолу

| Условие | Отговорник | Стъпки за реакция |
|---------|------------|-------------------|
| CPU > 75 % за 5 мин | SRE | 1. kubectl scale deployment/course --replicas=+1 |
| Натоварване на паметта | SRE | 1. Увеличи memory limit в Helm values<br>2. Редеплой |

## Хоризонтален Под Автоскейлер (HPA)
```
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
...
```
