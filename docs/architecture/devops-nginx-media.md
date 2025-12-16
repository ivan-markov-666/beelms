# beelms – Nginx конфигурация за Wiki media (MVP)

_Роля: DevOps / Architect. Този документ описва примерна Nginx конфигурация за обслужване на Wiki изображенията, използвани в markdown съдържанието._

## 1. Цел

- Статичните изображения за Wiki статии се съхраняват локално на VPS-а под общ `media_root`.
- Публичните URL-и са от вида:
  - `/wiki/media/<article_slug>/<filename.ext>`
- Nginx трябва да мапне тези URL-и към реалните файлове на диска.

## 2. Структура на файловете (media_root)

Концептуална структура на директориите за Wiki media:

```text
/var/beelms/media/wiki/<article_slug>/<filename.ext>
пример: /var/beelms/media/wiki/manual-testing-intro/diagram-1.png
```

Тази директория (`/var/beelms/media`) следва да бъде:
- споделена Docker volume между:
  - Nginx контейнера (reverse proxy);
  - `wiki_service` контейнера, който качва/трие файлове.

Примерен Docker volume (идея, не е пълен `docker-compose.yml`):

```yaml
volumes:
  wiki_media:

services:
  nginx:
    volumes:
      - wiki_media:/var/beelms/media

  wiki_service:
    volumes:
      - wiki_media:/var/beelms/media
```

## 3. Примерен Nginx `location` блок

Следният блок показва как `/wiki/media/` се мапва към файловата система под `/var/beelms/media/wiki/`:

```nginx
# Статични файлове за Wiki изображения (MVP)
location /wiki/media/ {
    # "alias" позволява директно мапване към поддиректорията "wiki" под media_root
    alias /var/beelms/media/wiki/;

    # По избор: ограничаване до четене на файлове (без листинг на директории)
    autoindex off;

    # По избор: дълъг cache за статични изображения
    expires 30d;
    add_header Cache-Control "public";

    # По избор: ограничаване на методите само до GET/HEAD
    limit_except GET HEAD {
        deny all;
    }
}
```

Важно:
- `alias /var/beelms/media/wiki/;` означава, че заявка за:
  - `/wiki/media/manual-testing-intro/diagram-1.png`
  ще се търси на диска като:
  - `/var/beelms/media/wiki/manual-testing-intro/diagram-1.png`

## 4. Забележки за сигурност и бъдещи стъпки

- В реалната конфигурация е добре да се ограничи размера на качваните файлове (напр. чрез `client_max_body_size`) и да се валидарат MIME типовете в `wiki_service`.
- В бъдеща (post-MVP) версия media storage може да се премести към object storage (S3/Backblaze/MinIO), като публичният път `/wiki/media/<slug>/<filename>` може да остане същият и да сочи към CDN/обектно хранилище.
