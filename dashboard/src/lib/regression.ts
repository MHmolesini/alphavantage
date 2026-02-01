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
    const r2 = 1 - (ssRes / (ssTot || 1));

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
    const r2 = 1 - (ssRes / (ssTot || 1));

    return {
        points,
        predict,
        equation: `y = ${a.toFixed(2)} + ${b.toFixed(2)} ln(x)`,
        r2
    };
}

/**
 * Polynomial Regression: y = a_0 + a_1*x + ... + a_k*x^k
 */
export function polynomialRegression(data: Point[], order: number = 2): RegressionResult {
    const n = data.length;
    if (n === 0) return { points: [], predict: () => 0, equation: "", r2: 0 };

    // 1. Prepare Matrix System (Least Squares)
    // We solve A * Coefficients = B
    // A matrix size (order+1) x (order+1)
    // B vector size (order+1)

    const lhs: number[][] = [];
    const rhs: number[] = [];

    const k = order + 1;

    for (let i = 0; i < k; i++) {
        lhs[i] = [];
        for (let j = 0; j < k; j++) {
            // Sum of x^(i+j)
            let sum = 0;
            for (const p of data) sum += Math.pow(p[0], i + j);
            lhs[i][j] = sum;
        }

        // Sum of y * x^i
        let sumY = 0;
        for (const p of data) sumY += p[1] * Math.pow(p[0], i);
        rhs[i] = sumY;
    }

    // Solve Linear Method
    const coeffs = gaussianElimination(lhs, rhs);

    const predict = (x: number) => {
        let y = 0;
        for (let i = 0; i < coeffs.length; i++) {
            y += coeffs[i] * Math.pow(x, i);
        }
        return y;
    };

    // Sort X for plotting line
    const sortedData = [...data].sort((a, b) => a[0] - b[0]);
    // Generate smooth points (optional, or just point-to-point?)
    // Linear had point-to-point. Polynomial might need more resolution if curved?
    // Let's use the data points x-coords for now to keep it keyed to data.
    const points: Point[] = sortedData.map(([x]) => [x, predict(x)] as Point);

    // R2 Calcs
    let sumY = 0;
    for (const p of data) sumY += p[1];
    const yMean = sumY / n;

    let ssTot = 0, ssRes = 0;
    for (const p of data) {
        const y = p[1];
        const yPred = predict(p[0]);
        ssTot += (y - yMean) ** 2;
        ssRes += (y - yPred) ** 2;
    }
    const r2 = 1 - (ssRes / (ssTot || 1)); // Avoid div0

    // Equation String
    let eq = "y = ";
    for (let i = coeffs.length - 1; i >= 0; i--) {
        const c = coeffs[i];
        if (i === 0) eq += c.toFixed(2);
        else eq += `${c.toFixed(2)}x^${i} + `;
    }

    return { points, predict, equation: eq, r2 };
}

function gaussianElimination(A: number[][], b: number[]): number[] {
    const n = b.length;
    for (let p = 0; p < n; p++) {
        // Find pivot
        let max = p;
        for (let i = p + 1; i < n; i++) {
            if (Math.abs(A[i][p]) > Math.abs(A[max][p])) {
                max = i;
            }
        }

        // Swap
        [A[p], A[max]] = [A[max], A[p]];
        [b[p], b[max]] = [b[max], b[p]];

        // If very small match, skip to avoid instability
        if (Math.abs(A[p][p]) <= 1e-10) {
            // Matrix singular or unstable? Return 0s or handle error
            // For now return 0s if fails
            return new Array(n).fill(0);
        }

        // Pivot
        for (let i = p + 1; i < n; i++) {
            const alpha = A[i][p] / A[p][p];
            b[i] -= alpha * b[p];
            for (let j = p; j < n; j++) {
                A[i][j] -= alpha * A[p][j];
            }
        }
    }

    // Back substitution
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        let sum = 0;
        for (let j = i + 1; j < n; j++) {
            sum += A[i][j] * x[j];
        }
        x[i] = (b[i] - sum) / A[i][i];
    }
    return x;
}
