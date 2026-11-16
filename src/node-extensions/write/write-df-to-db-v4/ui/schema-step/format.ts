/** «10 колонок», «1 колонка», «3 колонки». */
export const formatColumnCount = (count: number) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? 'колонка'
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? 'колонки'
        : 'колонок';
  return `${count} ${word}`;
};
