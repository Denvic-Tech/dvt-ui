from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from _common import format_summary_lines, normalize_content_slot, normalize_extension_type
from prepare_node_context import prepare_context
from scaffold_node_extension import scaffold_from_context


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description='Prepare context and scaffold a DVT node extension in one command.'
    )
    parser.add_argument('--node-name', required=True, help='Node name to resolve.')
    parser.add_argument('--category', help='Optional backend category hint.')
    parser.add_argument('--extension-type', default='NodeModalExtension')
    parser.add_argument('--content-slot', default='top')
    parser.add_argument('--api-base-url')
    parser.add_argument('--backend-root')
    parser.add_argument('--project-root')
    parser.add_argument('--register', action='store_true')
    parser.add_argument('--dry-run', action='store_true')
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    extension_type = normalize_extension_type(args.extension_type)
    content_slot = normalize_content_slot(args.content_slot)
    context = prepare_context(args)
    result = scaffold_from_context(
        context,
        extension_type=extension_type,
        content_slot=content_slot,
        register=args.register,
        dry_run=args.dry_run,
    )

    summary = format_summary_lines(
        [
            ('node_name', context['resolved_node_name']),
            ('match_type', context['match_type']),
            ('backend_path', context['backend']['relative_path']),
            ('extension_type', extension_type),
            ('target_dir', result['target_dir']),
            ('register', args.register),
            ('dry_run', args.dry_run),
        ]
    )
    print(summary)
    print()
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
