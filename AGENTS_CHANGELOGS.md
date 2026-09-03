### 2026-05-12 19:27:17

- Кружки последних запусков на странице проектов приведены к стилистике страницы расписаний: размер 22px, увеличенный интервал, мягкая pulse-анимация для running и без внешнего ping-кольца.
- Окно информации по клику на кружок оформлено по паттерну `/profile/schedule`: статусный badge в заголовке, затемнённый blur-backdrop, карточки запусков, duration, started/finished grid и отдельные блоки ошибок/причин остановки.
- История запусков осталась инлайн в строке проекта, без переноса в нижний schedule-блок.
- Проверка: `npm run build`.

### 2026-05-12 19:29:42

- Исправлены скругления в окне информации запусков на странице проектов: радиусы заданы явными пикселями вместо множителей MUI `sx`, чтобы окно, badge, карточки и блок ошибок соответствовали `/profile/schedule`.
- Проверка: `npm run build`.

### 2026-05-12 19:59:30

- В `projectsApi` добавлена обертка для `GET /projects/search` с trim имени, пагинацией и параметром `include_last_runs`.
- На странице `/projects` добавлен режим полного поиска: обычный ввод продолжает локально фильтровать текущий список, а кнопка `Искать везде` запускает debounced поиск по всем доступным проектам через новый gateway route.
- Результаты полного поиска используют существующие строки проектов, действия, сортировку, пагинацию и обновляются после операций с проектами.
- Проверка: `npm run build`.

### 2026-05-13 11:55:53

- Поиск на странице проектов вынесен в компонент `ProjectsSearch` с локальным режимом по умолчанию, CTA полного поиска в dropdown и badge `везде` внутри input после запуска глобального поиска.
- Убрана отдельная кнопка `Искать везде` справа от input; глобальный поиск теперь запускается только кликом по CTA или клавишей Enter при открытом dropdown.
- Добавлены состояния фокуса, закрытия по Escape/click outside, очистки с возвратом фокуса и автоматического возврата из полного поиска в локальный режим при новом вводе.
- Проверка: `npm run build`.

### 2026-05-13 12:10:27

- На странице проектов доработано drag-and-drop перемещение проектов в папки: активный перенос теперь хранится в React-состоянии, поэтому drop-зоны папок и breadcrumb работают без чтения `dataTransfer` на `dragover`.
- Добавлен cleanup drag-сессии через `dragEnd`, fallback чтения payload на `drop`, защита от перемещения в текущую папку и стабильное состояние hover у папки при движении над вложенными элементами.
- Оптимистичное скрытие перемещаемого проекта теперь привязано к исходной папке, чтобы проект не пропадал в целевой папке после обновления списка.
- Проверка: `npm run build`.

### 2026-05-13 12:29:04

- Обновлен `projectsApi.search` под новый контракт `GET /projects/search`: добавлен параметр `item_type`, удален устаревший `store_enabled`, по умолчанию запрашиваются папки и проекты через `itemType: 'all'`.
- Глобальный поиск на странице проектов теперь использует mixed `ProjectFolderItemSchema[]` напрямую, без преобразования результатов в project-only список.
- Счетчик полного поиска переименован с количества проектов на количество элементов, так как backend возвращает и папки, и проекты.
- Проверка: `npm run build`.

### 2026-05-13 13:28:01

- Исправлено позиционирование меню выбора количества строк на странице проектов: popup центрируется относительно кнопки размера страницы.
- Добавлено закрытие меню выбора количества строк по клику вне контрола через document-level `mousedown` и ref на `PageSizeControl`.
- Проверка: `npm run build`.

### 2026-05-13 13:35:21

- Выровнена высота кнопки `Фильтры` в toolbar страницы проектов с соседними inline-кнопками за счет унификации padding, font size, border и wrapper display.
- Проверка: `npm run build`.

### 2026-05-15 11:26:46

- Выполнен рефактор `MyStorage`: логика дерева файловых хранилищ, CRUD-операции, загрузка и скачивание вынесены в новый reusable-компонент `FileStorageBrowserTree` внутри `src/entities/data/storage`.
- Добавлен общий слой для файловых хранилищ: helper `fileTree`, generic picker `FileStorageTreePicker` и совместимый wrapper `S3FileTreePicker`, чтобы сохранить работу существующих node extensions.
- В sidebar добавлена полноценная поддержка `ftp` и `sftp` наряду с `s3`: корневые иконки и подписи теперь зависят от типа подключения, а пустое состояние стало общим для файловых подключений.
- Добавлены тесты на metadata mapping файловых подключений, generic picker и wiring `MyStorage` для `s3`/`ftp`/`sftp`.
- Проверка: `npm run test:run -- src/entities/data/storage/ui/fileTree.test.tsx src/entities/data/storage/ui/FileStorageTreePicker/FileStorageTreePicker.test.tsx src/widgets/project-editor/sidebar/ui/Sidebar/MyStorage/MyStorage.test.tsx`, `npm run build`.

### 2026-05-15 13:39:21

- Удалён `MyStorage` и убрана отдельная sidebar-категория `fileTree`; доступ к файловому менеджеру перенесён во вкладку `dbConnections`.
- В `src/entities/data/db-connection/ui/DBConnectionsList` добавлена action-кнопка открытия файлового менеджера только для файловых подключений `s3` / `ftp` / `sftp`, а `DBConnectionsManager` теперь открывает отдельный диалог для выбранного подключения.
- В `src/entities/data/storage` добавлены новый `FileStorageManager` и `FileStorageManagerDialog`, поддерживающие просмотр дерева, создание/удаление/переименование директорий, загрузку/удаление/переименование файлов и обновление каталога.
- Storage API и hook обновлены под новый контракт `gatewayClient`: добавлены `upload/file`, `path/rename` и `path/move`; загрузка файлов в новом manager переведена с presign-flow на прямой gateway upload endpoint.
- Добавлен тест на условный показ action-кнопки файлового менеджера в `DBConnectionsList`.
- Проверка: `npm run test:run -- src/entities/data/db-connection/ui/DBConnectionsList/DBConnectionsList.test.tsx src/entities/data/storage/ui/FileStorageTreePicker/FileStorageTreePicker.test.tsx src/entities/data/storage/ui/fileTree.test.tsx`, `npm run build`.

### 2026-05-15 13:55:06

- Устранено нарушение FSD-границ: `src/entities/data/db-connection` больше не импортирует `src/entities/data/storage`.
- Логика открытия и рендера `FileStorageManagerDialog` перенесена из `DBConnectionsManager` на уровень `src/widgets/project-editor/sidebar/ui/Sidebar`, где теперь происходит композиция `db-connection` и `storage`.
- `DBConnectionsManager` оставлен владельцем списка и CRUD-операций подключений и теперь только прокидывает `onOpenFileManager` в `DBConnectionsList`.
- Проверка: `npm run test:run -- src/entities/data/db-connection/ui/DBConnectionsList/DBConnectionsList.test.tsx src/entities/data/storage/ui/FileStorageTreePicker/FileStorageTreePicker.test.tsx src/entities/data/storage/ui/fileTree.test.tsx`, `npm run build`.

### 2026-05-18 12:15:52

- В `PrimitiveNodeInput` добавлена опциональная typed-поддержка встроенных icon actions слева и справа для single-field сценариев: STRING, masked STRING, INT, FLOAT и expression mode.
- `HighlightedSingleLineField` и `HighlightedSingleLineFieldV2` расширены поддержкой `startActions` и `endActions` с сохранением обратной совместимости через legacy-проп `actions`.
- В `ui-kit/components` секция `PrimitiveNodeInput` дополнена демонстрациями left action, right actions и both sides для ручной проверки нового API.

### 2026-06-16 19:13:35

- В sidebar редактора проекта добавлена новая отдельная вкладка `Файловый менеджер` с иконкой в левом rail.
- Реализован новый read-only раздел `FileManagerSection`, который загружает подключения, локально фильтрует записи по `kind='file'`, поддерживает поиск и открывает `file-storage-manager-viewer` по клику на файловое подключение.
- Существующая вкладка `Подключения` сохранена без изменения CRUD-сценариев; фильтрация файловых подключений выполнена локально, чтобы не перетирать общий `dbConnections` slice серверным запросом с `kind=file`.
- Добавлен компонентный тест на отображение только файловых подключений, поиск и открытие viewer.
- Проверка: `npm run test:run -- src/widgets/project-editor/sidebar/ui/Sidebar/FileManagerSection.test.tsx`, `npm run build`.
- Добавлены unit-тесты на новый контракт inline actions, порядок custom/built-in кнопок и обратную совместимость.
- Проверка: `npm run test:run -- src/shared/ui/node-input/__tests__/PrimitiveNodeInput.test.tsx src/shared/ui/node-input/__tests__/HighlightedSingleLineFieldV2.test.tsx`, `npm run build`.

### 2026-05-18 12:58:28

- Обновлены UI-расширения `SaveCSV`, `SaveExcel` и `SaveParquet` под новый backend-контракт: удалены legacy-поля `filename`/`usecols`, `path` переведен на полный относительный target path, для Excel `header` заменен на boolean switch, для CSV добавлены `header` и `single_file`.
- Добавлен общий слой выбора target path для file-storage write-нод: helper’ы нормализации/сборки путей в `src/shared/lib/file-storage-target-path.ts` и reusable-компонент `FileStorageTargetPathSection` на базе `PrimitiveNodeInput` с `inlineActions`.
- `file-storage-manager-viewer` расширен picker-режимом с promise-based API через `useFileStorageManagerViewer.openPicker(...)`: диалог теперь умеет возвращать выбранный файл/папку обратно в node editor и при этом сохраняет существующий viewer-сценарий для sidebar.
- `ExpressionAccordionInput` доработан так, чтобы custom inline actions не пропадали в expression mode у path-полей.
- Добавлены unit-тесты для helper’ов target path и registry picker-запросов.
- Проверка: `npm run test:run -- src/shared/lib/file-storage-target-path.test.ts src/entities/node/file-storage-manager-viewer/model/pickerRequests.test.ts`, `npm run build`.

### 2026-05-18 13:15:39

- Переведены `LoadCSV`, `LoadExcel` и `LoadParquet` на тот же сценарий выбора файлов через `PrimitiveNodeInput` с icon-action, открывающим глобальный `file-storage-manager-viewer` в picker-режиме.
- Для `LoadCSV` сохранен dual-mode UX: в режиме одного файла picker выбирает `.csv`, в режиме pattern picker выбирает папку и автоматически подставляет `*.csv`, при этом ручной ввод glob-пути остается доступным.
- Для `LoadExcel` сохранен ручной ввод glob/mask path, а кнопка picker теперь выбирает `.xlsx`/`.xls` файл без встроенного дерева в ноде.
- Для `LoadParquet` picker поддерживает выбор и parquet-файла, и parquet-каталога, как раньше, но теперь через общий глобальный менеджер.
- Проверка: `npm run build`.

### 2026-05-19 12:20:34

- В `src/widgets/project-editor/file-storage-manager-viewer/ui/index.tsx` переработан layout диалога файлового менеджера: footer с action-кнопками сделан sticky, а `DialogContent` ограничен по высоте viewport и переведен на собственный scroll.
- Высота дерева `FileStorageManager` сделана адаптивной через `clamp(...)`, чтобы при небольшом окне и большом числе файлов/папок кнопки внизу оставались видимыми.
- Проверка: `npm run build`.

### 2026-05-21 18:14:00

- Исправлена логика показа плашки `Не понятна причина ошибки?` в `src/widgets/ai-analysis-banner/AIAnalysisBanner.tsx`: теперь она появляется только после live-перехода `taskExecutionStatus` в `ERROR` для `full`-таска, а не по diff старых ошибок в очереди.
- Для баннера вынесены helper-функции в `src/widgets/ai-analysis-banner/lib.ts`, которые фильтруют stale `ERROR` при первом рендере и дополнительно проверяют, что задача из текущей очереди проекта действительно имеет `mode: 'full'` и статус `ERROR`.
- Добавлены unit-тесты `src/widgets/ai-analysis-banner/lib.test.ts` на сценарии со stale-ошибкой при открытии экрана и с новым live `ERROR`-статусом.
- Проверка: `npm run test:run -- src/widgets/ai-analysis-banner/lib.test.ts`, `npm run build`.

### 2026-05-21 18:19:26

- Полностью отвязана логика плашки `Не понятна причина ошибки?` от очереди задач и sidebar: `src/widgets/ai-analysis-banner/AIAnalysisBanner.tsx` теперь реагирует только на websocket-статусы `TASK_EXECUTION_STATUS` для `full`-задач.
- Упрощены helper’ы в `src/widgets/ai-analysis-banner/lib.ts`: баннер поднимается только на новом live-переходе в `ERROR`, игнорирует stale состояние при первом рендере и сбрасывается при следующем `full`-запуске (`QUEUED`/`RUNNING`/другая task id).
- Обновлены unit-тесты `src/widgets/ai-analysis-banner/lib.test.ts` под новый контракт показа и сброса баннера.
- Проверка: `npm run test:run -- src/widgets/ai-analysis-banner/lib.test.ts`, `npm run build`.

### 2026-05-21 18:23:00

- Исправлено повторное появление плашки после завершения AI-анализа той же ошибочной `full`-задачи: в `src/widgets/ai-analysis-banner/AIAnalysisBanner.tsx` успешный `startAIAnalysis` теперь сразу помечает `task_id` как dismissed и локально сбрасывает активную ошибку баннера.
- Это исключает сценарий, когда баннер временно скрывается только на время `hasActiveAIAnalysis`, а затем снова появляется после завершения анализа без нового запуска `full`-таска.
- Проверка: `npm run test:run -- src/widgets/ai-analysis-banner/lib.test.ts`, `npm run build`.

### 2026-05-22 14:28:34

- В `src/node-extensions/extract/read-variables-from-db/ui/ReadVariablesFromDBEditor.tsx` получение metadata по SQL переведено с `useApiUtils` обратно на прямой вызов `apiUtilsApi.getSqlCodeMetadata(...)`.
- Убрана зависимость effect от Redux-статуса `getSQLCodeMetadataState`, из-за которой результат запроса помечался устаревшим через `sqlRequestVersionRef` и игнорировался.
- Инкремент `requestVersion` перенесен к месту реального старта запроса после guard-проверок, чтобы смена локального/UI state не инвалидировала ответ раньше времени.
- Проверка: `npm run build`.

### 2026-05-25 15:12:08

- Добавлен общий helper `src/shared/lib/db-metadata/index.ts` для нормализации нового и legacy-контракта `DBMetadata`: flatten `databases/schemas/tables`, derived options для баз и схем, поиск таблиц и SQL reference.
- На новый helper переведены `db-target-selector`, `read-table-from-db-v3`, `read-query-from-db-v3`, `read-variables-from-db`, `create-table`, `write-df-to-db-v3`, `write-df-to-db-v2`, legacy `write-df-to-db` и `DatabaseMetadataPanel`, чтобы UI больше не зависел от root `metadata.tables`.
- Обновлена логика показа и валидации database/schema selector’ов под новые бизнес-правила для PostgreSQL, MSSQL, MySQL/MariaDB, ClickHouse, SQLite и Oracle.
- Добавлены и обновлены unit-тесты для нового обхода `DBMetadata`, read-table form и SQL metadata helper’ов.
- Проверка: `npm run test:run -- src/shared/lib/db-metadata/index.test.ts src/node-extensions/extract/read-table-from-db-v3/lib/helpers.test.ts src/node-extensions/extract/read-table-from-db-v3/model/useReadTableFromDBV3Form.test.tsx src/node-extensions/extract/read-query-from-db-v3/lib/metadata.test.ts src/node-extensions/write/write-df-to-db-v3/lib/helpers.test.ts src/node-extensions/extract/read-variables-from-db/lib/helpers.test.ts src/node-extensions/write/write-df-to-db/ui/WriteDataFrameToDB.test.tsx`, `npm run build`.

### 2026-05-26 21:50:57

- Заполнена константа `SQL_CONNECTION_METADATA` в `src/entities/data/db-connection/model/constants/connectionMetadata.ts` для всех SQL-like типов подключений.
- Значения синхронизированы с действующими правилами структуры metadata в `src/shared/lib/db-metadata/index.ts`: PostgreSQL/MSSQL поддерживают базы и схемы, MySQL/Oracle только схемы, ClickHouse только базы, `mongodb` и `custom` не объявляют поддержку этих уровней.

### 2026-05-26 21:52:22

- Расширен тип `SQLConnectionMetadata` в `src/entities/data/db-connection/model/types/metadata.ts`: добавлены атрибуты `dialect`, `defaultPort` и `requiresDriverName`.
- Обновлена константа `SQL_CONNECTION_METADATA` в `src/entities/data/db-connection/model/constants/connectionMetadata.ts` для всех SQL-like типов; `defaultPort` теперь берется из `DEFAULT_SQL_PORTS`, а для `mssql` отдельно отражено требование `driver_name`.

### 2026-06-01 14:55:59

- Дореализована параллельная сущность `src/entities/data/db-connection-v1`: добавлены `api`, `model`, `hooks`, `selectors`, `slice`, `ui` и публичные экспорты для schema-driven работы с `db-connections-v1`.
- В `src/app/providers/store/rootReducer.ts` зарегистрирован новый reducer `dbConnectionsV1`, при этом legacy `dbConnections` оставлен без миграции потребителей.
- Реализован schema-driven manager и modal для V1-подключений с live-каталогом kinds/types/drivers, динамическим рендером `properties` / `secrets` / `driver_options`, поддержкой `smbprotocol` и role-aware правилами override для `user_id` / `organization_id`.
- Добавлены unit-тесты `src/entities/data/db-connection-v1/model/__tests__/adapters.test.ts` и `src/entities/data/db-connection-v1/model/__tests__/slice.test.ts`.
- Проверка: `npm run test:run -- src/entities/data/db-connection-v1/model/__tests__/adapters.test.ts src/entities/data/db-connection-v1/model/__tests__/slice.test.ts`, `npm run build`.

### 2026-06-01 16:55:45

- Потребители проекта переведены со старого `@/entities/data/db-connection` на новый `@/entities/data/db-connection-v1`: обновлены sidebar, `file-storage-manager-viewer` и `ConnectionIDInput`.
- В `src/app/providers/store/rootReducer.ts` runtime-подключение `dbConnections` переведено на `dbConnectionsV1Reducer`, при этом legacy-папка `src/entities/data/db-connection` не изменялась.
- Слой `src/entities/data/storage` расширен поддержкой V1-формы подключения с полем `properties`, чтобы файловый менеджер мог работать с новыми file-connections без адаптации через legacy `connection_properties`.
- В `src/entities/data/db-connection-v1` добавлен guard для поддерживаемых файловых типов и обновлены тесты адаптеров под текущие ограничения TypeScript.
- Проверка: `npm run build`.

### 2026-06-01 21:17:57

- Обновлен UI в `src/entities/data/db-connection-v1/ui` под визуальный шаблон legacy `src/entities/data/db-connection`: менеджер подключений, раскрывающийся список и модальное окно создания/редактирования теперь используют идентичный shell и стили.
- Для `db-connection-v1` добавлены локальные style-файлы `DBConnectionsManager.styles.ts`, `DBConnectionsList.styles.ts` и `DatabaseConnectionCreateUpdateModal.styles.ts`, чтобы повторить старый интерфейс без изменения логики V1-хуков и payload-ов.
- В модальном окне V1 перенесены sidebar типов, header/footer, кнопка проверки подключения со status-state и отдельный modal ошибок; динамические schema-driven поля `properties`, `secrets` и `driver_options` сохранены.
- Проверка: `npm run build` — ошибки в новых UI-файлах устранены; сборка по-прежнему падает на существующем конфликте типов между `dbConnections` и `dbConnectionsV1` в `src/entities/data/db-connection/model/selectors.ts` и `src/entities/data/db-connection/model/slice.ts`.

### 2026-06-02 10:42:27

- В `src/entities/data/db-connection-v1/ui/DatabaseConnectionCreateUpdateModalV1.tsx` объединен пользовательский UX для `properties` и `secrets`: форма теперь показывает единый блок параметров подключения, сортирует типовые поля по приоритету `host/port/database/user/password`, а поля из `secrets` рендерит как скрытые password-input.
- Необязательные поля подключения и драйвера перенесены в accordion `Дополнительные параметры`; `labels` и `metadata` также скрыты в отдельном accordion `Дополнительно`, без изменения backend payload и существующего визуального shell.
- `user_id` и `organization_id` перенесены в нижний accordion `Администрирование`; для модалки и менеджера добавлены пропсы `availableUsers` и `availableOrganizations`, а sidebar теперь подгружает списки admin users / organizations и прокидывает их в `db-connection-v1`.
- Проверка: локальный `prettier` для измененных файлов; `npm run build` по-прежнему падает на существующих ошибках типов в legacy `src/entities/data/db-connection/model/selectors.ts` и `src/entities/data/db-connection/model/slice.ts`, новых ошибок в измененных файлах после правок не осталось.

### 2026-06-02 11:20:54

- В `src/entities/data/db-connection-v1/ui/DatabaseConnectionCreateUpdateModalV1.tsx` пересмотрено правило “главных” полей формы: `port`, `username`, `password`, а также базовые connection-поля вроде `host`, `database`, `share`, `bucket` и `endpoint_url` теперь остаются на основном экране, даже если schema помечает их как необязательные.
- Это исправляет UX для FTP/SFTP/S3 и SQL-like подключений (`clickhouse`, `mongodb`, `mssql`, `mysql`, `oracle`, `postgres`), где часто используемые поля больше не уезжают в accordion `Дополнительные параметры`.
- В `src/entities/data/db-connection-v1/model/adapters.ts` добавлено автозаполнение default port для новых draft-форм: SQL-типы берут порт из `src/shared/lib/db-metadata/constants/dialectMetadata.ts`, а `ftp`/`sftp` получают стандартные `21`/`22`.
- В `src/entities/data/db-connection-v1/model/__tests__/adapters.test.ts` добавлен unit-тест на гидрацию default port для нового SQL draft.
- Проверка: `npm run test:run -- src/entities/data/db-connection-v1/model/__tests__/adapters.test.ts`; `npm run build` по-прежнему падает только на существующем legacy-конфликте типов в `src/entities/data/db-connection/model/selectors.ts` и `src/entities/data/db-connection/model/slice.ts`.

### 2026-06-04 14:38:18

- Обновлен `src/entities/data/storage` под актуальные `db-connection-v1` контракты: legacy-форма `connection_properties` удалена из публичных типов, а файловые подключения теперь типизируются через `properties` и явные ветки `s3` / `ftp` / `sftp`.
- В `src/entities/data/storage/model/helpers.ts` добавлен runtime-адаптер `toFileStorageConnection` и guard `isFileStorageConnection`, чтобы принимать нормализованные объекты подключений снаружи и локально валидировать форму `storage` без небезопасных cast-ов.
- В `src/widgets/project-editor/file-storage-manager-viewer/ui/index.tsx` убран `connection as unknown as FileStorageConnection`; viewer теперь адаптирует подключение через `toFileStorageConnection` перед передачей в `FileStorageManager`.
- Обновлены тесты `src/entities/data/storage/ui/fileTree.test.tsx`: фикстуры переведены на новые `properties`, добавлены проверки успешной адаптации generic record и отклонения legacy-формы.
- Проверка: `npm run test:run -- src/entities/data/storage/ui/fileTree.test.tsx` проходит; `npm run build` больше не содержит ошибок в `storage` и падает только на существующей несвязанной ошибке типов в `src/shared/colors.ts`.

### 2026-06-05 13:58:23

- Исправлена проверка совместимости типов соединений для composite IO-типов вида `A,B,C`: `src/shared/lib/node-io/value.ts` теперь разворачивает такие строки в список типов и сравнивает их как union, а не как одно строковое значение.
- На новый helper переведены проверки соединений в `src/features/node/validate-node-connection/model/hook.ts`, `src/edge-extensions/addNodeBetweenEdge/index.tsx`, `src/entities/project-editor/node-library/ui/NodeLibraryContextMenu/NodeLibraryContextMenu.tsx` и подбор совместимого хендла в `src/widgets/project-editor/graph-editor/ui/GraphEditor.tsx`.
- Добавлен регрессионный тест `src/features/node/validate-node-connection/__tests__/validate-node-connection.test.ts` для кейса `SMB_CONNECTION -> S3_CONNECTION,FTP_CONNECTION,SMB_CONNECTION`.
- Проверка: `npm run test:run -- src/features/node/validate-node-connection/__tests__/validate-node-connection.test.ts src/shared/lib/node-io/__tests__/value.test.ts`.

### 2026-06-08 13:48:43

- Для `load/save csv|excel|parquet` добавлен общий shared-слой `src/features/node/file-storage-target-path/ui/fileStorageConnectionFields.helpers.ts` и `FileStorageConnectionFields.tsx`, который читает скрытую схему `connection_overrides` из node definition, показывает пользователю обычные поля подключения (`Bucket`, `Prefix`, `Initial directory`) и очищает устаревшие значения при смене типа connection.
- На новый shared flow переведены редакторы `src/node-extensions/extract/load-csv/ui/LoadCSVEditor.tsx`, `load-excel`, `load-parquet`, `src/node-extensions/write/save-csv/ui/SaveCSVEditor.tsx`, `save-excel`, `save-parquet`: file picker теперь использует эффективный connection context, а при неразрешённых или сложных `expr` для пути/параметров подключения кнопка `Обзор` блокируется с понятной причиной.
- Расширен viewer/picker стек файловых подключений: `src/entities/node/file-storage-manager-viewer/model/*`, `src/widgets/project-editor/file-storage-manager-viewer/ui/index.tsx`, `src/entities/data/storage/api.ts`, `src/entities/data/storage/ui/FileStorageManager/FileStorageManager.tsx`, `src/entities/data/storage/ui/FileStorageTreePicker/index.tsx` теперь прокидывают context-поля (`bucket`, `prefix`, `initial_directory`) в `/storage/list`, пересчитывают root hint и сбрасывают кеш дерева при смене effective context.
- Обновлены helpers и тесты file-storage: `src/entities/data/storage/model/helpers.ts` теперь учитывает S3 `bucket + prefix` в hint, добавлен `applyFileStorageListContext`, а в `src/entities/data/storage/ui/fileTree.test.tsx`, `src/entities/data/storage/ui/FileStorageTreePicker/FileStorageTreePicker.test.tsx` и новом `src/features/node/file-storage-target-path/ui/fileStorageConnectionFields.helpers.test.ts` покрыты branch mapping, expr-блокировки picker и применение context-полей.
- Проверка: `npm run test:run -- src/entities/data/storage/ui/fileTree.test.tsx src/entities/data/storage/ui/FileStorageTreePicker/FileStorageTreePicker.test.tsx src/features/node/file-storage-target-path/ui/fileStorageConnectionFields.helpers.test.ts`; `npm run build`.

### 2026-06-16 19:31:10

- Во вкладке `Файловый менеджер` sidebar уплотнены карточки файловых подключений: уменьшены внутренние отступы, gap, размер иконки открытия и вертикальные интервалы текста.
- Для карточек добавлены явные `minWidth: 0` и `width: 100%`, а layout имени/типа/иконки перестроен так, чтобы элементы стабильно помещались в обычную ширину sidebar без горизонтального переполнения.
- Логотип подключения слегка уменьшен локально в `FileManagerSection`, не затрагивая остальные места использования `ConnectionLogo`.
- Проверка: `npm run test:run -- src/widgets/project-editor/sidebar/ui/Sidebar/FileManagerSection.test.tsx`, `npm run build`.

### 2026-06-16 19:35:03

- Во `FileManagerSection` исправлен реальный layout карточек файловых подключений: карточка теперь жёстко ограничена шириной контейнера через `width: 100%`, `maxWidth: 100%`, `minWidth: 0`, `boxSizing: border-box` и `overflow: hidden`.
- Карточки дополнительно уплотнены по вертикали: уменьшены paddings/gap, логотип подключения приведён к фактическому размеру `28x28`, имя и hint переведены на более плотные размеры шрифта и line-height.
- Внутренний row переработан в компактный single-row header (`name + type + open-icon`) с `noWrap`, чтобы карточки корректно сжимались вместе с шириной sidebar.
- Проверка: `npm run test:run -- src/widgets/project-editor/sidebar/ui/Sidebar/FileManagerSection.test.tsx`, `npm run build`.

### 2026-06-30 16:00:10

- Добавлены стабильные `data-testid` и вспомогательные `data-*` атрибуты для Playwright-сценариев входа, страницы проектов, граф-редактора, палитры нод, модальных настроек, db/table selectors, Monaco editor и очереди задач.
- Для динамических сущностей использована схема с общим `data-testid` и фильтрацией через `data-project-*`, `data-node-*`, `data-handle-*`, `data-table-*`, `data-task-*`, чтобы не привязывать тесты к CSS-хэшам и динамическим test id.
- Создан отчет `tmp/playwright-testid-report.md` со списком новых селекторов и прежних способов вызова из Playwright-тестов.
- Проверка: `npm run build`; Playwright MCP открыл `http://localhost:5173/`, подтвердил наличие `data-testid` на форме входа и общем confirm dialog, но post-login проверка ограничена ответом `Invalid credentials` на стандартные тестовые данные.

### 2026-06-19 14:16:11

- Добавлена новая защищённая страница `src/pages/HomePage/index.tsx` и виджет `src/widgets/home-dashboard/ui/HomeDashboard.tsx` для маршрута `/home` с hero-блоком, command-bar, секцией `Продолжить работу`, карточками разделов и атмосферным фоном в стиле standalone-референса.
- Домашняя страница подключена к реальным данным через `useCurrentUser`, `useProjects` и `useOrganizations`: реализованы приветствие по локальному времени, выбор организации для `superadmin`, список недавних проектов, переход в редактор проекта и создание нового проекта через существующий `CreateProjectModal`.
- Обновлён `MenuAppBar`: логотип теперь ведёт на `/home`; в `src/App.tsx` зарегистрирован новый route `/home`, при этом текущий redirect с `/` на `/projects` сохранён.
- Добавлены тесты `src/widgets/home-dashboard/ui/HomeDashboard.test.tsx` и обновлён `src/widgets/menu-app-bar/ui/index.test.tsx` под новый маршрут главной страницы.
- Проверка: `npm run test:run -- src/widgets/home-dashboard/ui/HomeDashboard.test.tsx src/widgets/menu-app-bar/ui/index.test.tsx`, `npm run build`.

### 2026-06-19 15:07:35

- На `/home` отключён верхний `MenuAppBar`: `src/widgets/menu-app-bar/ui/index.tsx` теперь не рендерит app bar на маршруте домашней страницы.
- В `src/widgets/home-dashboard/ui/HomeDashboard.tsx` убран switcher организаций и логика фильтрации по `organization_id`; домашняя страница теперь запрашивает проекты через `projectsApi.getItems({ includeLastRuns: true, limit: 5, offset })` без фильтра организации, собирает до 5 project-item и сортирует их по `updated_at` / `created_at`.
- Карточки секции `Продолжить работу` переведены на новые recent-project данные, маркер секции и skeleton-состояние синхронизированы с лимитом в 5 элементов.
- Обновлены тесты `src/widgets/home-dashboard/ui/HomeDashboard.test.tsx` и `src/widgets/menu-app-bar/ui/index.test.tsx` под новый сценарий `/home` без app bar и без переключателя организаций.
- Проверка: `npm run test:run -- src/widgets/home-dashboard/ui/HomeDashboard.test.tsx src/widgets/menu-app-bar/ui/index.test.tsx`, `npm run build`.

### 2026-06-22 17:05:29

- На странице `src/pages/HomePage` через виджет `src/widgets/home-dashboard/ui/HomeDashboard.tsx` немного уменьшена общая ширина контентного контейнера: `maxWidth` снижен с `1060px` до `1000px`, чтобы карточки выглядели менее растянутыми.
- Проверка: визуальная правка, тесты и сборка не запускались.

### 2026-07-01 16:00:39

- В `src/entities/data/db-connection` добавлена поддержка MSSQL Named
  Instance: значение `host` в формате `server\instance` преобразуется в
  payload с отдельными `host` и `instance_name`, а `port` исключается.
- Для MSSQL-формы добавлена фильтрация эффективных полей: `port` скрывается
  при вводе Named Instance, а `instance_name` не показывается отдельным полем;
  при редактировании сохранённого подключения `host` гидрируется обратно в
  формат `server\instance`.
- Добавлены тесты адаптеров для MSSQL TCP и Named Instance, включая валидацию
  некорректного формата `host`.
- Проверка:
  `npm run test:run -- src/entities/data/db-connection/model/__tests__/adapters.test.ts`,
  `npm exec -- prettier --check src/entities/data/db-connection/model/adapters.ts src/entities/data/db-connection/model/hooks/useConnectionForm.ts src/entities/data/db-connection/model/__tests__/adapters.test.ts`,
  `npm run build`.

### 2026-07-01 16:07:28

- Исправлен разбор JSON Schema для `db-connections`: поля `properties` теперь
  собираются из object-union схем `anyOf` / `oneOf`, чтобы MSSQL TCP и Named
  Instance показывали поля подключения в UI.
- Добавлен регрессионный тест, проверяющий, что MSSQL union-схема даёт поля
  `host`, `port`, `username`, `database` и скрытый `instance_name` вместо
  пустого блока с одним `Password`.
- Проверка:
  `npm run test:run -- src/entities/data/db-connection/model/__tests__/adapters.test.ts`,
  `npm exec -- prettier --check src/entities/data/db-connection/model/schema.ts src/entities/data/db-connection/model/__tests__/adapters.test.ts src/entities/data/db-connection/model/adapters.ts src/entities/data/db-connection/model/hooks/useConnectionForm.ts AGENTS_CHANGELOGS.md`,
  `npm run build`.

### 2026-07-01 17:09:15

- Для MSSQL driver options добавлена нормализация input payload: UI и read-модель
  могут использовать `odbc_driver_name`, но create/check/update отправляют в
  generated SDK поле `driver_name` с тем же значением.
- Для нового MSSQL-подключения задан дефолт `ODBC Driver 18 for SQL Server`;
  при редактировании поддержана гидрация значения как из `odbc_driver_name`, так
  и из `driver_name`.
- Расширены тесты адаптеров, проверяющие дефолт ODBC-драйвера и отсутствие
  `odbc_driver_name` в отправляемом payload.
- Проверка:
  `npm run test:run -- src/entities/data/db-connection/model/__tests__/adapters.test.ts`,
  `npm exec -- prettier --check src/entities/data/db-connection/model/adapters.ts src/entities/data/db-connection/model/__tests__/adapters.test.ts`,
  `npm run build`.

### 2026-07-07 12:05:04

- В `src/shared/ui/confirm-dialog/ConfirmDialog.tsx` поднят `z-index` корневого MUI Dialog выше верхнего стандартного слоя темы, чтобы confirm-dialog всегда отображался поверх других модалок и диалогов.

### 2026-07-08 10:21:25

- Для ноды `DataFrameFillNA` добавлено modal-расширение `src/node-extensions/transform/df-fill-na` с выбором колонок входного DataFrame и стратегий заполнения `mean`, `median`, `mode`, `min`, `max`, `ffill`, `bfill`.
- Расширение зарегистрировано в `src/app/providers/node-extensions/registry.ts`; добавлена валидация пустых правил, дублей колонок и колонок, отсутствующих во входных metadata.
- Проверка: `npm run build`.

### 2026-07-16 17:06:50

- Добавлена поддержка сломанных `db-connections` со `state="invalid"`:
  сохранение `issues` и raw-полей, отображение `Broken` в списке подключений и
  вывод проблем в раскрытой карточке.
- Форма редактирования теперь заполняет invalid-подключения из raw-полей, но
  оставляет проблемные поля пустыми и показывает рядом текст issue.
- В `connection-id-input` сломанные подключения остаются видимыми, но недоступны
  для выбора с пояснением причины.

### 2026-07-29 21:25:26

- Перенесена функциональность профиля с устаревшего `AppConfig` на новую сущность `AppSettings` в `src/entities/config/app-settings`.
- Добавлен runtime-generated UI настроек по definitions с динамическими namespaces в сайдбаре профиля.
- Обновлены маршруты профиля, reducer store и тесты навигации под `/profile/app-settings`.

### 2026-07-29 23:51:38

- Доработаны поля `app-settings` под новый контракт `definition.value_type`: добавлен разбор JSON Schema для enum, Literal и Union, выпадающие списки для конечных наборов значений и корректная сериализация исходных значений в payload.

### 2026-08-05 13:32:47

- Разделены входящие и проектные переменные в редакторах SQL, шаблонов и Python: для них используются пространства имён `input_variables` и `project_variables`.
- Добавлено контекстное автодополнение Monaco, которое после имени пространства показывает только переменные соответствующей группы.
- Сохранена совместимость существующих SQL-шаблонов с неквалифицированными ссылками и добавлены тесты группировки, диагностики и автодополнения.

### 2026-08-05 14:08:43

- В редактор ноды `ExecuteProject` добавлены настройки обработки неразрешённых и системных переменных с backend-совместимыми значениями и значениями по умолчанию.

### 2026-08-10 13:20:12

- Добавлено modal-расширение ноды `SchemaPolicy` с синхронизацией политик по входному `TableSchema`, настройкой действий для колонок и типизированным вводом значений заполнения.
- Добавлены предупреждения для пустой или изменившейся схемы, возможность открыть редактор до получения metadata, регистрация расширения и тесты редактора и преобразования настроек.

### 2026-08-10 14:03:38

- В редактор `SchemaPolicy` добавлены массовые операции для политик `Если отсутствует` и `Несовпадение типа` с отображением общего или смешанного состояния колонок.
- Добавлен компонентный тест массового применения обеих политик ко всем колонкам.

### 2026-08-12 12:52:24

- В `NodeModalStepperRenderer` добавлено прокидывание идентификатора текущего проекта в контекст `loadingCondition`.
- Добавлен тест передачи `projectID` в условие загрузки шага.

### 2026-08-12 13:23:43

- В базовый контракт `NodeModalExtensionProps` добавлен `projectID`, который передается во все редакторы модальных расширений.

### 2026-08-19 16:40:00

- В `HTTPRequest` JSON body теперь поддерживает объекты и массивы; обновлены подсказки и сброс payload для GET.
- `JSONNodeInput` получил раздельные `inputVariables`/`projectVariables`, JSON-массивы переменных сохраняются без оборачивания в `{ items }`, а `SCHEMA` inputs валидируются по JSON Schema через AJV с сохранением поддержки expressions. Добавлены regression-тесты.

### 2026-08-19 17:07:00

- В общей `SCHEMA`-валидации добавлен безопасный fallback: некорректная JSON Schema от Backend (например, с неразрешимым `$ref`) больше не роняет сохранение всей формы через `_general`.
- Добавлен regression-тест с `MissingRefError` для auth-схемы и JSON payload-массивом с UUID; валидный payload сохраняется, а окончательная проверка поврежденной схемы остается на Backend runtime.

### 2026-08-19 23:22:00

- Исправлена инициализация Project Editor: автоматическая metadata-задача теперь запускается только после установления WebSocket-соединения, чтобы live-логи Task Worker не терялись до подключения UI.
- Добавлено явное отключение WebSocket при размонтировании редактора и regression-тест ожидания соединения перед запуском начальной metadata-задачи.

### 2026-08-25 18:38:30

- Редактор `SaveParquet` получил явные Simple/Advanced semantics: expression для `mode` считается потенциально Advanced, а переход из Simple автоматически нормализует path и включает collision-safe `<increment>.parquet` naming.
- Добавлена frontend-валидация небезопасных filename templates для append/row-cap/Hive partitioning, нормализация trailing separators и component/helper regression-тесты.
- Draft `compatibility_mode` при открытии всегда переводится в `new`, при этом предупреждение показывается только для persisted `legacy`; отдельный API update при открытии не выполняется.

### 2026-08-25 20:23:29

- В `SaveParquet` переход Advanced → Simple теперь блокируется не только для literal `append`, но и для expression в `mode`, чтобы попытка переключения не очищала `filename_template`, `row_cap` и `partition_on`.
- Simple option получил визуальное disabled-состояние и объяснение причины, а Path в expression-mode показывает отдельные подсказки о file semantics для Simple и directory semantics для Advanced.
- Добавлены regression-тесты сохранения Advanced-настроек, Advanced expression Path hint и disabled mode option общего file-storage path control.

### 2026-08-26 10:39:00

- Исправлена hydration legacy `SaveParquet`: если после перевода `compatibility_mode` в `new` конфигурация становится Advanced, literal path нормализуется из `reports/orders.parquet` в directory path `reports/orders`, а отсутствующий template получает `<increment>.parquet`.
- Expression path при legacy hydration не переписывается автоматически, при этом сохраняется существующий legacy warning; добавлены regressions для `row_cap`, `append`, `partition_on`, готового Advanced template и expression path.

### 2026-09-02 13:35:19

- Подготовлен frontend-репозиторий к публикации в Open Source: тестовые credentials удалены из `AGENTS.md` и `CLAUDE.md`, вместо них задокументирована локальная передача учетных данных через переменные окружения; `.dockerignore` исключает `.env`, private Git metadata и локальные runtime/cache каталоги из Docker build context.
- Добавлены `LICENSE` и `COPYING`, синхронизированные с DVT backend: GNU AGPLv3 и DVT Extension Exception.
- Полностью заменен устаревший README от B24 Connector на актуальный `DVT Frontend` README с запуском, конфигурацией, сборкой, тестами, генерацией Gateway API client, архитектурой, Extensions, Docker и лицензированием.
- Проверка: tracked-файлы больше не содержат прежние тестовые credentials и legacy B24/private GitLab ссылки; `npm run build` успешно завершил Vite production build. Полный `npm run test:run` выявил существующие несвязанные падения и не завершился самостоятельно; `npm run lint` также падает на существующей базе (864 problems: 221 errors, 643 warnings).

### 2026-09-03 13:17:22

- Обновлен canonical GitHub URL frontend-репозитория на `https://github.com/Denvic-Tech/dvt-ui` перед публичной миграцией.
