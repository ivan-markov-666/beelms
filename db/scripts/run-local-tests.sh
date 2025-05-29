#!/bin/bash

# Цветове за терминала
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Стартиране на тестове за миграциите с реалната база данни...${NC}"

# Преминаване към директория с миграциите
cd db/migrations

# Проверка дали PostgreSQL работи
echo -e "${YELLOW}Проверка дали PostgreSQL работи...${NC}"
if docker ps | grep -q learning-platform-db; then
echo -e "${GREEN}PostgreSQL контейнерът е стартиран!${NC}"
else
echo -e "${RED}PostgreSQL контейнерът не е стартиран! Моля, стартирайте го с 'docker-compose up -d db'${NC}"
exit 1
fi

# Изпълнение на тестовете
echo -e "${YELLOW}Изпълнение на тестовете...${NC}"
npm test
TEST_RESULT=$?

# Връщане на резултата от тестовете
if [ $TEST_RESULT -eq 0 ]; then
echo -e "${GREEN}Тестовете за миграции са успешни!${NC}"
exit 0
else
echo -e "${RED}Тестовете за миграции се провалиха!${NC}"
exit 1
fi