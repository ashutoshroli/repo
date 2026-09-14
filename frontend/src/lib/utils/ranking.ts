export const TOP_RANK_LIMIT = 5;

export interface Ranked<T> {
  item: T;
  rank: number;
  isTop: boolean;
}

export function competitionRank<T>(
  sortedDesc: T[],
  getAmount: (item: T) => number,
  maxTopRank: number = TOP_RANK_LIMIT
): Ranked<T>[] {
  const out: Ranked<T>[] = [];
  let lastAmount: number | null = null;
  let lastRank = 0;

  sortedDesc.forEach((item, index) => {
    const amount = getAmount(item);
    let rank: number;
    if (lastAmount !== null && amount === lastAmount) {
      rank = lastRank;
    } else {
      rank = index + 1;
      lastAmount = amount;
      lastRank = rank;
    }
    out.push({ item, rank, isTop: rank <= maxTopRank });
  });

  return out;
}
