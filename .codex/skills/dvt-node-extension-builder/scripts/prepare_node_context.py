from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from _common import (
    build_context,
    fetch_json,
    find_project_root,
    load_env,
    normalize_api_base,
    resolve_backend_candidate,
    resolve_node_definition,
    write_json,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description='Resolve DVT node definition and backend/frontend paths.'
    )
    parser.add_argument('--node-name', required=True, help='Node name to resolve.')
    parser.add_argument('--category', help='Optional backend category hint.')
    parser.add_argument('--api-base-url', help='Override VITE_API_BASE_URL.')
    parser.add_argument('--backend-root', help='Override BACKEND_PROJECT_PATH.')
    parser.add_argument('--project-root', help='Override dvt_ui project root.')
    parser.add_argument(
        '--output',
        help='Optional path to write the prepared context JSON.',
    )
    return parser.parse_args()


def prepare_context(args: argparse.Namespace) -> dict:
    project_root = (
        Path(args.project_root).resolve()
        if args.project_root
        else find_project_root(Path.cwd())
    )
    env = load_env(project_root / '.env')
    api_base_url = args.api_base_url or env.get('VITE_API_BASE_URL')
    backend_root_value = args.backend_root or env.get('BACKEND_PROJECT_PATH')

    if not api_base_url:
        raise RuntimeError('VITE_API_BASE_URL is not configured.')
    if not backend_root_value:
        raise RuntimeError('BACKEND_PROJECT_PATH is not configured.')

    backend_root = Path(backend_root_value).resolve()
    nodes_endpoint = normalize_api_base(api_base_url)
    node_definitions = fetch_json(nodes_endpoint)
    if not isinstance(node_definitions, dict):
        raise RuntimeError(f'Unexpected response from {nodes_endpoint}.')

    resolved_name, node_definition, match_type, candidates = resolve_node_definition(
        args.node_name,
        node_definitions,
    )
    backend_candidate, backend_resolution = resolve_backend_candidate(
        resolved_name,
        backend_root=backend_root,
        requested_category=args.category,
        python_module=node_definition.get('python_module'),
    )

    return build_context(
        requested_name=args.node_name,
        requested_category=args.category,
        resolved_node_name=resolved_name,
        node_definition=node_definition,
        match_type=match_type,
        match_candidates=candidates,
        backend_candidate=backend_candidate,
        backend_resolution=backend_resolution,
        project_root=project_root,
    )


def main() -> int:
    args = parse_args()
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    context = prepare_context(args)

    if args.output:
        output_path = Path(args.output).resolve()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        write_json(output_path, context)
        print(output_path)
        return 0

    print(json.dumps(context, indent=2, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
