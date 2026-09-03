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
