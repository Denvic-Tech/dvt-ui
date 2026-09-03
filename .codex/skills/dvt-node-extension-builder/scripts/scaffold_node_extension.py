from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from _common import (
    build_template_variables,
    normalize_content_slot,
    normalize_extension_type,
    read_json,
    render_template,
    update_registry,
    write_text,
)


TEMPLATE_MAP = {
    'NodeModalExtension': 'modal',
    'NodeModalStepperExtension': 'modal_stepper',
    'NodeContentExtension': 'node_content',
    'NodeContextMenuExtension': 'context_menu',
    'NodeInputDefinitionExtension': 'input_definition',
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description='Scaffold a DVT node extension from a prepared context JSON.'
    )
    parser.add_argument('--context-file', required=True, help='Prepared context JSON.')
    parser.add_argument(
        '--extension-type',
        default='NodeModalExtension',
        help='Extension type. Defaults to NodeModalExtension.',
    )
    parser.add_argument(
        '--content-slot',
        default='top',
        help='For NodeContentExtension: top or bottom.',
    )
    parser.add_argument(
        '--register',
        action='store_true',
        help='Also add the extension to src/app/providers/node-extensions/registry.ts.',
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Print planned operations without writing files.',
    )
    return parser.parse_args()


def scaffold_from_context(
    context: dict,
    *,
    extension_type: str,
    content_slot: str,
    register: bool,
    dry_run: bool,
) -> dict:
    project_root = Path(context.get('project_root') or Path.cwd()).resolve()
    frontend = context['frontend']
    target_dir = project_root / frontend['relative_dir']
    component_name = frontend['component_name']
    template_dir = (
        SCRIPT_DIR.parent
        / 'assets'
        / 'templates'
        / TEMPLATE_MAP[extension_type]
    )
    variables = build_template_variables(
        context,
        extension_type,
        content_slot=content_slot,
    )

    files = {
        target_dir / 'index.ts': render_template(template_dir / 'index.ts.tpl', variables),
        target_dir / 'ui' / f'{component_name}.tsx': render_template(
            template_dir / 'component.tsx.tpl',
            variables,
        ),
        target_dir / 'model' / '.gitkeep': '',
        target_dir / 'lib' / '.gitkeep': '',
    }

    result = {
        'extension_type': extension_type,
        'content_slot': content_slot,
        'target_dir': str(target_dir),
        'files': [str(path) for path in files],
        'registered': False,
        'registry_changes': None,
    }

    if dry_run:
        return result

    for path, content in files.items():
        write_text(path, content)

    if register:
        result['registry_changes'] = update_registry(
            project_root,
            import_path=frontend['import_path'],
            extension_symbol=frontend['extension_const_name'],
        )
        result['registered'] = True

    return result


def main() -> int:
    args = parse_args()
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    context = read_json(Path(args.context_file).resolve())
    extension_type = normalize_extension_type(args.extension_type)
    content_slot = normalize_content_slot(args.content_slot)
    result = scaffold_from_context(
        context,
        extension_type=extension_type,
        content_slot=content_slot,
        register=args.register,
        dry_run=args.dry_run,
    )
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
