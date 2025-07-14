import { IFullTextSearchProvider } from './fts-provider.interface';

/**
 * PostgreSQL имплементация провайдера полнотекстового поиска
 * Использует встроенные в PostgreSQL функциональности tsvector и tsquery
 * @implements {IFullTextSearchProvider}
 */
export class PostgresFtsProvider implements IFullTextSearchProvider {
  /**
   * Сопоставление кодов языков с PostgreSQL конфигурациями стеммеров
   * @private
   */
  private readonly languageMap: Record<string, string> = {
    bg: 'bulgarian',
    en: 'english',
    de: 'german',
  };

  /**
   * Генерирует поисковый вектор для PostgreSQL
   * @param entity - Объект с контентом для индексации
   * @returns SQL выражение для создания tsvector
   */
  generateSearchVector(entity: { languageCode: string; content: string; id?: string; title?: string }): () => string {
    // В PostgreSQL мы возвращаем SQL выражение, которое будет использовано
    // для генерации tsvector непосредственно в базе данных
    const language = this.languageMap[entity.languageCode as keyof typeof this.languageMap] || 'simple';

    // Для PostgreSQL возвращаем выражение, которое TypeORM выполнит при сохранении
    // Используем setWeight для различного веса заголовка (A) и содержимого (B)
    let expression = '';

    if (entity.title) {
      expression = `setweight(to_tsvector('${language}', '${this.escapeSql(entity.title)}'), 'A')`;
      if (entity.content) {
        expression += ` || `;
      }
    }

    if (entity.content) {
      expression += `setweight(to_tsvector('${language}', '${this.escapeSql(entity.content)}'), 'B')`;
    }

    return () => `${expression}`;
  }

  /**
   * Создает SQL условие для полнотекстового поиска в PostgreSQL
   * @param searchQuery - Поисковый запрос
   * @param languageCode - Код языка для поиска
   * @param fieldName - Имя поля в БД для поиска
   * @returns SQL выражение для использования в WHERE
   */
  createSearchCondition(searchQuery: string, languageCode: string, fieldName: string): string {
    const language = this.languageMap[languageCode as keyof typeof this.languageMap] || 'simple';
    const normalizedQuery = this.normalizeQuery(searchQuery);

    // Используем to_tsquery с соответствующим языковым конфигом
    return `${fieldName} @@ to_tsquery('${language}', '${normalizedQuery}')`;
  }

  /**
   * Генерирует фрагмент запроса для ранжирования результатов поиска в PostgreSQL
   * @param searchQuery - Поисковый запрос
   * @param languageCode - Код языка для поиска
   * @param fieldName - Имя поля в БД для поиска
   * @returns SQL выражение для ORDER BY
   */
  generateRankingQuery(searchQuery: string, languageCode: string, fieldName: string): string {
    const language = this.languageMap[languageCode as keyof typeof this.languageMap] || 'simple';
    const normalizedQuery = this.normalizeQuery(searchQuery);

    // Используем ts_rank_cd для ранжирования результатов с учетом расстояния между словами
    return `ts_rank_cd(${fieldName}, to_tsquery('${language}', '${normalizedQuery}')) DESC`;
  }

  /**
   * Проверяет, поддерживается ли FTS в PostgreSQL
   * @returns всегда true, так как PostgreSQL поддерживает FTS
   */
  isFTSSupported(): boolean {
    return true;
  }

  /**
   * Нормализует поисковый запрос для использования в to_tsquery
   * @param query - Поисковый запрос
   * @returns Нормализованный запрос
   */
  private normalizeQuery(query: string): string {
    // Заменяем пробелы на оператор & (AND) и экранируем спецсимволы
    return query
      .replace(/[^\p{L}\p{N}]+/gu, ' ') // Оставляем только буквы и цифры
      .trim()
      .split(' ')
      .filter((word) => word.length > 1) // Убираем слишком короткие слова
      .map((word) => this.escapeSql(word))
      .join(' & ');
  }

  /**
   * Экранирует строку для безопасного использования в SQL запросе
   * @param text - Текст для экранирования
   * @returns Экранированная строка
   */
  private escapeSql(text: string): string {
    return text.replace(/'/g, "''").replace(/\\/g, '\\\\');
  }
}
