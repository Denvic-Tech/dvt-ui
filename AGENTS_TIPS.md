### 2026-02-11 — Оптимизация drag в ReactFlow

- Если используется `useOnSelectionChange`, не вызывайте Redux `dispatch` без проверки перехода состояния: во время drag выбранной ноды callback может срабатывать на каждом `mousemove`.
- Для закрытия контекстного меню группы нод безопаснее закрывать только при переходе `2+ -> <2` (например, через `hadMultiSelectionRef`).
- В reducer `close` полезно ставить guard (idempotent close), чтобы повторный `close` в уже закрытом состоянии не инициировал лишние обновления store.

### 2026-02-18 — DataFrameFilter conditions v2

- Для `DataFrameFilter` удобнее держать UI плоским (таблица), а в state/запросе всегда собирать `conditions`-дерево с корнем `and/or`; это даёт обратную совместимость с legacy `filter_conditions + logic` через адаптер.
- Валидацию лучше делить на draft и strict: draft сериализует изменения на лету в `localInputData.conditions`, strict запускается перед сохранением и проверяет ограничения операторов (включая null-семантику и literal-only/list-операторы).
- Для стабильной сериализации null-литерала используйте токен `__dvt_null_value` и явно блокируйте `>`, `<`, `>=`, `<=` с этим токеном на фронте.

### 2026-02-19 — DataFrameFilter tree builder

- Для сложного UX фильтра удобнее держать отдельный builder-state с `id` у узлов (condition/group), а в `localInputData` сохранять только контрактный `conditions`; синхронизацию безопасно делать через fingerprint (`JSON.stringify`) и `lastCommittedRef`.
- Для `isin/notin` практичнее хранить список в UI как chips-массив (`literal/null`), а при сериализации отправлять `right: { type: 'literal', value: [...] }`.
- Popover smart-operand лучше всегда показывать секциями literal/NULL/columns/variables, но выбор колонок блокировать для операторов из `operators_with_literal_right_only` — так UI остается консистентным, а ограничения backend соблюдаются до сохранения.

### 2026-03-20 — Stepper modal hydration race

- В stepper-расширениях не стоит сбрасывать поля только по изменению fingerprint цели (table/schema/database), пока `localInputData` впервые гидрируется из `nodeData.inputValues` после открытия модалки.
- Практичный guard: если предыдущий fingerprint был «пустой», а текущие `localInputData` уже содержат сохранённые значения (`write_mode`, `upsert_config`, SQL/spec), считать это первичной гидрацией и не запускать reset.
- Fallback-автовыбор (`truncate` и т.п.) должен срабатывать только когда исходное поле реально `null/undefined`, а не когда нормализация временно вернула `null`.

### 2026-04-03 — Sticky reveal для скрытых handles в graph editor

- Для peek-handle в `project-editor/custom-node` не стоит держать временный reveal строго на текущем hover-кадре: при drag-connect XYFlow может быстро переключать hover/snapped state и провоцировать флаппинг видимости.
- Надёжный паттерн: вводить session-key для текущего drag (`from node/id/type + special io type`) и latch state `stickyTemporary*Reveal`, который включается при первом hover по ноде и сбрасывается только при завершении/cancel текущей connection-сессии.
- Проверять поведение удобнее через Playwright на живом проекте: 1) drag из `output_variables`, 2) дождаться появления скрытого `input-input_variables`, 3) увести курсор с ноды и убедиться, что handle остаётся видимым до `Escape`/mouse up, 4) после cancel проверить, что handle снова скрыт и лишняя edge не создалась.

### 2026-04-10 — Guard против self-rehydration в modal draft editors

- Если modal editor хранит богатый локальный draft (`rows`, builder-state, active item) и параллельно сериализует только контрактную часть в `localInputData`, нельзя без guard заново гидрировать локальный state из `localInputData` после каждого собственного `setLocalInputData`.
- Надёжный паттерн: держать `lastHydratedFingerprintRef` и `lastSerializedFingerprintRef`; при открытии модалки делать принудительную гидрацию из внешнего payload, а при локальных изменениях обновлять только `lastSerializedFingerprintRef` и пропускать effect-ре-гидрацию, если внешний fingerprint совпадает с только что сериализованным.
- Этот guard особенно важен для UIs, где `localInputData` хранит только ready/valid данные, а локальный draft содержит ещё и пустые/черновые строки: без него форма теряет draft-элементы, пересоздаёт список и часто визуально сбрасывает scroll наверх.

### 2026-04-13 — Scrollable column + flex children в modal editors

- Если список строк живёт в `flex-direction: column` контейнере с `overflow: auto`, сами строки нельзя оставлять с дефолтным `flex-shrink: 1`: при переполнении браузер начнёт сжимать карточки, а вложенные контролы фиксированной высоты будут вылезать и перекрывать соседние строки.
- Надёжный паттерн для таких editor-списков: scroll-контейнеру дать `minHeight: 0` и `overflow: auto`, а каждой строке/карточке задать `flexShrink: 0`, чтобы переполнение уходило в scroll, а не в компрессию children.
- Для одинаковой высоты `Input`/`Select`/`Autocomplete` не подгоняйте отдельный экран пикселями; подключайте autocomplete-поля к тем же shared control styles (`textFieldControlSx` / общий outlined root), что уже используют базовые primitives.

### 2026-04-13 — Один источник истины для control radius

- Не вычисляйте `control`-скругления через `theme.shape.borderRadius`, если `shape.borderRadius` уже используется как surface-radius для panel/dialog/card: после смены базового surface radius контролы незаметно расползаются по радиусу.
- Практичный паттерн: держать отдельный helper/source of truth для control radii (`getControlRadiusValue` / `getControlRadius`) и использовать его и в theme overrides (`MuiOutlinedInput`, `MuiButton`, `MuiTab`), и в shared primitive `sx`.
- Если `SxProps` хранится как функция (`theme => ({ ... })`), её нельзя spread-ить как обычный объект. Для composition сначала вычисляйте функцию на `theme`, иначе часть root-стилей silently не применится.

### 2026-04-14 — Dynamic output_variables и expression warnings

- В `useNodeVariables` нельзя полагаться только на `CreateVariable` и `ManageVariables`: upstream-ноды могут публиковать runtime-переменные через `state.nodeMetadata.nodeMetadataByID[nodeId].output_variables` с metadata `type: 'VARIABLE_MAP'`, и без этого слой extensions теряет автокомплит для dynamic variables.
- Для expression mode полезно разводить discovery и strict compatibility: autocomplete может показывать весь primitive-набор переменных, а явный direct passthrough несовместимого типа (`=string_var` в `INT` поле) лучше помечать как `warning`, а не как blocking error.
- Warning на type mismatch стоит вешать только на прямую ссылку на одну переменную; если выражение использует global/filter/test (`=len(name)`, `=dt | default(...)`), фронт не может надёжно вывести итоговый тип и не должен шуметь false-positive предупреждениями.

### 2026-05-07 — Monaco defaultLanguage для template JSON

- Если `JSONNodeInput` гидрируется уже сохранённым template payload с `{{...}}`, нельзя монтировать Monaco с фиксированным `defaultLanguage='json'`: редактор успевает поднять JSON-валидацию и показать ложные syntax markers.
- Надёжный паттерн: вычислять стартовый язык из текущего режима (`plaintext` для template, `json` для literal) и дополнительно синхронно вызывать `setModelLanguage` в `onMount`, чтобы reopen модалки не оставлял stale diagnostics.
- Если structural error template JSON вычисляется локально в `JSONNodeInput`, её нужно отдельно пробрасывать наружу через callback в state родителя; одного `errorText` на экране недостаточно, иначе редактор покажет ошибку, но внешняя modal validation продолжит считать значение валидным.

### 2026-05-08 — Shared Monaco editor после рефактора

- Для новых multiline/code editors сначала используйте `CodeEditor` из `src/shared/ui/code-editor`, а не прямой `MonacoEditor`: общий компонент уже содержит Clean Minimal wrapper, scoped completion providers, markers, modal layout fixes, `Tab` для accept completion и plain `Enter` для newline.
- Для node-specific подсказок не смешивайте плоские Monaco suggestions с дефолтами. Пишите `CodeEditorCompletionProvider`, возвращайте секции из `getSections`, а для диалектов выносите логику в language pack (`src/shared/ui/code-editor/language-packs/*`). В SQL используйте `createSqlCompletionProvider` и catalog из metadata, чтобы после `SELECT` показывать колонки, а после `FROM/JOIN` таблицы.
- В `TemplateMonacoInput` top-level node/dialect hints передавайте через `completionProviders`; expression autocomplete внутри `{{...}}` должен оставаться отдельным island и не смешиваться с внешними providers.
- Не создавайте inline-дефолты вроде `completionProviders = []`, `additionalSuggestions = []`, `markers = []` внутри props/component body: новый массив на каждый render может перерегистрировать Monaco provider и сбросить выбранный пункт suggest-list на первый при `ArrowDown`. Используйте module-level empty constants или `useMemo`.
- Если баг проявляется только в конкретной ноде, сначала проверьте, не использует ли она shared адаптер (`TemplateMonacoInput`, `PythonCodeInput`, `CodeEditor`) через `ExpressionAccordionInput`/feature UI. Правку поведения Monaco лучше делать в shared layer или language pack, а не в node extension.

### 2026-05-27 — Dynamic node header description через базовый NodeExtension

- Если ноде нужен динамический `description` под заголовком, не добавляйте новый extension type и не хардкодьте `nodeDefinition.name` в `custom-node`.
- Используйте optional `getHeaderDescription(context)` в базовом `NodeExtension`: `string` переопределяет description, `null` скрывает его, `undefined` оставляет fallback на `nodeDefinition.description`.
- Для node-level resolver’ов источник истины должен жить в существующем extension ноды (`modal`, `modal_stepper`, `node_content_*`, `context_menu`), а не в отдельном параллельном extension-объекте.

### 2026-06-01 — db-connection-v1 scope overrides

- Для `db-connections-v1` не делайте фронт-зависимость от обязательных `user_id` / `organization_id` в payload: по актуальному backend-контракту для роли `user` оба поля можно опускать.
- Role-aware правило такое: `admin` может переопределять только `user_id`, `superadmin` может переопределять и `user_id`, и `organization_id`, а `organization_id` для `admin` не должен форсироваться с фронта.
- Если generated client какое-то время отстаёт от live metadata `db-connections-v1/types`, держите касты и runtime-совместимость внутри boundary новой сущности (`api` / adapters), не протаскивайте ослабленные типы в остальной код.

### 2026-06-08 — Виртуализация крупных column dropdown

- Для селектов колонок с сотнями элементов сначала снижайте стоимость поиска: используйте `useDeferredValue` для query и кэшируйте searchable-строку (`name + dtype` в lowercase) в `useMemo`, чтобы не пересчитывать `toLowerCase()` на каждом вводе.
- Виртуализировать лучше только список опций внутри Popper, а trigger/chips/placeholder оставлять обычными: это дает заметный выигрыш по DOM и рендеру без усложнения остального UX.
- Для multi-select дополнительно полезно держать выбранные значения в `Set` и мемоизировать row-компонент: даже при виртуализации это уменьшает лишние перерисовки видимых строк.

### 2026-06-08 — Виртуализация иерархического списка таблиц

- Если список таблиц строится как `db -> schema -> table` через nested `Collapse`, виртуализировать вложенный DOM напрямую неудобно: практичнее сначала собрать `visibleRows` из текущих `openStates`, а затем отдавать этот плоский массив в `react-virtuoso`.
- Для больших metadata-списков полезно включать виртуализацию по порогу видимых строк, а не по общему числу таблиц: пока группы закрыты, DOM и так маленький; проблема начинается после раскрытия крупных schema/database.
- Для search по таблицам лучше сразу кэшировать комбинированный `searchText` (`name + database + schema + type`) и фильтровать уже по нему, чтобы поиск оставался отзывчивым даже на больших metadata payload.

### 2026-06-08 — Виртуализация mapping-таблицы и стабильный hover в advanced options

- Для больших editable таблиц внутри модалки удобнее держать sticky/static header отдельно, а scrollable body виртуализировать через `react-virtuoso`; это позволяет сохранить layout колонок и не рендерить сотни `input/select/switch` одновременно.
- Если таблица поддерживает jump-to-row из summary/preview, старый `scrollIntoView` по DOM-ref ломается после виртуализации. Надежный паттерн: для large-list использовать `VirtuosoHandle.scrollToIndex`, а для малых невиртуализированных списков оставить fallback на локальный `rowElementsRef`.
- В ClickHouse advanced options дрожание hover/focus часто связано не с самими контролами, а с появлением/исчезновением scrollbar внутри вложенных scroll-box. Практический фикс: `overflowY: auto`, `overflowX: hidden`, `scrollbarGutter: stable`, `overscrollBehavior: contain` и отказ от лишнего `transition: all` на интерактивных элементах.

### 2026-10-08 — Синхронизация detail-запроса со списком в RTK Query (data-catalog)

- Если detail-запрос меняет данные на бэкенде (например, `GET /data-catalog/datasets/{id}?sync=true`), обновляйте уже загруженные страницы списка в `onQueryStarted`: `api.util.selectCachedArgsForQuery(getState(), 'searchDatasets')` + `updateQueryData` по каждому аргументу. В RTK 2.11 это работает и для `infiniteQuery` (draft = `{ pages, pageParams }`).
- Для «свежих» данных при каждом открытии модалки монтируйте компонент с хуком внутри `Dialog` (MUI размонтирует children после закрытия) и передавайте `refetchOnMountOrArgChange: true`.
- При `exactOptionalPropertyTypes` нельзя перекладывать optional-поля поштучно (`description: details.description` даёт `| undefined`); безопаснее отрезать лишние ключи деструктуризацией и делать spread остатка.

### 2026-10-14 — Сгенерированный gateway-клиент и GET без параметров

- Для GET-роутов без query/path (`/projects/favorites`, `/projects/scheduler/scheduled`, `/widgets/runs-24h`, `/widgets/services`) сгенерированный zod `requestValidator` (`query: z.optional(z.never())`) может отвергать конверт запроса, который собирает facade. Рабочий паттерн — передавать `{}` и переопределять валидатор: `client.x.get({}, { requestValidator: async data => data, silent: true })`. Валидатор ответа при этом остаётся.
- Для данных, которые нужно опрашивать (виджеты главной), удобнее RTK Query (`createApi` + `fakeBaseQuery`) с `pollingInterval` на хуке: кэш шарится между карточками, а `data` из последнего успешного опроса остаётся при ошибке следующего — карточку можно не прятать. `skipPollingIfUnfocused` без `setupListeners` не работает: в store он не подключён.

### 2026-10-14 — Выпадающие меню внутри блоков с appear-анимацией

- Блок с CSS-анимацией по `transform`/`opacity` (`animation: … both`, как `homeAppearSx`) остаётся stacking context и после окончания анимации. Абсолютно спозиционированное меню внутри него с любым `z-index` не перекроет блоки ниже по DOM, у которых тоже есть такая анимация. Задавайте `position: relative` + `z-index` самому анимируемому контейнеру или рендерьте меню через портал.

### 2026-10-14 — Role-gated UI и кэш текущего пользователя

- `useCurrentUser` держит профиль в модульной переменной, которая не сбрасывается сама при смене аккаунта в SPA. Любой UI, который по роли решает, какие запросы отправлять (виджеты главной, админские разделы), должен ждать `loading === false` и не опираться на первый рендер. При изменении сессии вызывайте `resetCurrentUserCache()` (уже подключено в `AuthContext`).

### 2026-10-15 — Навигация из редактора без перезагрузки и очередь графа

- `flushGraphOperations` раньше брал проект из `projects.selectedProject` в момент отправки. При SPA-переходе debounce-отправка продолжает работать после ухода из редактора, и при быстром открытии другого проекта правки могли уйти не в тот граф. Теперь очередь закреплена за проектом (`syncGraph.projectId`); при добавлении новых источников операций графа проверяйте, что они проходят через `graphChangeMatcher` (там происходит привязка).
- Переводя переход в редактор на SPA-навигацию, проверяйте per-project state, который раньше «сбрасывала» перезагрузка: `projectTask.lastTaskID` блокировал стартовую задачу метаданных следующего проекта (теперь `resetProjectTask()` в cleanup `useProjectEditorSetup`). Ищите похожие гарды вида `if (lastX) return;` на данных из Redux, не привязанных к `projectID`.
- Для внутренних переходов используйте `RouterLink`/`navigate`, а не `window.location.assign`: полная перезагрузка заново проходит `checkAuth`, setup/availability-гейты и rehydrate redux-persist.

### 2026-10-15 — «Залипающая» навигация в React Router v7

- `BrowserRouter` v7 оборачивает смену location в `startTransition`. Любое обновление через `useSyncExternalStore` (react-redux `useSelector`) планируется в `SyncLane` (`forceStoreRerender` в react-dom), и React отбрасывает незавершённый transition-рендер и начинает его заново. Если такие обновления приходят чаще, чем длится рендер новой страницы, transition коммитится только по истечении срока лейна (5000 мс, `computeExpirationTime`). Симптом: URL уже новый, на экране старая страница ~5 с, long tasks нет.
- Реальный источник потока в редакторе — не WebSocket, а замкнутый цикл viewport ↔ Redux в `GraphEditor`: эффект `[savedViewport, graphLoaded]` → `setViewport(savedViewport)` → d3-zoom эмитит `end` даже для программного вызова → `onMoveEnd` → `saveViewport(getViewport())` → в `uiLayout.graphViewports` кладётся новый объект с теми же числами → селектор отдаёт новую ссылку → эффект срабатывает снова. ~160 dispatch/с и ~320 коммитов/с всё время, пока открыт редактор; запускается сразу после `graph/fetchGraph/fulfilled`, если для проекта есть персистированный viewport (`uiLayout` в whitelist redux-persist). Устранено 2026-10-15: редьюсер `uiLayout.setGraphViewport` делает ранний return при равных `x/y/zoom` (ссылка на state не меняется), эффект восстановления в `GraphEditor` зависит только от `currentProject.id`/`graphLoaded`/`lastLoadedProjectID` и читает сохранённый viewport из store через `store.getState()` в момент запуска, а `onMoveEnd` сравнивает текущий viewport с последним сохранённым (`lastSavedViewportRef`) и не диспатчит одинаковые значения. Обход `unstable_useTransitions={false}` снят, переход редактор → главная занимает ~90–280 мс при включённых transitions.
- Быстрая диагностика таких «залипаний»: временный middleware в начале цепочки, который пишет `action.type` и `performance.now()` в `window.__actionLog` (плюс `new Error().stack` для источника), и `React.Profiler` на корне — частота и виновник видны за минуту без DevTools.
- StrictMode и xyflow: между двойным запуском эффектов в dev `ZoomPane` уничтожает и создаёт заново `XYPanZoom` (viewport снова `{0,0,1}`). Если «восстановить viewport один раз» реализовать через ref-флаг «уже восстановлено», второй запуск эффекта пропустится и viewport потеряется при SPA-возврате в редактор (а отложенный `onMoveEnd` первого инстанса ещё и сохранит `{0,0,1}`). Делайте эффект идемпотентным и завязанным на зависимости загрузки, а не на ref.
- Правило для xyflow: не вызывайте `setViewport` из эффекта на каждое изменение сохранённого значения и не кладите объект viewport в store без сравнения по значению — программный `setViewport`/`fitView` сам вызывает `onMoveEnd`.

### 2026-10-16 — Multipart и blob-ответы через gatewayClient

- Сгенерированные SDK-функции для multipart (`previewImportProjectsImportPreviewPost`, `uploadNodeFileInput...`) валидируют `body.file` zod-схемой `z.string()`, поэтому передать `File` через них нельзя. Рабочий паттерн — собрать `FormData` вручную и вызвать `client.post({ url, body: formData, throwOnError: true, silent: true })` (см. `nodeFileInputApi`, `projectTransferApi`).
- Для бинарных ответов (`responseType: 'blob'`) тело ошибки тоже приходит `Blob`, и общий interceptor не может достать `description`: он попадает в `payload.meta.raw`. Разбирайте его локально (`await raw.text()` → JSON) и выбрасывайте новый `ApiError`, иначе пользователь увидит только «Request failed with status code 400».
- Заголовки ответа доступны только при генерике `client.post<TData, TError, true>` (ThrowOnError = true): без него тип результата — union с `AxiosError`, и `response.headers` не типизируется.

### 2026-10-19 — Визуальная проверка диалогов без логина

- Если встроенный браузер не авторизован в приложении, диалог можно проверить изолированно: временная страница `tmp/<name>/index.html` + `main.tsx` (папка `tmp/` в .gitignore) раздаётся тем же Vite dev-сервером по `http://localhost:5173/tmp/<name>/index.html` с алиасами `@/`. Внутри — `ThemeProvider` с `lightTheme`, `Provider` с реальным `store` из `@/app/providers/store/store` (или пустым `configureStore`) и импорт `@/index.css` + `@fontsource/inter/*`.
- API-обёртки вида `export const fooApi = { method: async () => ... }` можно подменить прямо на странице присваиванием (`projectTransferApi.previewImport = async () => mock`) — модуль один и тот же для страницы и компонента.
- Скриншоты в фоне иногда возвращают кадр до перерисовки (MUI Popover/Dialog): проверяйте состояние через `javascript_tool`/`find` и делайте повторный скриншот. Страницу после проверки удаляйте.

### 2026-10-22 — RTK Query: подмена кэша ответом мутации

- Чтобы положить ответ мутации в уже загруженный кэш query, используйте `api.util.updateQueryData(endpoint, arg, () => response)` (возврат значения из immer-рецепта заменяет данные синхронно). `upsertQueryData` запускает отдельный «запрос» и пишет данные асинхронно — тесты, читающие state сразу после `await dispatch(mutation)`, видят старое значение.
- Для query, вызванного с `port: null` (бэкенд сам выбирает порт), сопоставляйте кэш по фактическому `data.port`: `api.endpoints.getNodeFields.select(cachedArg)(state).data?.port`.
- Пункты рейла сайдбара с `kind: 'modal'` (`Sidebar/items.tsx`) не трогают `activeCategory`; окно монтируется в `Sidebar` с `open={openModalCategory === '<key>'}`, а MUI сам размонтирует содержимое после закрытия, так что состояние окна сбрасывается без ручной очистки.

### 2026-11-02 — Удаление файла при запущенном dev-сервере ломает `index.css`

- Если при запущенном Vite удалить файл, который уже попал в сканирование Tailwind (в том числе из `public/`), `/src/index.css` начинает отдавать 500 с `ENOENT` на удалённый файл (`vite:css-analysis`, `fileToDevUrl`), а страница остаётся пустой. Похоже, плагин Tailwind держит устаревший список зависимостей CSS.
- Помогает перезапуск dev-сервера. Если он запущен не вами, достаточно обновить дату файла: `touch vite.config.ts` — Vite перезапустится сам, содержимое и `git diff` не изменятся.

### 2026-11-03 — Язык интерфейса и локализованные ответы бэкенда

- Бэкенд локализует ответы по заголовку `X-Language` (`/nodes`, документация нод, поля lineage в Data Catalog). Фронт берёт его из `localStorage["language"]` в request-интерсепторе `src/shared/gatewayClient/index.ts`, поэтому `LanguageProvider.setLanguage` пишет storage синхронно: эффекты детей срабатывают раньше эффекта провайдера, и запрос из эффекта ребёнка иначе уйдёт со старым языком.
- Всё, что закешировано в Redux из локализованных эндпоинтов, нужно перезапрашивать при смене языка (сейчас так делается для `fetchNodeDefinitions`; документация нод кешируется по ключу с языком и перезапрашивается сама).
- Проверить без перезагрузки: обернуть `XMLHttpRequest.prototype.setRequestHeader` через `javascript_tool` и логировать `x-language` — `read_network_requests` заголовки не показывает.

### 2026-11-06 — Разбивка чанков и ленивый Monaco

- `@monaco-editor/react` при монтировании вызывает `loader.init()`; если `loader.config({ monaco })` ещё не отработал, редактор тянет Monaco с jsdelivr. Поэтому любой `<MonacoEditor>` оборачивайте в `MonacoRuntimeGate` из `@/shared/ui/code-editor`, а не запускайте `ensureMonacoRuntime()` «в фоне». В тестах runtime замокан в `src/test/setup.ts` как уже готовый.
- В `manualChunks` сопоставляйте пакет по `/node_modules/<name>/`, а не по `/<name>/`: регулярка `/react/` ловит `@xyflow/react` и утаскивает React Flow в `react-vendor`, который preload'ится на каждой странице. Проверять через список `<link rel="modulepreload">` в `dist/index.html`.
- После появления lazy-маршрутов Rollup начинает предупреждать о циклах «index.ts ↔ model/\*.ts» там, где модель импортирует собственный barrel или barrel `@/app/providers/store` (он тянул `store` → `rootReducer` → все entity-барреллы). Лечится импортом хуков из `@/app/providers/store/hooks` и относительными импортами внутри слайса; инстанс стора из barrel убран намеренно.
- `vite preview` отдаёт prod-сборку, которая ходит в `${origin}/api`; без `preview.proxy` SPA-fallback вернёт `index.html` на `/api/*` со статусом 200, и код вроде `user.email.trim()` упадёт с непонятным `TypeError`. Прокси настроен в `vite.config.ts` из `VITE_API_BASE_URL`; запуск — конфигурация `dvt-ui-preview` в `.claude/launch.json`.
- Воркеры `ts/css/html` всё равно попадают в `dist` (monaco создаёт их через `new Worker(new URL(...))` внутри `editor.main`), но не скачиваются, пока нет модели такого языка. Убрать их из сборки можно только переходом на `editor.api` + явные contributions.

### 2026-11-08 — Ленивое дерево каталога БД с кэшем веток

- Для дерева, где каждая ветка — свой RTK Query (infinite) хук, не вызывайте хуки в цикле: рендерьте по невидимому компоненту-подписчику на каждый когда-либо раскрытый узел (`CatalogBranchLoader`, теперь в `src/features/node/db-catalog-tree/ui`). Он сообщает ветку в состояние дерева через `reportBranch(key, branch, actions)`, а строки строятся чистой функцией (`buildCatalogTreeRows`). Подписчик не размонтируется при сворачивании — подписка держит кэш, и повторное раскрытие не делает запрос; `refreshCatalog` инвалидирует тег подключения и обновляет все подписанные ветки разом.
- Действия ветки (`loadNextPage`, `retry`) передавайте через ref, который обновляется в эффекте без зависимостей, иначе результат хука (новый объект на каждый рендер) зациклит `reportBranch`.
- `useDbCatalogTablePreview` вызывается с `refetchOnMountOrArgChange: true`, поэтому «грузить только при открытии вкладки и заново для новой таблицы» удобно делать флагом `enabled`, а саму панель монтировать с `key` по имени таблицы.
- Компонентные селекторы emotion (`${Row}:hover &`) в MUI `styled` без babel-плагина падают; используйте класс-маркер (`'&:hover .row-clear'`).

### 2026-11-10 — Общий kit Clean Minimal для модалок нод

- Дерево каталога БД (база → схема → таблица) вынесено в `src/features/node/db-catalog-tree` (`useCatalogTree`, `CatalogTreeView`, `getCatalogTreeLevels`, `createCatalogTreeNode`). Его используют RTDB V3 и шаг 1 Write DataFrame To DB V4. Свои строки (черновик «Новая таблица», ⋯ у базы, пункты общего меню) добавляются через `renderBranchLead` / `renderNodeActions` / `renderExtraMenuItems`. Созданные в сессии базы и схемы показываются через `injectedNodes`, пока каталог их не вернул.
- Выпадающие списки — `DropdownMenu` / `MultiDropdownMenu` / `ActionMenu` из `src/shared/ui/clean-minimal/dropdown.tsx`. Чтобы меню раскрывалось вверх при нехватке места снизу (высота ≤ 240), повесьте `{...dropdownBoundaryProps}` (`data-cm-dropdown-boundary`) на контейнер, который ограничивает видимую область (тело модалки). `showCheck` рисует галочку у выбранного пункта, `onClear` вызывается при повторном клике по выбранному.
- Подсветка SQL без Monaco: `highlightSql` (`src/shared/lib/sql`) + `SqlPreview` / `SqlPreviewFrame` (`src/shared/ui/clean-minimal/SqlPreview.tsx`). Ключевые слова распознаются только в верхнем регистре — так не подсвечиваются имена колонок вроде `order`.
- Черновик `table_create_spec` вне `TableCreateSpecEditor`: хук `useTableCreateSpecDraft` (`@/features/node/table-create-spec-editor`) держит локальный черновик, валидирует при каждом изменении, сериализует наружу только валидный и не перегидрирует черновик из собственного `onChange`. Логика та же, что в самом редакторе: при изменении одного не забудьте второе.
- `NodeModalStepperExtensionProps.goToStep(index)` переводит степпер только назад (ссылка «путь таблицы» на шаге 2 V4 возвращает к шагу 1).
- Зависший vitest (воркер растёт до гигабайт, файл не завершается) чаще всего — бесконечный цикл «эффект → setState» внутри `act`: мок RTK-хука возвращает новый объект или функцию на каждый рендер (`useXMutation: () => [vi.fn()]`), а компонент держит это значение в зависимостях эффекта. В приложении RTK отдаёт стабильные ссылки, поэтому в браузере цикла нет. Держите значения моков в `vi.hoisted` и возвращайте одну и ту же ссылку (см. `writeDfToDbV4.steps.test.tsx`). Найти виновника быстрее всего запуском отдельных тестов через `-t` с `timeout`.

### 2026-11-11 — Хоткей удаления на канвасе и открытые модалки

- `deleteKeyCode` в React Flow вешает слушатель на `document` и пропускает только `input`/`textarea`/`contenteditable`/`.nokey`. Нажатие с кнопки или пустой области MUI-диалога, который портирован в `body`, удаляет выделенные ноды. Поэтому в `GraphEditor` стоит `deleteKeyCode={null}`, а хоткей обрабатывается своим слушателем с проверкой `shouldHandleCanvasDeleteKey`. Не возвращайте `deleteKeyCode`: если переключать его между массивом и `null`, `useKeyPress` может остаться в состоянии «нажато», и первое нажатие после этого пропадёт.
- `ConfirmDialogProvider` ставит запросы `confirm()` в очередь и показывает их по одному. Если один и тот же запрос может прийти многократно (хоткей), оборачивайте его в `createExclusiveConfirm`, иначе пользователь закрывает N окон подряд.
- Как проверить, что открыта модалка: на странице редактора всегда смонтирован скрытый `keepMounted` ConfirmDialog. У его корня класс `.MuiModal-hidden`, но у paper внутри `aria-modal="true"`, поэтому селектор `[aria-modal="true"]` без проверки `closest('.MuiModal-hidden')` даёт ложное «открыто».
- Встроенный браузер со скрытой панелью работает как фоновая страница: клики по координатам и `innerText` там ненадёжны. Если кнопка «Отмена» не нажимается, проверьте `tabs_context` и закройте окно через `button.click()`.
