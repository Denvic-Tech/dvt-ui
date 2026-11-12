import { styled } from '@mui/material/styles';

import { tokens } from '@/shared/ui/clean-minimal/tokens';

import { getPreviewRowCountLabel } from '../lib/rowCount';

/** Правый край строки вкладок на «Предпросмотре»: «18 из ~ 5 000 000 строк». */
const RowCountText = styled('span')({
  flex: 'none',
  marginLeft: 'auto',
  fontSize: 12.5,
  color: tokens.textSubtle,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
  '& b': { fontWeight: 500, color: tokens.textSecondary },
});

type DataPreviewRowCountProps = {
  shownRows: number;
  rowCount: number | null;
  rowCountExact: boolean;
};

/** Ничего не рисует, если источник не сообщил число строк. */
export const DataPreviewRowCount = (props: DataPreviewRowCountProps) => {
  const label = getPreviewRowCountLabel(props);
  if (!label) return null;

  return (
    <RowCountText>
      <b>{label.shown}</b> из {label.isEstimate ? '~ ' : null}
      <b>{label.total}</b> {label.unit}
    </RowCountText>
  );
};
