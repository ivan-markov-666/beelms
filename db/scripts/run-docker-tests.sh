#!/bin/bash

# Цветове за терминала
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Стартиране на тестове за миграциите с Docker...${NC}"

# Уверяваме се, че сме в кореновата директория на проекта
cd "$(dirname "$0")/../.."

# Спиране на съществуващи контейнери, които могат да използват порт 5432
docker-compose -f docker-compose.test.yml down

# Стартиране на тестовата база данни
echo -e "${YELLOW}Стартиране на тестова PostgreSQL база данни...${NC}"
docker-compose -f docker-compose.test.yml up -d test-db

# Изчакване базата данни да стане готова
echo -e "${YELLOW}Изчакване базата данни да стане готова...${NC}"
until docker exec $(docker ps -q -f name=test-db) pg_isready -U test_user -h localhost -d test_db; do
  echo "."
  sleep 2
done

echo -e "${GREEN}Базата данни е готова за тестване!${NC}"

# Показване на информация за контейнера
echo -e "${YELLOW}Информация за контейнера:${NC}"
docker ps -f name=test-db

# Изпълнение на тестовете
echo -e "${YELLOW}Изпълнение на тестовете...${NC}"
cd db/migrations
npm test
TEST_RESULT=$?

# Спиране на контейнера
cd ../..
echo -e "${YELLOW}Почистване на ресурсите...${NC}"
docker-compose -f docker-compose.test.yml down

# Връщане на резултата от тестовете
if [ $TEST_RESULT -eq 0 ]; then
  echo -e "${GREEN}Тестовете за миграции са успешни!${NC}"
  exit 0
else
  echo -e "${RED}Тестовете за миграции се провалиха!${NC}"
  exit 1
fi