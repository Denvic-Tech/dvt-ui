import React from 'react';

import {
  DetailBody,
  DetailFieldWrap,
  DetailIconWrap,
  DetailLabel,
  DetailValue,
} from './styled.ts';

interface DetailFieldProps {
  icon: React.ReactNode;
  label: string;
  mono?: boolean | undefined;
  value: string;
}

export const DetailField: React.FC<DetailFieldProps> = ({
  icon,
  label,
  mono = false,
  value,
}) => {
  return (
    <DetailFieldWrap>
      <DetailIconWrap>{icon}</DetailIconWrap>
      <DetailBody>
        <DetailLabel>{label}</DetailLabel>
        <DetailValue mono={mono} title={value}>
          {value}
        </DetailValue>
      </DetailBody>
    </DetailFieldWrap>
  );
};
