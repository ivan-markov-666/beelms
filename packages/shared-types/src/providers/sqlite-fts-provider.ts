import { IFullTextSearchProvider } from './fts-provider.interface';

/**
 * SQLite имплементация провайдера полнотекстового поиска
 *
 * Поскольку SQLite имеет более простую поддержку FTS через FTS5 расширение,
 * мы используем упрощенный подход для совместимости во время разработки и тестирования
 * @implements {IFullTextSearchProvider}
 */
export class SqliteFtsProvider implements IFullTextSearchProvider {
  /**
   * Генерирует "поисковый вектор" для SQLite
   * В SQLite мы просто сохраняем нормализованный текст для поиска как JSON
   * @param entity - Объект с контентом для индексации
   * @returns Объект с токенами для поиска в формате простого JSON
   */
  /**
   * Генерирует структуру данных для полнотекстового поиска в SQLite
   * @param entity Объект с контентом для индексации
   * @returns Record<string, number> Частота ключевых слов в контенте
   */
  generateSearchVector(entity: {
    languageCode: string;
    content: string;
    id?: string;
    title?: string;
  }): Record<string, number> {
    // Для SQLite мы создаем простой JSON объект с токенами
    // Примечание: в SQLite нет языковых конфигураций как в PostgreSQL,
    // поэтому languageCode игнорируется

    const content = entity.content || '';
    const title = entity.title || '';

    // Комбинируем заголовок и контент с разными весами
    let searchText = '';
    if (title) {
      // Добавляем заголовок несколько раз для повышения его значимости
      searchText += `${title} ${title} ${title} `;
    }
    searchText += content;

    // Нормализуем текст с помощью helper-функции
    const normalized = this.normalizeToken(searchText);

    // Разбиваем на токены
    const tokens = normalized
      .split(' ')
      .filter((token) => token.length > 2) // Игнорируем слишком короткие слова
      .reduce(
        (acc, token) => {
          acc[token] = (acc[token] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

    return tokens;
  }

  /**
   * Normalize token: lowercase, remove punctuation, collapse spaces.
   * Exposed for testability.
   */
  normalizeToken(token: string): string {
    return token
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Escape special LIKE pattern characters.
   * @param term Raw term
   */
  escapeLikePattern(term: string): string {
    return term.replace(/[%_]/g, (c) => `\\${c}`);
  }

  /**
   * Создает SQL условие для поиска в SQLite
   * В локальной разработке используем LIKE с несколькими условиями
   * @param searchQuery - Поисковый запрос
   * @param languageCode - Код языка для поиска (не используется в SQLite)
   * @param fieldName - Имя поля в БД для поиска
   * @returns SQL выражение для использования в WHERE
   */
  /**
   * Создает SQL условие для поиска в SQLite
   * @param searchQuery Текст поискового запроса
   * @param languageCode Код языка (не используется в SQLite)
   * @param fieldName Имя поля с поисковым вектором
   * @returns Строка SQL-условия
   */
  createSearchCondition(searchQuery: string, _languageCode: string, fieldName: string): string {
    // В SQLite мы не используем языковые конфигурации как в PostgreSQL,
    // поэтому languageCode игнорируется
    // Разбиваем запрос на слова
    const terms = this.normalizeToken(searchQuery)
      .split(' ')
      .filter((term) => term.length > 2);

    if (terms.length === 0) {
      return '1=1'; // Пустое условие для пустого запроса
    }

    // Для SQLite мы используем LIKE для каждого слова запроса
    // и JSON_EXTRACT для поиска по токенам в JSON поле
    const conditions = terms.map(
      (term) =>
        `(
        JSON_EXTRACT(${fieldName}, '$."${term}"') IS NOT NULL
        OR title LIKE '%${this.escapeLikePattern(term)}%'
        OR content LIKE '%${this.escapeLikePattern(term)}%'
      )`
    );

    return conditions.join(' AND ');
  }

  /**
   * Генерирует фрагмент запроса для ранжирования результатов поиска в SQLite
   * @param searchQuery - Поисковый запрос
   * @param languageCode - Код языка для поиска (не используется в SQLite)
   * @param fieldName - Имя поля в БД для поиска
   * @returns SQL выражение для ORDER BY
   */
  /**
   * Генерирует SQL выражение для ранжирования результатов поиска
   * @param searchQuery Текст поискового запроса
   * @param languageCode Код языка (не используется в SQLite)
   * @param fieldName Имя поля с поисковым вектором
   * @returns Строка SQL-выражения для ORDER BY
   */
  generateRankingQuery(_searchQuery: string, _languageCode: string, fieldName: string): string {
    // В SQLite мы не используем языковые конфигурации как в PostgreSQL,
    // поэтому languageCode игнорируется
    // В SQLite FTS5 можем използвать встроенную функцию bm25() для ранжирования
    // Здесь предполагаем, что fieldName - это виртуальная колонка FTS5
    return `bm25(${fieldName}) AS rank`;
  }

  /**
   * Проверяет, поддерживается ли FTS в текущей версии SQLite
   * @returns true если поддерживается (в большинстве случаев true для новых версий SQLite)
   */
  isFTSSupported(): boolean {
    // В большинстве новых версий SQLite FTS поддерживается через расширения
    // Но для полной уверенности потребуется динамическая проверка
    // В нашем случае просто возвращаем true для простоты
    return true;
  }
}
