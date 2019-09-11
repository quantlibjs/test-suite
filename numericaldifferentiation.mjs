import { Array1D, Array2D, Factorial, NumericalDifferentiation, QL_EPSILON, inv } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql/ql.mjs';

function isTheSame(a, b) {
    const eps = 500 * QL_EPSILON;
    if (Math.abs(b) < QL_EPSILON) {
        return Math.abs(a) < eps;
    }
    else {
        return Math.abs((a - b) / b) < eps;
    }
}

function checkTwoArraysAreTheSame(calculated, expected) {
    const correct = (calculated.length === expected.length) &&
        Array1D.equal(calculated, expected, isTheSame);
    expect(correct).toBeTruthy();
}

function singleValueTest(comment, calculated, expected, tol) {
    expect(Math.abs(calculated - expected)).toBeLessThan(tol);
}

function vandermondeCoefficients(order, x, gridPoints) {
    const q = Array1D.subScalar(gridPoints, x);
    const n = gridPoints.length;
    const m = Array2D.newMatrix(n, n, 1.0);
    for (let i = 1; i < n; ++i) {
        const fact = Factorial.get(i);
        for (let j = 0; j < n; ++j) {
            m[i][j] = Math.pow(q[j], i) / fact;
        }
    }
    const b = Array1D.fromSizeValue(n, 0.0);
    b[order] = 1.0;
    return Array2D.mulVector(inv(m), b);
}

describe('NumericalDifferentiation tests', () => {
    it('Testing numerical differentiation using the central scheme...', () => {
        const f = null;
        const central = NumericalDifferentiation.Scheme.Central;
        checkTwoArraysAreTheSame(new NumericalDifferentiation().init2(f, 1, 1.0, 3, central).weights(), [-0.5, 0.0, 0.5]);
        checkTwoArraysAreTheSame(new NumericalDifferentiation().init2(f, 1, 0.5, 3, central).weights(), [-1.0, 0.0, 1.0]);
        checkTwoArraysAreTheSame(new NumericalDifferentiation().init2(f, 1, 0.25, 7, central).weights(), [-4 / 60.0, 12 / 20.0, -12 / 4.0, 0.0, 12 / 4.0, -12 / 20.0, 4 / 60.0]);
        checkTwoArraysAreTheSame(new NumericalDifferentiation()
            .init2(f, 4, Math.pow(0.5, 0.25), 9, central)
            .weights(), [
            14 / 240.0, -4 / 5.0, 338 / 60.0, -244 / 15.0, 182 / 8.0, -244 / 15.0,
            338 / 60.0, -4 / 5.0, 14 / 240.0
        ]);
        checkTwoArraysAreTheSame(new NumericalDifferentiation().init2(f, 1, 0.5, 7, central).offsets(), [-1.5, -1.0, -0.5, 0.0, 0.5, 1.0, 1.5]);
    });
    it('Testing numerical differentiation using the backward scheme...', () => {
        const f = null;
        const backward = NumericalDifferentiation.Scheme.Backward;
        checkTwoArraysAreTheSame(new NumericalDifferentiation().init2(f, 1, 1.0, 2, backward).weights(), [1.0, -1.0]);
        checkTwoArraysAreTheSame(new NumericalDifferentiation().init2(f, 2, 2.0, 4, backward).weights(), [2 / 4.0, -5 / 4.0, 4 / 4.0, -1.0 / 4.0]);
        checkTwoArraysAreTheSame(new NumericalDifferentiation().init2(f, 4, 1.0, 6, backward).weights(), [3, -14, 26, -24, 11, -2]);
        checkTwoArraysAreTheSame(new NumericalDifferentiation().init2(f, 2, 0.5, 4, backward).offsets(), [0.0, -0.5, -1.0, -1.5]);
    });
    it('Testing numerical differentiation using the Forward scheme...', () => {
        const f = null;
        const forward = NumericalDifferentiation.Scheme.Forward;
        checkTwoArraysAreTheSame(new NumericalDifferentiation().init2(f, 1, 1.0, 2, forward).weights(), [-1.0, 1.0]);
        checkTwoArraysAreTheSame(new NumericalDifferentiation().init2(f, 1, 0.5, 3, forward).weights(), [-6 / 2.0, 4.0, -2 / 2.0]);
        checkTwoArraysAreTheSame(new NumericalDifferentiation().init2(f, 1, 0.5, 7, forward).weights(), [-98 / 20.0, 12.0, -30 / 2.0, 40 / 3.0, -30 / 4.0, 12 / 5.0, -2 / 6.0]);
        checkTwoArraysAreTheSame(new NumericalDifferentiation().init2(f, 2, 0.5, 4, forward).offsets(), [0.0, 0.5, 1.0, 1.5]);
    });
    it('Testing numerical differentiation of first' +
        ' order using an irregular scheme...', () => {
        const f = null;
        const h1 = 5e-7;
        const h2 = 3e-6;
        const alpha = -h2 / (h1 * (h1 + h2));
        const gamma = h1 / (h2 * (h1 + h2));
        const beta = -alpha - gamma;
        const tmp = [-h1, 0.0, h2];
        const offsets = Array1D.clone(tmp);
        checkTwoArraysAreTheSame(new NumericalDifferentiation().init1(f, 1, offsets).weights(), [alpha, beta, gamma]);
    });
    it('Testing numerical differentiation of second order' +
        ' using an irregular scheme...', () => {
        const f = null;
        const h1 = 2e-7;
        const h2 = 8e-8;
        const alpha = 2 / (h1 * (h1 + h2));
        const gamma = 2 / (h2 * (h1 + h2));
        const beta = -alpha - gamma;
        const tmp = [-h1, 0.0, h2];
        const offsets = Array1D.clone(tmp);
        checkTwoArraysAreTheSame(new NumericalDifferentiation().init1(f, 2, offsets).weights(), [alpha, beta, gamma]);
    });
    it('Testing numerical differentiation of sin function...', () => {
        const f = { f: Math.sin };
        const df_central = new NumericalDifferentiation().init2(f, 1, Math.sqrt(QL_EPSILON), 3, NumericalDifferentiation.Scheme.Central);
        const df_backward = new NumericalDifferentiation().init2(f, 1, Math.sqrt(QL_EPSILON), 3, NumericalDifferentiation.Scheme.Backward);
        const df_forward = new NumericalDifferentiation().init2(f, 1, Math.sqrt(QL_EPSILON), 3, NumericalDifferentiation.Scheme.Forward);
        for (let x = 0.0; x < 5.0; x += 0.1) {
            const calculatedCentral = df_central.f(x);
            const calculatedBackward = df_backward.f(x);
            const calculatedForward = df_forward.f(x);
            const expected = Math.cos(x);
            singleValueTest('central first', calculatedCentral, expected, 1e-8);
            singleValueTest('backward first', calculatedBackward, expected, 1e-6);
            singleValueTest('forward first', calculatedForward, expected, 1e-6);
        }
        const df4_central = new NumericalDifferentiation().init2(f, 4, 1e-2, 7, NumericalDifferentiation.Scheme.Central);
        const df4_backward = new NumericalDifferentiation().init2(f, 4, 1e-2, 7, NumericalDifferentiation.Scheme.Backward);
        const df4_forward = new NumericalDifferentiation().init2(f, 4, 1e-2, 7, NumericalDifferentiation.Scheme.Forward);
        for (let x = 0.0; x < 5.0; x += 0.1) {
            const calculatedCentral = df4_central.f(x);
            const calculatedBackward = df4_backward.f(x);
            const calculatedForward = df4_forward.f(x);
            const expected = Math.sin(x);
            singleValueTest('central 4th', calculatedCentral, expected, 1e-4);
            singleValueTest('backward 4th', calculatedBackward, expected, 1e-4);
            singleValueTest('forward 4th', calculatedForward, expected, 1e-4);
        }
        const tmp = [-0.01, -0.02, 0.03, 0.014, 0.041];
        const offsets = Array.from(tmp);
        const df3_irregular = new NumericalDifferentiation().init1(f, 3, offsets);
        checkTwoArraysAreTheSame(df3_irregular.offsets(), offsets);
        for (let x = 0.0; x < 5.0; x += 0.1) {
            const calculatedIrregular = df3_irregular.f(x);
            const expected = -Math.cos(x);
            singleValueTest('irregular 3th', calculatedIrregular, expected, 5e-5);
        }
    });
    it('Testing coefficients from numerical differentiation' +
        ' by comparison with results from Vandermonde matrix inversion...', () => {
        const f = null;
        for (let order = 0; order < 5; ++order) {
            for (let nGridPoints = order + 1; nGridPoints < order + 3; ++nGridPoints) {
                const gridPoints = new Array(nGridPoints);
                for (let i = 0; i < nGridPoints; ++i) {
                    const p = i;
                    gridPoints[i] = Math.sin(p) + Math.cos(p);
                }
                const x = 0.3902842;
                const weightsVandermonde = vandermondeCoefficients(order, x, gridPoints);
                const nd = new NumericalDifferentiation().init1(f, order, Array1D.subScalar(gridPoints, x));
                checkTwoArraysAreTheSame(gridPoints, Array1D.addScalar(nd.offsets(), x));
                checkTwoArraysAreTheSame(weightsVandermonde, nd.weights());
            }
        }
    });
});