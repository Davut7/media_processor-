export type SortDirection = 'ASC' | 'DESC';

export function getSortParams(sort: string) {
  const splittedSort = sort.split('_');
  const orderDirection = splittedSort.pop() as SortDirection;
  const orderField = splittedSort.join('_');
  return { orderDirection, orderField };
}
