/**
 * Интерфейс для провайдеров полнотекстового поиска
 * Абстрагирует различия между SQLite и PostgreSQL реализациями
 */
export interface IFullTextSearchProvider {
  /**
   * Генерирует поисковый вектор для entity
   * @param entity - Объект с контентом для индексации
   * @returns Объект, представляющий поисковый вектор в специфическом для БД формате
   */
  generateSearchVector(entity: {
    languageCode: string;
    content: string;
    id?: string;
    title?: string;
  }): Record<string, number> | (() => string);

  /**
   * Создает SQL условие для полнотекстового поиска
   * @param searchQuery - Поисковый запрос
   * @param languageCode - Код языка для поиска (bg, en, de)
   * @param fieldName - Имя поля в БД для поиска (обычно searchVector)
   * @returns SQL выражение для использования в WHERE или ORDER BY
   */
  createSearchCondition(searchQuery: string, languageCode: string, fieldName: string): string;

  /**
   * Генерирует фрагмент запроса для ранжирования результатов поиска
   * @param searchQuery - Поисковый запрос
   * @param languageCode - Код языка для поиска
   * @param fieldName - Имя поля в БД для поиска
   * @returns SQL выражение для ORDER BY
   */
  generateRankingQuery(searchQuery: string, languageCode: string, fieldName: string): string;

  /**
   * Проверяет, поддерживается ли полнотекстовый поиск для текущей БД
   * @returns true если поддерживается
   */
  isFTSSupported(): boolean;
}
