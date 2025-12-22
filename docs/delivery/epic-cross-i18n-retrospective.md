# EPIC-CROSS-I18N Retrospective

**Date:** 2025-12-22  
**Owner:** Cascade (pairing with BeeLMS team)

## 1. Scope Recap
- **Goal:** Единен глобален езиков опит (BG/EN/DE), достъпен от header-а и валиден за всички публични екрани.  
- **Delivered Stories:**
  1. `STORY-MVP-WIKI-LANGUAGE-SWITCH` – wiki лист/артикъл, global switcher.
  2. `STORY-MVP-CROSS-I18N-FE-FOUNDATION` – i18n слой (`config`, `messages`, `useCurrentLang`, header навигация).
  3. Auth/UI локализация (phase 3 subset) – login/register flows използват речниците.
  4. `STORY-MVP-CROSS-I18N-PERSISTENCE` – `ui_lang` cookie, middleware redirect, SSR `<html lang>`.

## 2. Outcomes / Evidence
- URL `?lang=` остава single source of truth; cookie само пази предпочитание.  
- Всички публични екрани използват общ header + `t()` речници за основните линкове.  
- Direct load без `lang` → redirect към `?lang=<cookie|bg>`, елиминира flicker и несъответствия.  
- SSR `<html lang>` подобрява a11y/SEO и синхронизира с избора на потребителя.  
- Unit тестове покриват `LanguageSwitcher`, i18n helper-и и auth форми.

## 3. What Went Well
1. **Phased rollout** (wiki → foundation → auth → persistence) позволи бързи проверки без breaking changes.  
2. **Shared helpers (`normalizeLang`, `useCurrentLang`, `t`)** сведоха дублиране до минимум и улесниха покриването на нови екрани.  
3. **Middleware + SSR integration** дадоха seamless UX на всички маршрути без нужда от масови refactor-и.

## 4. What Was Painful / Risks
1. **URL propagation bugs:** ранните екрани (courses/tasks) нямаха `lang` в link-овете → наложи ръчни одити.  
2. **Testing inertia:** някои страници все още нямат snapshot/smoke тест за EN, което крие риск от регресии.  
3. **Docs drift:** README описваше само wiki slice; потреби се допълнителна синхронизация, за да се разбере как cookie + middleware работят.  
4. **Броят на езици расте:** добавянето на `de` показа липса на процес за преводни файлове (дифове, review). Необходими са tooling/линтери.

## 5. Follow-ups / Next Steps
1. **Documentation pass:** обновяване на `fe/README.md` и developer onboarding, за да включват cookie/middleware flow и указания за добавяне на нови преводи.  
2. **Smoke suite:** добавяне на e2e или Playwright сценарии за най-често използваните публични страници (Wiki, Courses, Auth) с BG/EN, за да уловим бъдещи пропуски в речниците.  
3. **Translation workflow:** въведете check-list (или CLI) за валидиране дали всички ключове са преведени за всеки език; помислете за JSON schema или TS типове.  
4. **Audit remaining UI:** каталог/курсове/tasks панели все още имат твърди BG текстове – планирайте отделно story за пълна локализация на тези екрани.

## 6. Close-out
- Epic status: ✅ Done (functional scope покрит, cookie persistence shipped).  
- Hand-off: документацията + този ретро са качени в repo; следващи мултиезични stories могат да се стъпят на foundation-а без нов архитектурен дизайн.
