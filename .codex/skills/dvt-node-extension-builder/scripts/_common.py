from __future__ import annotations

import ast
import json
import re
import urllib.error
import urllib.request
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any, Iterable


SYSTEM_INPUT_NAMES = {'input_variables', 'signal_in'}


def load_env(env_path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not env_path.exists():
        return env

    for raw_line in env_path.read_text(encoding='utf-8').splitlines():
        line = raw_line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def normalize_api_base(api_base_url: str) -> str:
    base = api_base_url.strip().rstrip('/')
    if base.endswith('/nodes'):
        return base
    if base.endswith('/api'):
        return f'{base}/nodes'
    return f'{base}/api/nodes'


def fetch_json(url: str) -> Any:
    request = urllib.request.Request(
        url,
        headers={
            'Accept': 'application/json',
            'User-Agent': 'dvt-node-extension-builder/1.0',
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as error:
        raise RuntimeError(f'HTTP {error.code} while fetching {url}') from error
    except urllib.error.URLError as error:
        raise RuntimeError(f'Failed to reach {url}: {error.reason}') from error


def normalize_search_text(value: str | None) -> str:
    if not value:
        return ''
    value = value.replace('_', ' ').replace('-', ' ')
    value = re.sub(r'(?<!^)(?=[A-Z])', ' ', value)
    value = re.sub(r'[^a-zA-Z0-9]+', ' ', value)
    return ' '.join(value.lower().split())


def pascal_to_snake(value: str) -> str:
    step_one = re.sub(r'(.)([A-Z][a-z]+)', r'\1_\2', value)
    step_two = re.sub(r'([a-z0-9])([A-Z])', r'\1_\2', step_one)
    normalized = re.sub(r'[^a-zA-Z0-9]+', '_', step_two)
    return normalized.strip('_').lower()


def pascal_to_kebab(value: str) -> str:
    return pascal_to_snake(value).replace('_', '-')


def snake_to_pascal(value: str) -> str:
    tokens = [token for token in re.split(r'[^a-zA-Z0-9]+', value) if token]
    return ''.join(token[:1].upper() + token[1:] for token in tokens)


def render_template(template_path: Path, variables: dict[str, str]) -> str:
    content = template_path.read_text(encoding='utf-8')
    for key, value in variables.items():
        content = content.replace(f'{{{{{key}}}}}', value)
    return content


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding='utf-8'))


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + '\n',
        encoding='utf-8',
    )


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def write_text(path: Path, content: str, *, overwrite: bool = False) -> None:
    ensure_parent(path)
    if path.exists() and not overwrite:
        raise FileExistsError(f'File already exists: {path}')
    path.write_text(content, encoding='utf-8')


def build_template_variables(
    context: dict[str, Any],
    extension_type: str,
    *,
    content_slot: str,
) -> dict[str, str]:
    frontend = context['frontend']
    node_definition = context['node_definition']
    component_name = frontend['component_name']
    suggested_input_attr = context.get('suggested_input_attr_name') or 'value'
    display_name = node_definition.get('display_name') or context['resolved_node_name']

    return {
        'component_name': component_name,
        'component_shared_state_name': f'{component_name}SharedState',
        'component_input_type_name': f'{component_name}InputData',
        'extension_const_name': frontend['extension_const_name'],
        'extension_id': frontend['extension_id'],
        'node_name': context['resolved_node_name'],
        'node_display_name': display_name.replace("'", "\\'"),
        'node_extension_import_path': frontend['import_path'],
        'node_content_type': (
            'node_content_bottom'
            if content_slot == 'bottom'
            else 'node_content_top'
        ),
        'suggested_input_attr_name': suggested_input_attr,
        'extension_type': extension_type,
    }


def normalize_extension_type(raw_value: str | None) -> str:
    if not raw_value:
        return 'NodeModalExtension'

    normalized = re.sub(r'[^a-z]', '', raw_value.lower())
    mapping = {
        'nodemodalextension': 'NodeModalExtension',
        'modal': 'NodeModalExtension',
        'nodemodalstepperextension': 'NodeModalStepperExtension',
        'modalstepper': 'NodeModalStepperExtension',
        'stepper': 'NodeModalStepperExtension',
        'nodecontentextension': 'NodeContentExtension',
        'content': 'NodeContentExtension',
        'nodecontextmenuextension': 'NodeContextMenuExtension',
        'contextmenu': 'NodeContextMenuExtension',
        'menu': 'NodeContextMenuExtension',
        'nodeinputdefinitionextension': 'NodeInputDefinitionExtension',
        'inputdefinition': 'NodeInputDefinitionExtension',
        'input': 'NodeInputDefinitionExtension',
    }
    if normalized not in mapping:
        raise ValueError(f'Unsupported extension type: {raw_value}')
    return mapping[normalized]


def normalize_content_slot(raw_value: str | None) -> str:
    if not raw_value:
        return 'top'
    normalized = raw_value.strip().lower()
    if normalized in {'top', 'node_content_top'}:
        return 'top'
    if normalized in {'bottom', 'node_content_bottom'}:
        return 'bottom'
    raise ValueError(f'Unsupported content slot: {raw_value}')


def candidate_strings(node_name: str, node_definition: dict[str, Any]) -> list[str]:
    values = [
        node_name,
        node_definition.get('name'),
        node_definition.get('display_name'),
        node_definition.get('python_module'),
    ]
    normalized: list[str] = []
    for value in values:
        if not value:
            continue
        normalized.append(str(value))
        if '.' in str(value):
            normalized.append(str(value).split('.')[-1])
    return normalized


def resolve_node_definition(
    requested_name: str,
    node_definitions: dict[str, Any],
) -> tuple[str, dict[str, Any], str, list[dict[str, Any]]]:
    if requested_name in node_definitions:
        return requested_name, node_definitions[requested_name], 'exact', []

    query = normalize_search_text(requested_name)
    normalized_matches: list[tuple[str, dict[str, Any]]] = []
    scored_matches: list[tuple[float, str, dict[str, Any]]] = []

    for node_name, node_definition in node_definitions.items():
        strings = candidate_strings(node_name, node_definition)
        normalized_strings = [normalize_search_text(value) for value in strings]

        if query and query in normalized_strings:
            normalized_matches.append((node_name, node_definition))

        score = 0.0
        for candidate in normalized_strings:
            if not candidate:
                continue
            local_score = SequenceMatcher(None, query, candidate).ratio()
            if query and (query in candidate or candidate in query):
                local_score += 0.15
            score = max(score, min(local_score, 1.0))
        scored_matches.append((score, node_name, node_definition))

    if normalized_matches:
        node_name, node_definition = sorted(
            normalized_matches,
            key=lambda item: item[0],
        )[0]
        return node_name, node_definition, 'normalized', []

    scored_matches.sort(key=lambda item: (-item[0], item[1]))
    best_score, best_name, best_definition = scored_matches[0]
    candidates = [
        {
            'name': name,
            'display_name': definition.get('display_name'),
            'python_module': definition.get('python_module'),
            'score': round(score, 3),
        }
        for score, name, definition in scored_matches[:5]
    ]
    if best_score < 0.45:
        raise RuntimeError(
            'Unable to resolve node definition for '
            f'"{requested_name}". Top candidates: {json.dumps(candidates, ensure_ascii=False)}'
        )
    return best_name, best_definition, 'fuzzy', candidates


def python_module_to_backend_path(
    backend_root: Path,
    python_module: str | None,
) -> Path | None:
    if not python_module or not python_module.startswith('nodes.'):
        return None

    module_parts = python_module.split('.')
    backend_path = backend_root.joinpath('src', *module_parts).with_suffix('.py')
    return backend_path if backend_path.exists() else None


def scan_backend_candidates(backend_root: Path) -> list[dict[str, Any]]:
    nodes_root = backend_root / 'src' / 'nodes'
    candidates: list[dict[str, Any]] = []
    for file_path in nodes_root.glob('*/*.py'):
        if file_path.name == '__init__.py':
            continue
        try:
            tree = ast.parse(file_path.read_text(encoding='utf-8'))
        except SyntaxError:
            continue
        classes = [
            node.name
            for node in ast.walk(tree)
            if isinstance(node, ast.ClassDef)
        ]
        relative = file_path.relative_to(backend_root)
        candidates.append(
            {
                'absolute_path': str(file_path),
                'relative_path': str(relative).replace('\\', '/'),
                'category': file_path.parent.name,
                'module': '.'.join(relative.with_suffix('').parts[1:]),
                'file_stem': file_path.stem,
                'classes': classes,
            }
        )
    return candidates


def resolve_backend_candidate(
    requested_name: str,
    *,
    backend_root: Path,
    requested_category: str | None,
    python_module: str | None,
) -> tuple[dict[str, Any], str]:
    direct_path = python_module_to_backend_path(backend_root, python_module)
    if direct_path is not None:
        relative = direct_path.relative_to(backend_root)
        return (
            {
                'absolute_path': str(direct_path),
                'relative_path': str(relative).replace('\\', '/'),
                'category': direct_path.parent.name,
                'module': '.'.join(relative.with_suffix('').parts[1:]),
                'file_stem': direct_path.stem,
                'classes': [],
            },
            'python_module',
        )

    query = normalize_search_text(requested_name)
    requested_category = requested_category.lower() if requested_category else None
    candidates = scan_backend_candidates(backend_root)
    filtered = [
        candidate
        for candidate in candidates
        if not requested_category or candidate['category'] == requested_category
    ]
    if not filtered:
        raise RuntimeError('No backend node candidates found during AST scan.')

    scored: list[tuple[float, dict[str, Any]]] = []
    for candidate in filtered:
        names = [candidate['file_stem'], *candidate['classes']]
        score = 0.0
        for name in names:
            normalized_name = normalize_search_text(name)
            local_score = SequenceMatcher(None, query, normalized_name).ratio()
            if query and (query == normalized_name or query in normalized_name):
                local_score += 0.2
            score = max(score, min(local_score, 1.0))
        scored.append((score, candidate))

    scored.sort(
        key=lambda item: (-item[0], item[1]['relative_path']),
    )
    best_score, best_candidate = scored[0]
    if best_score < 0.45:
        raise RuntimeError(
            f'Unable to resolve backend source for "{requested_name}" via AST scan.'
        )
    return best_candidate, 'ast_scan'


def infer_suggested_input_attr_name(node_definition: dict[str, Any]) -> str | None:
    input_definitions = node_definition.get('input_definitions') or {}
    for attr_name, input_definition in input_definitions.items():
        if attr_name in SYSTEM_INPUT_NAMES:
            continue
        if input_definition.get('is_hidden'):
            continue
        return attr_name
    return None


def build_context(
    *,
    requested_name: str,
    requested_category: str | None,
    resolved_node_name: str,
    node_definition: dict[str, Any],
    match_type: str,
    match_candidates: list[dict[str, Any]],
    backend_candidate: dict[str, Any],
    backend_resolution: str,
    project_root: Path,
) -> dict[str, Any]:
    category = backend_candidate['category']
    file_stem = backend_candidate.get('file_stem') or pascal_to_snake(resolved_node_name)
    folder_name = file_stem.replace('_', '-')
    component_name = resolved_node_name

    return {
        'requested_node_name': requested_name,
        'requested_category': requested_category,
        'match_type': match_type,
        'match_candidates': match_candidates,
        'resolved_node_name': resolved_node_name,
        'project_root': str(project_root),
        'suggested_input_attr_name': infer_suggested_input_attr_name(node_definition),
        'node_definition': node_definition,
        'backend': {
            'category': category,
            'resolution': backend_resolution,
            'absolute_path': backend_candidate['absolute_path'],
            'relative_path': backend_candidate['relative_path'],
            'module': backend_candidate['module'],
        },
        'frontend': {
            'category': category,
            'folder_name': folder_name,
            'component_name': component_name,
            'extension_const_name': f'{component_name}Extension',
            'extension_id': file_stem,
            'relative_dir': f'src/node-extensions/{category}/{folder_name}',
            'absolute_dir': str(
                project_root / 'src' / 'node-extensions' / category / folder_name
            ),
            'import_path': f'@/node-extensions/{category}/{folder_name}',
        },
    }


def registry_paths(project_root: Path) -> tuple[Path, str]:
    registry_path = (
        project_root
        / 'src'
        / 'app'
        / 'providers'
        / 'node-extensions'
        / 'registry.ts'
    )
    anchor = "import { NodeExtensionsRegistry } from './lib/registry.ts';"
    return registry_path, anchor


def update_registry(
    project_root: Path,
    *,
    import_path: str,
    extension_symbol: str,
) -> dict[str, bool]:
    registry_path, anchor = registry_paths(project_root)
    content = registry_path.read_text(encoding='utf-8')
    import_line = f"import {extension_symbol} from '{import_path}';"
    import_added = False
    register_added = False

    if import_line not in content:
        if anchor not in content:
            raise RuntimeError(
                f'Unable to find registry import anchor in {registry_path}.'
            )
        content = content.replace(anchor, f'{import_line}\n{anchor}')
        import_added = True

    marker = 'nodeExtensionsRegistry.register('
    start = content.find(marker)
    end = content.find('\n);', start)
    if start == -1 or end == -1:
        raise RuntimeError(
            f'Unable to find register(...) call in {registry_path}.'
        )

    register_block = content[start:end]
    if extension_symbol not in register_block:
        content = content[:end] + f',\n  {extension_symbol}' + content[end:]
        register_added = True

    if import_added or register_added:
        registry_path.write_text(content, encoding='utf-8')

    return {
        'import_added': import_added,
        'register_added': register_added,
    }


def find_project_root(start_path: Path) -> Path:
    current = start_path.resolve()
    for candidate in [current, *current.parents]:
        if (candidate / '.env').exists() and (candidate / 'src').exists():
            return candidate
    raise RuntimeError(
        f'Unable to detect dvt_ui project root from {start_path}.'
    )


def format_summary_lines(items: Iterable[tuple[str, Any]]) -> str:
    return '\n'.join(f'{key}: {value}' for key, value in items)
