#!/bin/bash

# Цветове за терминала
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Стартиране на тестове за миграциите с testcontainers...${NC}"

# Проверка дали Docker е стартиран
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}Docker не е стартиран! Моля, стартирайте Docker и опитайте отново.${NC}"
  exit 1
fi

# Преминаване към директория с миграциите
cd db/migrations

# Изпълнение на тестовете
echo -e "${YELLOW}Изпълнение на тестовете с тест контейнери...${NC}"
npm test

# Проверка на резултат
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Тестовете за миграции са успешни!${NC}"
  exit 0
else
  echo -e "${RED}Тестовете за миграции се провалиха!${NC}"
  exit 1
fi