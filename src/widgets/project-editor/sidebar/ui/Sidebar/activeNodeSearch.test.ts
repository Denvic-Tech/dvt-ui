import { describe, expect, it } from 'vitest';

import type { CustomNodeType } from '@/entities/project-editor/graph';

import type { NodeDefinition, NodeInputValue } from '@/shared/gatewayClient';
import {
  makeConst,
  makeExpressionValue,
  type NodeInputValuesMap,
} from '@/shared/lib/node-input-values';

import { buildActiveNodeSearchText } from './activeNodeSearch';

const makeNode = (
  inputValues: NodeInputValuesMap = {},
  comment?: string
): CustomNodeType => ({
  id: 'node-search-target',
  type: 'custom',
  position: { x: 0, y: 0 },
  data: {
    name: 'ReadTable',
    displayName: 'Read source table',
    ...(comment === undefined ? {} : { comment }),
    inputValues,
  },
});

const definition = {
  name: 'ReadTable',
  display_name: 'Read Table',
  category: 'Extraction',
  tags: ['database', 'source'],
} as NodeDefinition;

describe('buildActiveNodeSearchText', () => {
  it('includes existing node metadata and the comment', () => {
    const searchText = buildActiveNodeSearchText(
      makeNode({}, 'Loads prepared ERP expenses'),
      definition
    );

    expect(searchText).toContain('read source table');
    expect(searchText).toContain('node-search-target');
    expect(searchText).toContain('extraction');
    expect(searchText).toContain('database');
    expect(searchText).toContain('loads prepared erp expenses');
  });

  it('finds table_name inside nested constant objects and arrays', () => {
    const searchText = buildActiveNodeSearchText(
      makeNode({
        target: makeConst({
          selectors: [{ table_name: 'dev_ERP_ValPrib_Rashod_prepare' }],
        }),
      })
    );

    expect(searchText).toContain('dev_erp_valprib_rashod_prepare');
  });

  it('includes path values nested in a composite selector', () => {
    const searchText = buildActiveNodeSearchText(
      makeNode({
        path: makeConst({
          connection: 'warehouse',
          segments: ['prepared', 'expenses.parquet'],
        }),
      })
    );

    expect(searchText).toContain('warehouse');
    expect(searchText).toContain('expenses.parquet');
  });

  it('includes sql_code expressions and code constants', () => {
    const searchText = buildActiveNodeSearchText(
      makeNode({
        sql_code: makeExpressionValue(
          'SELECT * FROM dev_ERP_ValPrib_Rashod_prepare',
          'template'
        ),
        code: makeConst({
          lines: ['df = load_table("prepared_expenses")'],
        }),
      })
    );

    expect(searchText).toContain(
      'select * from dev_erp_valprib_rashod_prepare'
    );
    expect(searchText).toContain('prepared_expenses');
  });

  it('ignores unrelated input fields and linked target values', () => {
    const linkedTable: NodeInputValue = {
      __dvt_type: 'link',
      node_id: 'dev_ERP_ValPrib_Rashod_prepare',
      output_name: 'table',
    };
    const searchText = buildActiveNodeSearchText(
      makeNode({
        unrelated_setting: makeConst('private_search_token'),
        table_name: linkedTable,
      })
    );

    expect(searchText).not.toContain('private_search_token');
    expect(searchText).not.toContain('dev_erp_valprib_rashod_prepare');
  });
});
