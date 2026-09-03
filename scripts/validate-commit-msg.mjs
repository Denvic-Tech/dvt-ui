import fs from 'node:fs';

const commitMsgFile = process.argv[2];

if (!commitMsgFile) {
  console.error('Не передан путь к файлу commit message.');
  process.exit(1);
}

const msg = fs.readFileSync(commitMsgFile, 'utf8').trim();
const pattern = /^(ADD|UPD|FIX|HFIX|RM|CLR) .+/;

if (!pattern.test(msg)) {
  console.error('Неверный формат commit message!\n');
  console.error('Ожидаемый формат:');
  console.error(
    '  ADD: описание       - добавление нового функционала, сущностей или файлов'
  );
  console.error(
    '  UPD: описание       - обновление существующего функционала, сущностей или файлов'
  );
  console.error('  FIX: описание       - исправление ошибки');
  console.error('  HFIX: описание      - горячая/быстрая заглушка для фикса');
  console.error(
    '  RM: описание        - удаление функционала, сущностей или файлов'
  );
  console.error('  CLR: описание       - рефакторинг, чистка кода\n');
  console.error(`Ваш коммит: '${msg}'`);
  process.exit(1);
}
