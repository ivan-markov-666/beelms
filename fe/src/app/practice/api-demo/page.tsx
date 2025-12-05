import { TrainingApiPlayground } from "./_components/training-api-playground";

const TRAINING_SWAGGER_URL =
  process.env.NEXT_PUBLIC_TRAINING_API_SWAGGER_URL ??
  "http://localhost:4000/api/training/docs";

export default function ApiDemoPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
          Practical Environment
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          API Demo / Training API
        </h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
          На тази страница ще намерите кратко обяснение на Training API,
          линк към Swagger UI и примерни идеи за упражнения по
          API/integration тестване.
        </p>
      </header>

      <section className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Swagger UI за Training API
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Swagger UI описва наличните ендпойнти на Training API и ви позволява
          да изпращате заявки директно от браузъра. Използвайте го като
          отправна точка за запознаване с ping/echo ендпойнтите.
        </p>
        <a
          href={TRAINING_SWAGGER_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 dark:ring-offset-zinc-950"
        >
          Отвори Swagger UI за Training API
        </a>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          По подразбиране линкът сочи към локална dev среда
          ({"http://localhost:4000/api/training/docs"}). В production този URL
          ще минава през API Gateway.
        </p>
      </section>

      <section className="space-y-3 text-sm text-zinc-700 dark:text-zinc-200">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Примерни сценарии за упражнения
        </h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <span className="font-medium">Ping – базов health check.</span> 
            Изпратете <code>GET /api/training/ping</code> от Swagger UI и
            проверете, че връща <code>200 OK</code> и поле <code>status =
            &apos;ok&apos;</code>.
          </li>
          <li>
            <span className="font-medium">Echo – позитивен сценарий.</span> 
            Изпратете <code>POST /api/training/echo</code> с валидно body
            (напр. <code>{'{ "value": "hello" }'}</code>) и проверете, че в
            отговора <code>value</code> съвпада, а <code>receivedAt</code> и
            <code>requestId</code> са попълнени.
          </li>
          <li>
            <span className="font-medium">Echo – липсващо value.</span> 
            Изпратете празно body <code>{'{}'}</code> и очаквайте
            <code>400 Bad Request</code> с подходящо съобщение за грешка.
          </li>
          <li>
            <span className="font-medium">Echo – различни типове стойности.</span> 
            Пробвайте <code>value</code> с различни типове (string, number,
            boolean, object, array) и проверете как се сериализира отговорът.
          </li>
          <li>
            <span className="font-medium">Идентификатор на заявка.</span> 
            Наблюдавайте полето <code>requestId</code> за няколко поредни
            заявки и проверете, че е различно за всяка заявка.
          </li>
        </ol>
      </section>

      <section className="space-y-3 text-sm text-zinc-700 dark:text-zinc-200">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Примерни curl заявки и JSON отговори
        </h2>

        <div className="space-y-2">
          <p className="font-medium">Ping пример</p>
          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            Примерна заявка към публичния Training API (локален dev пример с
            порт <code>4000</code>):
          </p>
          <pre className="overflow-auto rounded-md bg-zinc-950 p-2 text-[11px] text-zinc-100 dark:bg-black">
            <code>
              {`curl -X GET "http://localhost:4000/api/training/ping"`}
            </code>
          </pre>
          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            Примерен JSON отговор (може да варира според реалната имплементация
            на Training API):
          </p>
          <pre className="overflow-auto rounded-md bg-zinc-950 p-2 text-[11px] text-zinc-100 dark:bg-black">
            <code>{`{ "status": "ok" }`}</code>
          </pre>
        </div>

        <div className="space-y-2">
          <p className="font-medium">Echo пример</p>
          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            Примерна <code>POST</code> заявка към echo ендпойнта с JSON payload:
          </p>
          <pre className="overflow-auto rounded-md bg-zinc-950 p-2 text-[11px] text-zinc-100 dark:bg-black">
            <code>
              {`curl -X POST "http://localhost:4000/api/training/echo" \
  -H "Content-Type: application/json" \
  -d '{ "message": "hello", "count": 3 }'`}
            </code>
          </pre>
          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            Примерен JSON отговор (echo връща същото body):
          </p>
          <pre className="overflow-auto rounded-md bg-zinc-950 p-2 text-[11px] text-zinc-100 dark:bg-black">
            <code>{`{ "message": "hello", "count": 3 }`}</code>
          </pre>
        </div>
      </section>

      <TrainingApiPlayground />
    </main>
  );
}
