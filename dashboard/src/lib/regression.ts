export type Point = [number, number];

export interface RegressionResult {
    points: Point[];
    predict: (x: number) => number;
    equation: string;
    r2: number;
}

/**
 * Linear Regression: y = mx + c
 */
export function linearRegression(data: Point[]): RegressionResult {
    const n = data.length;
    if (n === 0) return { points: [], predict: () => 0, equation: "", r2: 0 };

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;

    for (let i = 0; i < n; i++) {
        const [x, y] = data[i];
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
        sumYY += y * y;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const predict = (x: number) => slope * x + intercept;

    const points: Point[] = data.map(([x]) => [x, predict(x)] as Point).sort((a, b) => a[0] - b[0]);
    // Allow extrapolation? For now just sort by X

    // R2 Calculation
    const yMean = sumY / n;
    let ssTot = 0, ssRes = 0;
    for (let i = 0; i < n; i++) {
        const [x, y] = data[i];
        const yPred = predict(x);
        ssTot += (y - yMean) ** 2;
        ssRes += (y - yPred) ** 2;
    }
    const r2 = 1 - (ssRes / ssTot);

    return {
        points,
        predict,
        equation: `y = ${slope.toFixed(2)}x + ${intercept.toFixed(2)}`,
        r2
    };
}

/**
 * Logarithmic Regression: y = a + b * ln(x)
 */
export function logarithmicRegression(data: Point[]): RegressionResult {
    const validData = data.filter(d => d[0] > 0); // X must be > 0
    const n = validData.length;
    if (n === 0) return { points: [], predict: () => 0, equation: "", r2: 0 };

    let sumOps = 0, sumY = 0, sumYOps = 0, sumOpsOps = 0;

    for (let i = 0; i < n; i++) {
        const [x, y] = validData[i];
        const lx = Math.log(x);
        sumOps += lx;
        sumY += y;
        sumYOps += y * lx;
        sumOpsOps += lx * lx;
    }

    const b = (n * sumYOps - sumY * sumOps) / (n * sumOpsOps - sumOps * sumOps);
    const a = (sumY - b * sumOps) / n;

    const predict = (x: number) => a + b * Math.log(x);

    const points: Point[] = validData.map(([x]) => [x, predict(x)] as Point).sort((a, b) => a[0] - b[0]);

    // R2
    const yMean = sumY / n;
    let ssTot = 0, ssRes = 0;
    for (let i = 0; i < n; i++) {
        const [x, y] = validData[i];
        const yPred = predict(x);
        ssTot += (y - yMean) ** 2;
        ssRes += (y - yPred) ** 2;
    }
    const r2 = 1 - (ssRes / ssTot);

    return {
        points,
        predict,
        equation: `y = ${a.toFixed(2)} + ${b.toFixed(2)} ln(x)`,
        r2
    };
}
