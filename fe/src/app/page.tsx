import Link from "next/link";

export default function Home() {
  return (
    <main className="bg-gray-50 min-h-screen">
      <section className="bg-gradient-to-br from-green-50 to-blue-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              BeeLMS – учебна платформа с Wiki и акаунти
            </h1>
            <p className="text-lg text-gray-700 mb-8">
              BeeLMS предоставя публично Wiki съдържание и базови потребителски
              акаунти (регистрация, вход и профил), плюс админ панел за
              управление.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/wiki"
                className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Отвори Wiki
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-green-700 border border-green-600 rounded-lg font-semibold hover:bg-green-50 transition"
              >
                Регистрация
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Вече имаш акаунт? →{" "}
              <Link
                href="/auth/login"
                className="text-green-700 font-medium hover:text-green-800"
              >
                Вход
              </Link>
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 lg:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Какво включва MVP версията
            </h2>
            <dl className="space-y-4 text-sm text-gray-700">
              <div className="flex items-start">
                <dt className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 text-green-700 font-bold mr-3">
                  1
                </dt>
                <dd>
                  <span className="font-semibold">Wiki</span> – статии за QA
                  концепции, техники и best practices.
                </dd>
              </div>
              <div className="flex items-start">
                <dt className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 text-green-700 font-bold mr-3">
                  2
                </dt>
                <dd>
                  <span className="font-semibold">Акаунти</span> – регистрация,
                  вход/изход, профил и GDPR действия.
                </dd>
              </div>
              <div className="flex items-start">
                <dt className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 text-green-700 font-bold mr-3">
                  3
                </dt>
                <dd>
                  <span className="font-semibold">Admin панел</span> – само за
                  администратори, с метрики и управление на съдържание.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Бързи линкове
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              href="/wiki"
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Преглед на Wiki
                </h3>
                <p className="text-sm text-gray-600">
                  Разгледай статии за manual, UI и API тестване.
                </p>
              </div>
              <span className="mt-3 text-xs text-gray-500">SCR-WIKI-LST</span>
            </Link>
            <Link
              href="/auth/register"
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Регистрация
                </h3>
                <p className="text-sm text-gray-600">
                  Създай нов акаунт, за да използваш профила и админ функциите.
                </p>
              </div>
              <span className="mt-3 text-xs text-gray-500">
                SCR-AUTH-REGISTER
              </span>
            </Link>
            <Link
              href="/auth/login"
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Вход</h3>
                <p className="text-sm text-gray-600">
                  Влез в акаунта си и достъпи профила.
                </p>
              </div>
              <span className="mt-3 text-xs text-gray-500">SCR-AUTH-LOGIN</span>
            </Link>
            <Link
              href="/profile"
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Профил</h3>
                <p className="text-sm text-gray-600">
                  Управлявай имейл, парола, експорт и закриване на акаунта.
                </p>
              </div>
              <span className="mt-3 text-xs text-gray-500">
                SCR-AUTH-PROFILE
              </span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
