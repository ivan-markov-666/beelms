import type { SupportedLang } from "./config";

type DomainMessages = {
  nav: {
    wiki: string;
    practice: string;
    practiceApi: string;
    login: string;
    register: string;
    admin: string;
  };
  auth: Record<string, string>;
  common: Record<string, string>;
  wiki: Record<string, string>;
};

export type Messages = {
  [L in SupportedLang]: DomainMessages;
};

export const messages: Messages = {
  bg: {
    nav: {
      wiki: "Wiki",
      practice: "Практика",
      practiceApi: "API Demo",
      login: "Вход",
      register: "Регистрация",
      admin: "Admin",
    },
    auth: {
      loginTitle: "Вход",
      loginSubtitle: "Въведете вашите данни за достъп.",
      loginEmailLabel: "Имейл",
      loginPasswordLabel: "Парола",
      loginSubmit: "Вход",
      loginSubmitLoading: "Вписване...",
      loginForgotLink: "Забравена парола?",
      loginRegisterLink: "Нямате акаунт?",
      loginRememberMeLabel: "Remember me",
      loginCaptchaPlaceholder:
        "CAPTCHA / reCAPTCHA (placeholder) – в реалната система се показва само след няколко последователни неуспешни опита за вход.",
      loginErrorEmailRequired: "Моля, въведете имейл.",
      loginErrorEmailInvalid: "Моля, въведете валиден имейл адрес.",
      loginErrorPasswordRequired: "Моля, въведете парола.",
      loginErrorInvalidCredentials: "Невалидни данни за вход.",
      loginErrorGeneric:
        "Входът не успя. Моля, опитайте отново по-късно.",
      loginErrorNetwork:
        "Възникна грешка при връзката със сървъра.",
      loginLoading: "Зареждане...",
      registerTitle: "Регистрация",
      registerSubtitle: "Създайте нов акаунт.",
      registerEmailLabel: "Имейл",
      registerPasswordLabel: "Парола",
      registerPasswordHint: "Минимум 8 символа",
      registerConfirmPasswordLabel: "Потвърди паролата",
      registerTermsPrefix: "Съгласен съм с ",
      registerTermsAnd: " и ",
      registerTermsSuffix: "",
      registerTermsLabel:
        "Съгласен съм с Условията за ползване и Политиката за поверителност.",
      registerCaptchaLabel:
        "Не съм робот (placeholder за CAPTCHA интеграция).",
      registerCaptchaPlaceholder:
        "CAPTCHA / reCAPTCHA (placeholder за защита от ботове при регистрация)",
      registerSubmit: "Регистрация",
      registerSubmitLoading: "Изпращане...",
      registerHasAccount: "Вече имате акаунт?",
      registerLoginLink: "Вход",
      registerErrorEmailRequired: "Моля, въведете имейл.",
      registerErrorEmailInvalid: "Моля, въведете валиден имейл адрес.",
      registerErrorPasswordRequired: "Моля, въведете парола.",
      registerErrorPasswordTooShort:
        "Паролата трябва да е поне 8 символа.",
      registerErrorConfirmPasswordRequired:
        "Моля, потвърдете паролата.",
      registerErrorPasswordsMismatch: "Паролите не съвпадат.",
      registerErrorTermsRequired: "Необходимо е да приемете условията.",
      registerErrorCaptchaRequired:
        "Моля, потвърдете, че не сте робот.",
      registerErrorDuplicateEmail: "Този имейл вече е регистриран.",
      registerErrorInvalidData:
        "Данните не са валидни. Моля, проверете формата и опитайте отново.",
      registerErrorGeneric:
        "Регистрацията не успя. Моля, опитайте отново по-късно.",
      registerErrorNetwork:
        "Възникна грешка при връзката със сървъра.",
      registerSuccess:
        "Регистрацията беше успешна. Моля, проверете имейла си и потвърдете адреса чрез получен линк. След това можете да влезете в акаунта си от страницата за вход.",
      registerLoading: "Зареждане...",
      forgotTitle: "Забравена парола",
      forgotSubtitle:
        "Въведете вашия email адрес и ще ви изпратим линк за смяна на паролата.",
      forgotEmailLabel: "Email адрес",
      forgotCaptchaLabel:
        "Не съм робот (placeholder за CAPTCHA интеграция).",
      forgotSubmit: "Изпрати линк за смяна",
      forgotSubmitLoading: "Изпращане...",
      forgotHasPassword: "Спомнихте си паролата?",
      forgotLoginLink: "Върни се към вход",
      forgotErrorEmailRequired: "Моля, въведете имейл.",
      forgotErrorEmailInvalid: "Моля, въведете валиден имейл адрес.",
      forgotErrorCaptchaRequired:
        "Моля, потвърдете, че не сте робот.",
      forgotErrorInvalidData:
        "Данните не са валидни. Моля, проверете формата и опитайте отново.",
      forgotErrorGeneric:
        "Заявката за забравена парола не успя. Моля, опитайте отново по-късно.",
      forgotErrorNetwork:
        "Възникна грешка при връзката със сървъра.",
      forgotSuccess:
        "Ако има акаунт с този имейл, ще изпратим инструкции за смяна на паролата.",
      forgotResetLinkInfo:
        "Линкът за смяна на паролата е валиден 24 часа",
      forgotCaptchaPlaceholder:
        "CAPTCHA / reCAPTCHA (placeholder за защита от ботове при заявка за смяна на парола)",
      resetTitle: "Смяна на парола",
      resetSubtitle: "Въведете вашата нова парола.",
      resetInfoMessage:
        "Тази страница е достъпна чрез защитен линк, изпратен на вашия email адрес.",
      resetNewPasswordLabel: "Нова парола",
      resetConfirmNewPasswordLabel: "Потвърди новата парола",
      resetSubmit: "Смени паролата",
      resetSubmitLoading: "Смяна...",
      resetHasPassword: "Вече помните паролата си?",
      resetBackToLogin: "Върни се към вход",
      resetSuccessLoginCta: "Към страницата за вход",
      resetErrorNewPasswordRequired: "Моля, въведете нова парола.",
      resetErrorNewPasswordTooShort:
        "Паролата трябва да е поне 8 символа.",
      resetErrorConfirmPasswordRequired:
        "Моля, потвърдете новата парола.",
      resetErrorPasswordsMismatch: "Паролите не съвпадат.",
      resetErrorInvalidOrExpiredLink:
        "Линкът за смяна на паролата е невалиден или е изтекъл. Моля, заявете нов линк от екрана 'Забравена парола'.",
      resetErrorGeneric:
        "Смяната на паролата не успя. Моля, опитайте отново по-късно.",
      resetErrorNetwork:
        "Възникна грешка при връзката със сървъра.",
      resetSuccess:
        "Паролата беше сменена успешно. Ще ви пренасочим към страницата за вход...",
      resetPasswordRequirementsTitle: "Изисквания за парола:",
      resetPasswordRequirementsItemMinLength: "Минимум 8 символа",
      resetPasswordRequirementsItemRecommendation:
        "Препоръчва се използване на букви, цифри и символи",
      resetGoToForgotCta: "Към екрана „Забравена парола“",
      accountDeletedTitle: "Акаунтът ви беше закрит и изтрит",
      accountDeletedDescription:
        "Вашият акаунт е закрит и личните ви данни са маркирани за изтриване в съответствие с нашите правила за защита на данните и GDPR.",
      accountDeletedHint:
        "Няма да имате достъп до профила си. Ако в бъдеще решите отново да ползвате QA4Free, ще е необходима нова регистрация.",
      accountDeletedPrimaryCta: "Към началната страница",
      accountDeletedSecondaryCta: "Към Wiki статиите",
    },
    common: {
      adminUsersTitle: "Admin Users",
      adminUsersSubtitle:
        "Списък с потребители и статус на акаунта (active/inactive).",
      adminUsersSearchPlaceholder: "Търсене по email...",
      adminUsersSearchButton: "Търси",
      adminUsersLoading: "Зареждане на списъка...",
      adminUsersError:
        "Възникна грешка при зареждане на списъка с потребители.",
      adminUsersNoData: "Няма потребители за показване.",
      adminUsersToggleError:
        "Неуспешно обновяване на статуса на потребителя. Моля, опитайте отново.",
      adminUsersNoToken:
        "Липсва достъп до Admin API. Моля, влезте отново като администратор.",
      adminUsersColEmail: "Email",
      adminUsersColRole: "Role",
      adminUsersColActive: "Active",
      adminUsersColCreated: "Created",
      adminUsersStatusActive: "Active",
      adminUsersStatusInactive: "Inactive",
      adminUsersStatusUpdating: "Обновяване...",
      adminDashboardTitle: "Админ табло",
      adminDashboardSubtitle:
        "Системен преглед и инструменти за управление.",
      adminDashboardMetricsTitle: "Общ брой потребители",
      adminDashboardMetricsLoading: "Зареждане на метриките...",
      adminDashboardMetricsError: "Неуспешно зареждане на метрики.",
      adminDashboardLinksTitle: "Админ секции",
      adminDashboardGoToWiki: "Към Admin Wiki",
      adminDashboardGoToUsers: "Към Admin Users",
      adminDashboardBreadcrumbHome: "Начало",
      adminDashboardTabDashboard: "Табло",
      adminDashboardTabWiki: "Wiki",
      adminDashboardTabUsers: "Потребители",
      adminDashboardTabMetrics: "Метрики",
      adminDashboardCardUsersTitle: "Регистрирани потребители",
      adminDashboardCardUsersTrend: "+12% спрямо миналия месец",
      adminDashboardCardUsersTrendSuffix: "спрямо миналия месец",
      adminDashboardCardUsersTrendUnknown:
        "Няма достатъчно данни за сравнение с миналия месец",
      adminDashboardCardUsersTrendHelp:
        "Сравнение спрямо общия брой потребители към края на предходния календарен месец.",
      adminMetricsTitle: "Преглед на метриките",
      adminMetricsSubtitle:
        "Базови системни метрики за администратори (MVP обхват)",
      adminMetricsUsersCardHelper: "Примерна стойност за UI тестване",
      adminDashboardCardArticlesTitle: "Wiki статии",
      adminDashboardCardArticlesSubtitle:
        "Преглед на активни и чернови статии.",
      adminDashboardQuickActionsTitle: "Бързи действия",
      adminDashboardQuickActionsManageWiki: "Управление на Wiki",
      adminDashboardQuickActionsManageUsers: "Управление на потребители",
      adminDashboardQuickActionsViewMetrics: "Виж метриките",
      adminDashboardRecentActivityTitle: "Последна активност",
      adminDashboardRecentItem1Prefix: "Създадена е нова статия:",
      adminDashboardRecentItem1Detail: "Performance Testing with JMeter",
      adminDashboardRecentItem1Time: "Преди 2 часа",
      adminDashboardRecentItem2Prefix: "Регистриран е нов потребител:",
      adminDashboardRecentItem2Detail: "[email protected]",
      adminDashboardRecentItem2Time: "Преди 5 часа",
      adminDashboardRecentItem3Prefix: "Актуализирана статия:",
      adminDashboardRecentItem3Detail: "Selenium WebDriver Best Practices",
      adminDashboardRecentItem3Time: "Преди 1 ден",
      adminDashboardRecentItem4Prefix: "Деактивиран е потребител:",
      adminDashboardRecentItem4Detail: "[email protected]",
      adminDashboardRecentItem4Time: "Преди 2 дни",
      legalFooterDisclaimer:
        "QA4Free е учебна платформа. Вижте страниците за Условия за ползване и Политика за поверителност за повече детайли.",
      legalFooterPrivacyLink: "Политика за поверителност (Privacy/GDPR)",
      legalFooterTermsLink: "Условия за ползване",
      legalPrivacyTitle: "Политика за поверителност и GDPR",
      legalPrivacyIntro:
        "Тази страница обобщава какви лични данни обработва QA4Free и за какви цели, в съответствие с GDPR.",
      legalTermsTitle: "Условия за ползване",
      legalTermsIntro:
        "Тази страница описва основните правила за коректно и етично използване на QA4Free като учебна платформа.",
      footerAboutLink: "About",
      footerContactLink: "Contact",
    },
    wiki: {
      articleShareButton: "Сподели",
      articlePrintButton: "Принтирай",
      articleShareSuccess: "Споделено успешно.",
      articleShareClipboard: "Линкът е копиран в клипборда.",
      articleShareError:
        "Не успяхме да споделим линка. Опитайте ръчно.",
    },
  },
  en: {
    nav: {
      wiki: "Wiki",
      practice: "Practice",
      practiceApi: "API Demo",
      login: "Sign in",
      register: "Register",
      admin: "Admin",
    },
    auth: {
      loginTitle: "Sign in",
      loginSubtitle: "Enter your login details.",
      loginEmailLabel: "Email",
      loginPasswordLabel: "Password",
      loginSubmit: "Sign in",
      loginSubmitLoading: "Signing in...",
      loginForgotLink: "Forgot password?",
      loginRegisterLink: "Don't have an account?",
      loginRememberMeLabel: "Remember me",
      loginCaptchaPlaceholder:
        "CAPTCHA / reCAPTCHA (placeholder) – in the real system it appears only after several consecutive failed login attempts.",
      loginErrorEmailRequired: "Please enter your email.",
      loginErrorEmailInvalid: "Please enter a valid email address.",
      loginErrorPasswordRequired: "Please enter your password.",
      loginErrorInvalidCredentials: "Invalid login details.",
      loginErrorGeneric: "Sign in failed. Please try again later.",
      loginErrorNetwork:
        "A network error occurred while contacting the server.",
      loginLoading: "Loading...",
      registerTitle: "Create account",
      registerSubtitle:
        "Create your free QA4Free account to start practicing.",
      registerEmailLabel: "Email",
      registerPasswordLabel: "Password",
      registerPasswordHint: "Minimum 8 characters",
      registerConfirmPasswordLabel: "Confirm password",
      registerTermsPrefix: "I agree to the ",
      registerTermsAnd: " and the ",
      registerTermsSuffix: ".",
      registerTermsLabel:
        "I agree to the Terms of Use and the Privacy Policy.",
      registerCaptchaLabel:
        "I'm not a robot (placeholder for CAPTCHA integration).",
      registerCaptchaPlaceholder:
        "CAPTCHA / reCAPTCHA (placeholder for bot protection during registration)",
      registerSubmit: "Register",
      registerSubmitLoading: "Submitting...",
      registerHasAccount: "Already have an account?",
      registerLoginLink: "Sign in",
      registerErrorEmailRequired: "Please enter your email.",
      registerErrorEmailInvalid: "Please enter a valid email address.",
      registerErrorPasswordRequired: "Please enter a password.",
      registerErrorPasswordTooShort:
        "Password must be at least 8 characters long.",
      registerErrorConfirmPasswordRequired:
        "Please confirm your password.",
      registerErrorPasswordsMismatch: "Passwords do not match.",
      registerErrorTermsRequired: "You must accept the terms.",
      registerErrorCaptchaRequired:
        "Please confirm that you are not a robot.",
      registerErrorDuplicateEmail: "This email is already registered.",
      registerErrorInvalidData:
        "The data is not valid. Please review the form and try again.",
      registerErrorGeneric:
        "Registration failed. Please try again later.",
      registerErrorNetwork:
        "A network error occurred while contacting the server.",
      registerSuccess:
        "Registration was successful. Please check your email and confirm your address using the link we sent you. After that you can sign in from the login page.",
      registerLoading: "Loading...",
      forgotTitle: "Forgot password",
      forgotSubtitle:
        "Enter your email address to request a password reset.",
      forgotEmailLabel: "Email",
      forgotCaptchaLabel:
        "I'm not a robot (placeholder for CAPTCHA integration).",
      forgotSubmit: "Send reset link",
      forgotSubmitLoading: "Sending...",
      forgotHasPassword: "Remembered your password?",
      forgotLoginLink: "Back to sign in",
      forgotErrorEmailRequired: "Please enter your email.",
      forgotErrorEmailInvalid: "Please enter a valid email address.",
      forgotErrorCaptchaRequired:
        "Please confirm that you are not a robot.",
      forgotErrorInvalidData:
        "The data is not valid. Please review the form and try again.",
      forgotErrorGeneric:
        "Password reset request failed. Please try again later.",
      forgotErrorNetwork:
        "A network error occurred while contacting the server.",
      forgotSuccess:
        "If there is an account with this email, we will send instructions to reset your password.",
      forgotResetLinkInfo:
        "The password reset link is valid for 24 hours.",
      forgotCaptchaPlaceholder:
        "CAPTCHA / reCAPTCHA (placeholder for bot protection when requesting a password reset)",
      resetTitle: "Change password",
      resetSubtitle: "Enter your new password.",
      resetInfoMessage:
        "This page is accessible via a secure link sent to your email address.",
      resetNewPasswordLabel: "New password",
      resetConfirmNewPasswordLabel: "Confirm new password",
      resetSubmit: "Change password",
      resetSubmitLoading: "Changing...",
      resetHasPassword: "Already remember your password?",
      resetBackToLogin: "Back to sign in",
      resetSuccessLoginCta: "Go to login page",
      resetErrorNewPasswordRequired: "Please enter a new password.",
      resetErrorNewPasswordTooShort:
        "Password must be at least 8 characters long.",
      resetErrorConfirmPasswordRequired:
        "Please confirm your new password.",
      resetErrorPasswordsMismatch: "Passwords do not match.",
      resetErrorInvalidOrExpiredLink:
        'The password reset link is invalid or has expired. Please request a new link from the "Forgot password" screen.',
      resetErrorGeneric:
        "Password change failed. Please try again later.",
      resetErrorNetwork:
        "A network error occurred while contacting the server.",
      resetSuccess:
        "Your password has been changed successfully. We will redirect you to the login page...",
      resetPasswordRequirementsTitle: "Password requirements:",
      resetPasswordRequirementsItemMinLength: "Minimum 8 characters",
      resetPasswordRequirementsItemRecommendation:
        "We recommend using letters, numbers and symbols.",
      resetGoToForgotCta:
        'Go to the "Forgot password" screen',
      accountDeletedTitle: "Your account has been closed and deleted",
      accountDeletedDescription:
        "Your account has been closed and your personal data has been marked for deletion in accordance with our data protection rules and GDPR.",
      accountDeletedHint:
        "You will no longer have access to your profile. If you decide to use QA4Free again in the future, you will need to create a new account.",
      accountDeletedPrimaryCta: "Go to home page",
      accountDeletedSecondaryCta: "Go to Wiki articles",
    },
    common: {
      adminUsersTitle: "Admin Users",
      adminUsersSubtitle:
        "List of users and account status (active/inactive).",
      adminUsersSearchPlaceholder: "Search by email...",
      adminUsersSearchButton: "Search",
      adminUsersLoading: "Loading users...",
      adminUsersError:
        "An error occurred while loading the users list.",
      adminUsersNoData: "No users to display.",
      adminUsersToggleError:
        "Failed to update user status. Please try again.",
      adminUsersNoToken:
        "No access to the Admin API. Please sign in again as an administrator.",
      adminUsersColEmail: "Email",
      adminUsersColRole: "Role",
      adminUsersColActive: "Active",
      adminUsersColCreated: "Created",
      adminUsersStatusActive: "Active",
      adminUsersStatusInactive: "Inactive",
      adminUsersStatusUpdating: "Updating...",
      adminDashboardTitle: "Admin Dashboard",
      adminDashboardSubtitle: "System overview and management tools",
      adminDashboardMetricsTitle: "Total users",
      adminDashboardMetricsLoading: "Loading metrics...",
      adminDashboardMetricsError: "Failed to load metrics.",
      adminDashboardLinksTitle: "Admin sections",
      adminDashboardGoToWiki: "Go to Admin Wiki",
      adminDashboardGoToUsers: "Go to Admin Users",
      adminDashboardBreadcrumbHome: "Home",
      adminDashboardTabDashboard: "Dashboard",
      adminDashboardTabWiki: "Wiki",
      adminDashboardTabUsers: "Users",
      adminDashboardTabMetrics: "Metrics",
      adminDashboardCardUsersTitle: "Registered Users",
      adminDashboardCardUsersTrend: "+12% from last month",
      adminDashboardCardUsersTrendSuffix: "from last month",
      adminDashboardCardUsersTrendUnknown:
        "No sufficient data to compare with last month",
      adminDashboardCardUsersTrendHelp:
        "Compared to the total number of users at the end of the previous calendar month.",
      adminMetricsTitle: "Metrics Overview",
      adminMetricsSubtitle:
        "Basic system metrics for administrators (MVP scope)",
      adminMetricsUsersCardHelper: "Example value for UI testing",
      adminDashboardCardArticlesTitle: "Wiki Articles",
      adminDashboardCardArticlesSubtitle:
        "Overview of active and draft articles.",
      adminDashboardQuickActionsTitle: "Quick Actions",
      adminDashboardQuickActionsManageWiki: "Manage Wiki",
      adminDashboardQuickActionsManageUsers: "Manage Users",
      adminDashboardQuickActionsViewMetrics: "View Metrics",
      adminDashboardRecentActivityTitle: "Recent Activity",
      adminDashboardRecentItem1Prefix: "New article created:",
      adminDashboardRecentItem1Detail: "Performance Testing with JMeter",
      adminDashboardRecentItem1Time: "2 hours ago",
      adminDashboardRecentItem2Prefix: "User registered:",
      adminDashboardRecentItem2Detail: "[email protected]",
      adminDashboardRecentItem2Time: "5 hours ago",
      adminDashboardRecentItem3Prefix: "Article updated:",
      adminDashboardRecentItem3Detail: "Selenium WebDriver Best Practices",
      adminDashboardRecentItem3Time: "1 day ago",
      adminDashboardRecentItem4Prefix: "User deactivated:",
      adminDashboardRecentItem4Detail: "[email protected]",
      adminDashboardRecentItem4Time: "2 days ago",
      legalFooterDisclaimer:
        "QA4Free is a learning platform. See the Terms of Use and Privacy Policy pages for more details.",
      legalFooterPrivacyLink: "Privacy Policy (GDPR)",
      legalFooterTermsLink: "Terms of Use",
      legalPrivacyTitle: "Privacy Policy and GDPR",
      legalPrivacyIntro:
        "This page summarizes what personal data QA4Free processes and for what purposes, in line with GDPR.",
      legalTermsTitle: "Terms of Use",
      legalTermsIntro:
        "This page outlines the key rules for fair and ethical use of QA4Free as a learning platform.",
      footerAboutLink: "About",
      footerContactLink: "Contact",
    },
    wiki: {
      articleShareButton: "Share",
      articlePrintButton: "Print",
      articleShareSuccess: "Shared successfully.",
      articleShareClipboard: "Link copied to clipboard.",
      articleShareError: "We couldn't share the link. Please share it manually.",
    },
  },
  de: {
    nav: {
      wiki: "Wiki",
      practice: "Praxis",
      practiceApi: "API Demo",
      login: "Anmelden",
      register: "Registrieren",
      admin: "Admin",
    },
    auth: {
      loginTitle: "Anmelden",
      loginSubtitle: "Gib deine Zugangsdaten ein.",
      loginEmailLabel: "E-Mail",
      loginPasswordLabel: "Passwort",
      loginSubmit: "Anmelden",
      loginSubmitLoading: "Anmeldung läuft...",
      loginForgotLink: "Passwort vergessen?",
      loginRegisterLink: "Noch kein Konto?",
      loginRememberMeLabel: "Angemeldet bleiben",
      loginCaptchaPlaceholder:
        "CAPTCHA / reCAPTCHA (Platzhalter) – im echten System erscheint es nur nach mehreren fehlgeschlagenen Anmeldeversuchen.",
      loginErrorEmailRequired: "Bitte gib deine E-Mail-Adresse ein.",
      loginErrorEmailInvalid: "Bitte gib eine gültige E-Mail-Adresse ein.",
      loginErrorPasswordRequired: "Bitte gib dein Passwort ein.",
      loginErrorInvalidCredentials: "Ungültige Anmeldedaten.",
      loginErrorGeneric: "Anmeldung fehlgeschlagen. Bitte versuche es später erneut.",
      loginErrorNetwork: "Beim Kontakt mit dem Server ist ein Netzwerkfehler aufgetreten.",
      loginLoading: "Laden...",
      registerTitle: "Konto erstellen",
      registerSubtitle: "Erstelle dein kostenloses QA4Free-Konto, um mit dem Üben zu beginnen.",
      registerEmailLabel: "E-Mail",
      registerPasswordLabel: "Passwort",
      registerPasswordHint: "Mindestens 8 Zeichen",
      registerConfirmPasswordLabel: "Passwort bestätigen",
      registerTermsPrefix: "Ich stimme den ",
      registerTermsAnd: " und der ",
      registerTermsSuffix: " zu.",
      registerTermsLabel: "Ich stimme den Nutzungsbedingungen und der Datenschutzrichtlinie zu.",
      registerCaptchaLabel: "Ich bin kein Roboter (Platzhalter für CAPTCHA-Integration).",
      registerCaptchaPlaceholder:
        "CAPTCHA / reCAPTCHA (Platzhalter zum Schutz vor Bots bei der Registrierung)",
      registerSubmit: "Registrieren",
      registerSubmitLoading: "Senden...",
      registerHasAccount: "Du hast bereits ein Konto?",
      registerLoginLink: "Anmelden",
      registerErrorEmailRequired: "Bitte gib deine E-Mail-Adresse ein.",
      registerErrorEmailInvalid: "Bitte gib eine gültige E-Mail-Adresse ein.",
      registerErrorPasswordRequired: "Bitte gib ein Passwort ein.",
      registerErrorPasswordTooShort: "Das Passwort muss mindestens 8 Zeichen lang sein.",
      registerErrorConfirmPasswordRequired: "Bitte bestätige dein Passwort.",
      registerErrorPasswordsMismatch: "Die Passwörter stimmen nicht überein.",
      registerErrorTermsRequired: "Du musst die Bedingungen akzeptieren.",
      registerErrorCaptchaRequired: "Bitte bestätige, dass du kein Roboter bist.",
      registerErrorDuplicateEmail: "Diese E-Mail-Adresse ist bereits registriert.",
      registerErrorInvalidData: "Die Daten sind nicht gültig. Bitte überprüfe das Formular und versuche es erneut.",
      registerErrorGeneric: "Registrierung fehlgeschlagen. Bitte versuche es später erneut.",
      registerErrorNetwork: "Beim Kontakt mit dem Server ist ein Netzwerkfehler aufgetreten.",
      registerSuccess: "Die Registrierung war erfolgreich. Bitte überprüfe deine E-Mail und bestätige deine Adresse über den Link, den wir dir geschickt haben. Danach kannst du dich über die Login-Seite anmelden.",
      registerLoading: "Laden...",
      forgotTitle: "Passwort vergessen",
      forgotSubtitle: "Gib deine E-Mail-Adresse ein, um eine Zurücksetzung des Passworts anzufordern.",
      forgotEmailLabel: "E-Mail",
      forgotCaptchaLabel: "Ich bin kein Roboter (Platzhalter für CAPTCHA-Integration).",
      forgotSubmit: "Link zum Zurücksetzen senden",
      forgotSubmitLoading: "Senden...",
      forgotHasPassword: "Du erinnerst dich wieder an dein Passwort?",
      forgotLoginLink: "Zur Anmeldung zurückkehren",
      forgotErrorEmailRequired: "Bitte gib deine E-Mail-Adresse ein.",
      forgotErrorEmailInvalid: "Bitte gib eine gültige E-Mail-Adresse ein.",
      forgotErrorCaptchaRequired: "Bitte bestätige, dass du kein Roboter bist.",
      forgotErrorInvalidData: "Die Daten sind nicht gültig. Bitte überprüfe das Formular und versuche es erneut.",
      forgotErrorGeneric: "Die Anfrage zum Zurücksetzen des Passworts ist fehlgeschlagen. Bitte versuche es später erneut.",
      forgotErrorNetwork: "Beim Kontakt mit dem Server ist ein Netzwerkfehler aufgetreten.",
      forgotSuccess: "Falls ein Konto mit dieser E-Mail-Adresse existiert, senden wir dir Anweisungen zum Zurücksetzen des Passworts.",
      forgotResetLinkInfo:
        "Der Link zum Zurücksetzen des Passworts ist 24 Stunden lang gültig.",
      forgotCaptchaPlaceholder:
        "CAPTCHA / reCAPTCHA (Platzhalter zum Schutz vor Bots bei der Anfrage zum Zurücksetzen des Passworts)",
      resetTitle: "Passwort ändern",
      resetSubtitle: "Gib dein neues Passwort ein.",
      resetInfoMessage:
        "Diese Seite ist über einen sicheren Link erreichbar, der an deine E-Mail-Adresse gesendet wurde.",
      resetNewPasswordLabel: "Neues Passwort",
      resetConfirmNewPasswordLabel: "Neues Passwort bestätigen",
      resetSubmit: "Passwort ändern",
      resetSubmitLoading: "Änderung läuft...",
      resetHasPassword: "Du erinnerst dich wieder an dein Passwort?",
      resetBackToLogin: "Zur Anmeldung zurückkehren",
      resetSuccessLoginCta: "Zur Login-Seite",
      resetErrorNewPasswordRequired: "Bitte gib ein neues Passwort ein.",
      resetErrorNewPasswordTooShort: "Das Passwort muss mindestens 8 Zeichen lang sein.",
      resetErrorConfirmPasswordRequired: "Bitte bestätige dein neues Passwort.",
      resetErrorPasswordsMismatch: "Die Passwörter stimmen nicht überein.",
      resetErrorInvalidOrExpiredLink: "Der Link zum Ändern des Passworts ist ungültig oder abgelaufen. Bitte fordere über den Bildschirm \"Passwort vergessen\" einen neuen Link an.",
      resetErrorGeneric: "Die Änderung des Passworts ist fehlgeschlagen. Bitte versuche es später erneut.",
      resetErrorNetwork: "Beim Kontakt mit dem Server ist ein Netzwerkfehler aufgetreten.",
      resetSuccess: "Dein Passwort wurde erfolgreich geändert. Wir leiten dich gleich zur Login-Seite weiter...",
      resetPasswordRequirementsTitle: "Passwortanforderungen:",
      resetPasswordRequirementsItemMinLength: "Mindestens 8 Zeichen",
      resetPasswordRequirementsItemRecommendation:
        "Es wird empfohlen, Buchstaben, Zahlen und Sonderzeichen zu verwenden.",
      resetGoToForgotCta: "Zum Bildschirm \"Passwort vergessen\"",
      accountDeletedTitle: "Dein Konto wurde geschlossen und gelöscht",
      accountDeletedDescription:
        "Dein Konto wurde geschlossen und deine personenbezogenen Daten wurden entsprechend unseren Datenschutzregeln und der DSGVO zur Löschung markiert.",
      accountDeletedHint:
        "Du wirst keinen Zugriff mehr auf dein Profil haben. Wenn du QA4Free in Zukunft erneut nutzen möchtest, musst du ein neues Konto registrieren.",
      accountDeletedPrimaryCta: "Zur Startseite",
      accountDeletedSecondaryCta: "Zu den Wiki-Artikeln",
    },
    common: {
      adminDashboardTitle: "Admin-Dashboard",
      adminDashboardSubtitle:
        "Systemübersicht und Administrationswerkzeuge.",
      adminDashboardMetricsTitle: "Gesamtzahl der Benutzer",
      adminDashboardMetricsLoading: "Lade Metriken...",
      adminDashboardMetricsError:
        "Metriken konnten nicht geladen werden.",
      adminDashboardLinksTitle: "Admin-Bereiche",
      adminDashboardGoToWiki: "Zum Admin-Wiki",
      adminDashboardGoToUsers: "Zu Admin-Users",
      adminDashboardBreadcrumbHome: "Startseite",
      adminDashboardTabDashboard: "Dashboard",
      adminDashboardTabWiki: "Wiki",
      adminDashboardTabUsers: "Benutzer",
      adminDashboardTabMetrics: "Metriken",
      adminDashboardCardUsersTitle: "Registrierte Benutzer",
      adminDashboardCardUsersTrend: "+12 % im Vergleich zum Vormonat",
      adminDashboardCardUsersTrendSuffix: "im Vergleich zum Vormonat",
      adminDashboardCardUsersTrendUnknown:
        "Keine ausreichenden Daten zum Vergleich mit dem Vormonat",
      adminDashboardCardUsersTrendHelp:
        "Verglichen mit der Gesamtzahl der Benutzer am Ende des vorherigen Kalendermonats.",
      adminMetricsTitle: "Metrics Overview",
      adminMetricsSubtitle:
        "Basic system metrics for administrators (MVP scope)",
      adminMetricsUsersCardHelper: "Beispielwert für UI-Tests",
      adminDashboardCardArticlesTitle: "Wiki-Artikel",
      adminDashboardCardArticlesSubtitle:
        "Übersicht über aktive und Entwurfsartikel.",
      adminDashboardQuickActionsTitle: "Schnellaktionen",
      adminDashboardQuickActionsManageWiki: "Wiki verwalten",
      adminDashboardQuickActionsManageUsers: "Benutzer verwalten",
      adminDashboardQuickActionsViewMetrics: "Metriken anzeigen",
      adminDashboardRecentActivityTitle: "Letzte Aktivitäten",
      adminDashboardRecentItem1Prefix: "Neuer Artikel erstellt:",
      adminDashboardRecentItem1Detail: "Performance Testing with JMeter",
      adminDashboardRecentItem1Time: "Vor 2 Stunden",
      adminDashboardRecentItem2Prefix: "Benutzer registriert:",
      adminDashboardRecentItem2Detail: "[email protected]",
      adminDashboardRecentItem2Time: "Vor 5 Stunden",
      adminDashboardRecentItem3Prefix: "Artikel aktualisiert:",
      adminDashboardRecentItem3Detail:
        "Selenium WebDriver Best Practices",
      adminDashboardRecentItem3Time: "Vor 1 Tag",
      adminDashboardRecentItem4Prefix: "Benutzer deaktiviert:",
      adminDashboardRecentItem4Detail: "[email protected]",
      adminDashboardRecentItem4Time: "Vor 2 Tagen",
      footerAboutLink: "Über",
      footerContactLink: "Kontakt",
    },
    wiki: {
      articleShareButton: "Teilen",
      articlePrintButton: "Drucken",
      articleShareSuccess: "Erfolgreich geteilt.",
      articleShareClipboard: "Link wurde in die Zwischenablage kopiert.",
      articleShareError: "Der Link konnte nicht geteilt werden. Bitte teilen Sie ihn manuell.",
    },
  },
}
