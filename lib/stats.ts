export function mean(arr: number[]): number {
  if (!arr || arr.length === 0) return NaN;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function stdDev(arr: number[]): number {
  if (!arr || arr.length <= 1) return NaN;
  const m = mean(arr);
  const variance = arr.reduce((a, b) => a + Math.pow(b - m, 2), 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

export function median(arr: number[]): number {
  if (!arr || arr.length === 0) return NaN;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function pearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return NaN;
  const meanX = mean(x);
  const meanY = mean(y);
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < x.length; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    num += diffX * diffY;
    denX += diffX * diffX;
    denY += diffY * diffY;
  }
  return denX > 0 && denY > 0 ? num / Math.sqrt(denX * denY) : NaN;
}

export function cronbachAlpha(itemsMatrix: number[][]): number {
  if (!itemsMatrix || itemsMatrix.length === 0 || itemsMatrix[0].length < 2) return NaN;
  const k = itemsMatrix[0].length;
  const itemVariances = [];
  
  for (let j = 0; j < k; j++) {
    const col = itemsMatrix.map(row => row[j]);
    const m = mean(col);
    const variance = col.reduce((a, b) => a + Math.pow(b - m, 2), 0) / (col.length - 1); // Sample variance
    itemVariances.push(variance);
  }
  const sumItemVariances = itemVariances.reduce((a, b) => a + b, 0);
  
  const totalScores = itemsMatrix.map(row => row.reduce((a, b) => a + b, 0));
  const mTotal = mean(totalScores);
  const varianceTotal = totalScores.reduce((a, b) => a + Math.pow(b - mTotal, 2), 0) / (totalScores.length - 1);

  if (varianceTotal === 0) return NaN;
  return (k / (k - 1)) * (1 - sumItemVariances / varianceTotal);
}

export function itemTotalCorrelation(itemsMatrix: number[][]): number[] {
  if (!itemsMatrix || itemsMatrix.length === 0 || itemsMatrix[0].length === 0) return [];
  const k = itemsMatrix[0].length;
  const totalScores = itemsMatrix.map(row => row.reduce((a, b) => a + b, 0));
  
  const correlations = [];
  for (let j = 0; j < k; j++) {
    const col = itemsMatrix.map(row => row[j]);
    correlations.push(pearsonCorrelation(col, totalScores));
  }
  return correlations;
}
