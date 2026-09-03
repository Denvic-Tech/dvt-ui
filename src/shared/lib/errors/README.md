# Модуль `shared/errors`

Этот модуль собирает утилиты и типы для унифицированной работы с ошибками во фронтенде DVT. Он служит связующим звеном между API-клиентом, redux-слайсами и визуальными слоями (`alerts`, `error-journal`).

## Состав

- `ApiError.ts` — обёртка над доменным `ApiErrorPayload`, которую выбрасывает gateway-клиент.
- `events.ts` — конструктор `ErrorEvent`, функции нормализации (`createErrorEvent`, `errorSeverityFromStatus`, `fingerprintError`) и типы `ErrorEvent`, `ErrorSeverity`, `ErrorSource`.
- `schemas.ts` — Zod-схема `ErrorEnvelopeSchema` для бэкенд-конвертов.
- `utils.ts` — вспомогательные функции для работы с `ApiError` (`isApiError`, `toApiErrorPayload`, `createUnknownError`, `ensureApiErrorPayload`).
- `index.ts` — централизованный экспорт всех перечисленных сущностей.

## Базовые единицы

### ApiError и ApiErrorPayload
Gateway-клиент перехватывает HTTP-ответы и выбрасывает `ApiError`. Пейлоад содержит `code`, `message`, `status` и `meta`. Используйте `isApiError(error)` перед тем, как вытаскивать пейлоад.

```ts
try {
  await client.projects.getProjects();
} catch (error) {
  if (isApiError(error)) {
    console.log(error.payload.code);
  }
}
```

### ErrorEvent
`ErrorEvent` — нормализованное событие ошибки, совместимое с `error-journal` и будущим error-bus. Создаётся через `createErrorEvent(error, meta)`.

```ts
const event = createErrorEvent(error, {
  source: 'reduxThunk',
  message: 'Не удалось загрузить проект',
  context: { actionType: action.type },
});
dispatch(ingestError({ event }));
```

Поля, которые стоит передавать в `meta`:
- `source` — происхождение (`gateway`, `reduxThunk`, `react`, ...).
- `severity` — явный уровень важности (если не передан, вычисляется из HTTP-статуса).
- `context` — структура с деталями (IDs, actionType, requestId).
- `fingerprint` / `fingerprintHint` — контроль дедупликации. Если не задан, собирается автоматически из `code`, `message` и контекста.
- `notify` — флаг для моментального показа алерта (`true` по умолчанию).

### Функции нормализации
- `errorSeverityFromStatus(status)` — раскладывает HTTP-статусы по уровням (`critical`, `error`, `warning`, `info`).
- `fingerprintError(params)` — готовит устойчивый ключ, учитывая source, код, сообщение, контекст.

## Потоки использования

### 1. Gateway-клиент → ApiError
`src/shared/gatewayClient/index.ts` перехватывает ответы и выбрасывает `ApiError`. Логика thunk'ов должна ловить эксепшн и вызывать `rejectWithValue(apiError.toPayload())` — это позволит listener'у собрать событие и записать в журнал.

### 2. Redux listener → Error Journal
`src/entities/error-journal/model/listener.ts` использует `createErrorEvent`, чтобы превратить payload из `rejectWithValue` в `ErrorEvent` и диспатчить `ingestError`. Модуль `error-journal` уже умеет:
- хранить ошибки по `fingerprint`;
- считать статистику по severity/status;
- трекать `lastShownAtByFingerprint` для интеграции с `alerts`.

### 3. Ручная публикация ошибок
Для источников вне Redux (websocket, error boundary, worker) создавайте событие вручную и отправляйте в `error-journal` или будущий error-bus:

```ts
import { createErrorEvent } from '@/shared/errors';
import { ingestError } from '@/entities/error-journal';

dispatch(
  ingestError({
    event: createErrorEvent(error, {
      source: 'websocket',
      context: { channel: 'graph-status' },
      notify: false, // если не нужно мгновенное уведомление
    }),
  })
);
```

## Когда добавлять новые утилиты
- Появился новый источник ошибок — добавьте константы/типы в `events.ts` (`ErrorSource`).
- Нужна особая политика отображения — расширьте `CreateErrorEventMeta` (например, `tags`, `userMessage`).
- Интегрируете внешний мониторинг — можно держать точку входа рядом, но использовать существующие `ErrorEvent` для консистентности.

## FAQ

**Почему `createErrorEvent` принимает `unknown`?** — чтобы безболезненно обрабатывать любые ошибки (`ApiError`, `Error`, произвольные объекты). Функция сама приведёт значение к `ApiErrorPayload`.

**Можно ли использовать модуль вне Redux?** — Да. `createErrorEvent` не зависит от Redux; итоговое событие можно отправить в любую систему (логгер, мониторинг, UI).

**Нужен ли error bus?** — В планах реализовать простой `publishError/subscribe` поверх этих типов. До появления bus можно напрямую диспатчить `ingestError` или внедрять события в `alerts`.
