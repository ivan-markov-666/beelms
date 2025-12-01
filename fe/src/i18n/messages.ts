import type { SupportedLang } from "./config";

type DomainMessages = {
  nav: {
    wiki: string;
    practice: string;
    practiceApi: string;
    login: string;
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
      admin: "Admin",
    },
    auth: {
      loginTitle: "Вход",
      loginSubtitle: "Впишете се в своя акаунт в QA4Free.",
      loginEmailLabel: "Имейл",
      loginPasswordLabel: "Парола",
      loginSubmit: "Вход",
      loginSubmitLoading: "Вписване...",
      loginForgotLink: "Забравена парола?",
      loginRegisterLink: "Нямате акаунт?",
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
      registerSubtitle: "Създайте своя безплатен акаунт в QA4Free.",
      registerEmailLabel: "Имейл",
      registerPasswordLabel: "Парола",
      registerConfirmPasswordLabel: "Потвърди паролата",
      registerTermsLabel:
        "Съгласен съм с Условията за ползване и Политиката за поверителност.",
      registerCaptchaLabel:
        "Не съм робот (placeholder за CAPTCHA интеграция).",
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
        "Въведете своя имейл, за да заявите смяна на паролата.",
      forgotEmailLabel: "Имейл",
      forgotCaptchaLabel:
        "Не съм робот (placeholder за CAPTCHA интеграция).",
      forgotSubmit: "Изпрати линк за ресет",
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
      resetTitle: "Смяна на парола",
      resetSubtitle: "Въведете новата си парола (минимум 8 символа).",
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
      resetGoToForgotCta: "Към екрана „Забравена парола“",
    },
    common: {},
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
      admin: "Admin",
    },
    auth: {
      loginTitle: "Sign in",
      loginSubtitle: "Sign in to your QA4Free account.",
      loginEmailLabel: "Email",
      loginPasswordLabel: "Password",
      loginSubmit: "Sign in",
      loginSubmitLoading: "Signing in...",
      loginForgotLink: "Forgot password?",
      loginRegisterLink: "Don't have an account?",
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
      registerConfirmPasswordLabel: "Confirm password",
      registerTermsLabel:
        "I agree to the Terms of Use and the Privacy Policy.",
      registerCaptchaLabel:
        "I'm not a robot (placeholder for CAPTCHA integration).",
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
      resetTitle: "Change password",
      resetSubtitle: "Enter your new password (minimum 8 characters).",
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
      resetGoToForgotCta:
        'Go to the "Forgot password" screen',
    },
    common: {},
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
      admin: "Admin",
    },
    auth: {
      loginTitle: "Anmelden",
      loginSubtitle: "Melde dich bei deinem QA4Free-Konto an.",
      loginEmailLabel: "E-Mail",
      loginPasswordLabel: "Passwort",
      loginSubmit: "Anmelden",
      loginSubmitLoading: "Anmeldung läuft...",
      loginForgotLink: "Passwort vergessen?",
      loginRegisterLink: "Noch kein Konto?",
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
      registerConfirmPasswordLabel: "Passwort bestätigen",
      registerTermsLabel: "Ich stimme den Nutzungsbedingungen und der Datenschutzrichtlinie zu.",
      registerCaptchaLabel: "Ich bin kein Roboter (Platzhalter für CAPTCHA-Integration).",
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
      resetTitle: "Passwort ändern",
      resetSubtitle: "Gib dein neues Passwort ein (mindestens 8 Zeichen).",
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
      resetGoToForgotCta: "Zum Bildschirm \"Passwort vergessen\"",
    },
    common: {},
    wiki: {
      articleShareButton: "Teilen",
      articlePrintButton: "Drucken",
      articleShareSuccess: "Erfolgreich geteilt.",
      articleShareClipboard: "Link wurde in die Zwischenablage kopiert.",
      articleShareError: "Der Link konnte nicht geteilt werden. Bitte teilen Sie ihn manuell.",
    },
  },
}
