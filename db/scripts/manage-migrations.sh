#!/bin/bash
# db/scripts/manage-migrations.sh

# Цветове за терминала
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция за показване на помощна информация
show_help() {
    echo -e "${BLUE}Управление на миграциите за Учебната платформа${NC}"
    echo
    echo "Употреба:"
    echo "  $0 [команда] [опции]"
    echo
    echo "Команди:"
    echo "  generate [име]     Генерира нова миграция с даденото име"
    echo "  run                Изпълнява всички неприложени миграции"
    echo "  revert             Връща последната миграция"
    echo "  revert-all         Връща всички миграции"
    echo "  status             Показва статуса на миграциите"
    echo "  create-admin       Създава администраторски потребител"
    echo "  backup             Създава резервно копие на базата данни"
    echo "  restore [файл]     Възстановява базата данни от резервно копие"
    echo "  help               Показва тази помощна информация"
    echo
    echo "Примери:"
    echo "  $0 generate AddUserRoles"
    echo "  $0 run"
    echo "  $0 revert"
    echo "  $0 backup"
    echo "  $0 restore backup-2023-05-01.sql"
    echo
}

# Функция за генериране на миграция
generate_migration() {
    if [ -z "$1" ]; then
        echo -e "${RED}Грешка: Липсва име на миграцията${NC}"
        echo "Пример: $0 generate AddUserRoles"
        exit 1
    fi

    echo -e "${YELLOW}Генериране на миграция: $1...${NC}"
    cd db/migrations && npm run migration:create -- src/migrations/$1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Миграцията е генерирана успешно!${NC}"
    else
        echo -e "${RED}Грешка при генериране на миграцията!${NC}"
        exit 1
    fi
}

# Функция за изпълнение на миграции
run_migrations() {
    echo -e "${YELLOW}Изпълнение на миграции...${NC}"
    cd db/migrations && npm run migration:run
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Миграциите са изпълнени успешно!${NC}"
    else
        echo -e "${RED}Грешка при изпълнение на миграциите!${NC}"
        exit 1
    fi
}

# Функция за връщане на последната миграция
revert_migration() {
    echo -e "${YELLOW}Връщане на последната миграция...${NC}"
    cd db/migrations && npm run migration:revert
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Миграцията е върната успешно!${NC}"
    else
        echo -e "${RED}Грешка при връщане на миграцията!${NC}"
        exit 1
    fi
}

# Функция за връщане на всички миграции
revert_all_migrations() {
    echo -e "${YELLOW}Връщане на всички миграции...${NC}"
    echo -e "${RED}ВНИМАНИЕ: Това ще изтрие всички данни от базата данни!${NC}"
    read -p "Сигурни ли сте? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        MIGRATION_COUNT=$(cd db/migrations && npm run migration:show | grep -c "\[X\]")
        for (( i=0; i<$MIGRATION_COUNT; i++ )); do
            cd db/migrations && npm run migration:revert
            if [ $? -ne 0 ]; then
                echo -e "${RED}Грешка при връщане на миграциите!${NC}"
                exit 1
            fi
        done
        echo -e "${GREEN}Всички миграции са върнати успешно!${NC}"
    else
        echo -e "${YELLOW}Операцията е отменена.${NC}"
    fi
}

# Функция за показване на статус на миграциите
show_migration_status() {
    echo -e "${YELLOW}Статус на миграциите:${NC}"
    cd db/migrations && npm run migration:show
}

# Функция за създаване на администраторски потребител
create_admin_user() {
    echo -e "${YELLOW}Създаване на администраторски потребител...${NC}"
    read -p "Имейл: " admin_email
    read -s -p "Парола: " admin_password
    echo
    
    if [ -z "$admin_email" ] || [ -z "$admin_password" ]; then
        echo -e "${RED}Грешка: Имейлът и паролата са задължителни!${NC}"
        exit 1
    fi

    # Тук трябва да се добави логика за хеширане на паролата и вмъкване на потребителя в базата данни
    # За опростяване, ще използваме директна SQL заявка
    
    # Хеширане на паролата (примерно)
    hashed_password=$(echo -n "$admin_password" | shasum -a 256 | awk '{print $1}')
    salt=$(cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | fold -w 16 | head -n 1)
    
    # Вмъкване на администраторския потребител
    psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "INSERT INTO users (email, password_hash, salt, role, is_active) VALUES ('$admin_email', '$hashed_password', '$salt', 'admin', true);"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Администраторският потребител е създаден успешно!${NC}"
    else
        echo -e "${RED}Грешка при създаване на администраторския потребител!${NC}"
        exit 1
    fi
}

# Функция за създаване на резервно копие на базата данни
backup_database() {
    echo -e "${YELLOW}Създаване на резервно копие на базата данни...${NC}"
    
    # Създаване на директория за резервни копия, ако не съществува
    mkdir -p db/backups
    
    # Създаване на име на файла с дата и час
    backup_file="db/backups/backup-$(date +%Y-%m-%d_%H-%M-%S).sql"
    
    # Създаване на резервно копие
    pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -F p -f "$backup_file"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Резервното копие е създадено успешно: $backup_file${NC}"
    else
        echo -e "${RED}Грешка при създаване на резервното копие!${NC}"
        exit 1
    fi
}

# Функция за възстановяване на базата данни от резервно копие
restore_database() {
    if [ -z "$1" ]; then
        echo -e "${RED}Грешка: Липсва файл за възстановяване${NC}"
        echo "Пример: $0 restore db/backups/backup-2023-05-01.sql"
        exit 1
    fi

    if [ ! -f "$1" ]; then
        echo -e "${RED}Грешка: Файлът не съществува: $1${NC}"
        exit 1
    fi

    echo -e "${YELLOW}Възстановяване на базата данни от резервно копие: $1...${NC}"
    echo -e "${RED}ВНИМАНИЕ: Това ще презапише текущата база данни!${NC}"
    read -p "Сигурни ли сте? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Изчистване на текущата база данни
        psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
        
        # Възстановяване от резервно копие
        psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f "$1"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Базата данни е възстановена успешно!${NC}"
        else
            echo -e "${RED}Грешка при възстановяване на базата данни!${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}Операцията е отменена.${NC}"
    fi
}

# Зареждане на променливи от средата
source .env

# Основна логика
case "$1" in
    generate)
        generate_migration "$2"
        ;;
    run)
        run_migrations
        ;;
    revert)
        revert_migration
        ;;
    revert-all)
        revert_all_migrations
        ;;
    status)
        show_migration_status
        ;;
    create-admin)
        create_admin_user
        ;;
    backup)
        backup_database
        ;;
    restore)
        restore_database "$2"
        ;;
    help|*)
        show_help
        ;;
esac

exit 0