import * as sanitizeHtml from 'sanitize-html';

/**
 * Изчиства HTML съдържание от потенциални XSS атаки
 * @param content HTML съдържание, което трябва да бъде изчистено
 * @returns Изчистено HTML съдържание
 */
export function sanitizeContent(content: string): string {
  if (!content) {
    return content;
  }

  return sanitizeHtml(content, {
    // Разрешаваме само определени HTML тагове
    allowedTags: [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
      'p',
      'a',
      'ul',
      'ol',
      'nl',
      'li',
      'b',
      'i',
      'strong',
      'em',
      'strike',
      'code',
      'hr',
      'br',
      'div',
      'table',
      'thead',
      'caption',
      'tbody',
      'tr',
      'th',
      'td',
      'pre',
      'img',
      'span',
      'details',
      'summary',
      'figure',
      'figcaption',
    ],
    // Разрешаваме само определени атрибути
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      div: ['class', 'data-*'],
      span: ['class', 'data-*'],
      p: ['class'],
      code: ['class'],
      pre: ['class'],
      table: ['class', 'border'],
      th: ['class', 'scope'],
      td: ['class', 'colspan', 'rowspan'],
      details: ['open'],
      '*': ['class', 'id'], // Разрешава class и id за всички тагове
    },
    // Блокираме всички URL схеми, които не са в списъка
    allowedSchemes: ['http', 'https', 'ftp', 'mailto', 'tel'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data'],
    },
    // Премахва всички атрибути, които започват с "on" (предотвратява JavaScript събития)
    disallowedTagsMode: 'discard',
    // Указваме политиката за URL атрибути
    allowedSchemesAppliedToAttributes: ['href', 'src', 'cite'],
    // Премахва празни атрибути
    allowVulnerableTags: false,
    allowProtocolRelative: false,
  });
}

/**
 * Валидира дали даден текст съдържа потенциално вредоносен JavaScript код
 * @param text Текстът за валидация
 * @returns true ако текстът е безопасен, false в противен случай
 */
export function isTextSafe(text: string): boolean {
  if (!text) return true;

  // Проверяваме за JavaScript код
  const scriptPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  const jsEventPattern = /\bon\w+\s*=/gi;

  return !scriptPattern.test(text) && !jsEventPattern.test(text);
}
