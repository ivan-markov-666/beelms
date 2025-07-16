import { IFullTextSearchProvider } from './fts-provider.interface';
import { PostgresFtsProvider } from './postgres-fts-provider';
import { SqliteFtsProvider } from './sqlite-fts-provider';

/**
 * Factory-функция для получения соответствующего провайдера FTS
 * в зависимости от используемой базы данных
 *
 * @returns {IFullTextSearchProvider} FTS провайдер для текущей БД
 */
export const getFtsProvider = (): IFullTextSearchProvider => {
  // Определяем тип базы данных на основе переменной окружения или другой конфигурации
  const dbType = process.env.DATABASE_TYPE || 'sqlite';

  // В зависимости от типа БД возвращаем соответствующий провайдер
  if (dbType.toLowerCase() === 'postgres' || dbType.toLowerCase() === 'postgresql') {
    return new PostgresFtsProvider();
  }

  // По умолчанию используем SQLite провайдер для локальной разработки и тестирования
  return new SqliteFtsProvider();
};

/**
 * Экспортируем один экземпляр провайдера для удобного импорта
 * в других модулях
 */
export const ftsProvider = getFtsProvider();

/**
 * Проверяет, поддерживает ли текущая база данных полнотекстовый поиск
 * @returns {boolean} true если FTS поддерживается
 */
export const isFTSSupported = (): boolean => {
  return getFtsProvider().isFTSSupported();
};
