import { Array1D, Array2D, BackwardFlat, BackwardFlatInterpolation, BicubicSpline, BSpline, Comparison, CubicInterpolation, EndCriteria, ForwardFlatInterpolation, FritschButlandCubic, GaussianKernel, HaltonRsg, KernelInterpolation, KernelInterpolation2D, LagrangeInterpolation, LevenbergMarquardt, LinearInterpolation, M_PI, MultiCubicSpline, NoArbSabrInterpolation, NoArbSabrModel, NoArbSabrSmileSection, NoArbSabrSpecs, QL_EPSILON, QL_NULL_REAL, RichardsonExtrapolation, SABRInterpolation, SABRSpecs, sabrVolatility, Simplex, SimpsonIntegral, SobolRsg, validateSabrParameters } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

function xRange(start, finish, points) {
    const x = new Array(points);
    const dx = (finish - start) / (points - 1);
    for (let i = 0; i < points - 1; i++) {
        x[i] = start + i * dx;
    }
    x[points - 1] = finish;
    return x;
}

function gaussian(x) {
    const y = new Array(x.length);
    for (let i = 0; i < x.length; i++) {
        y[i] = Math.exp(-x[i] * x[i]);
    }
    return y;
}

function parabolic(x) {
    const y = new Array(x.length);
    for (let i = 0; i < x.length; i++) {
        y[i] = -x[i] * x[i];
    }
    return y;
}

function checkValues(cubic, x, xBegin, xEnd, y, yBegin) {
    const tolerance = 2.0e-15;
    for (let i = xBegin; i < xEnd; i++) {
        const interpolated = cubic.f(x[xBegin + i]);
        expect(Math.abs(interpolated - y[yBegin + i])).toBeLessThan(tolerance);
    }
}

function check1stDerivativeValue(cubic, x, value) {
    const tolerance = 1.0e-14;
    const interpolated = cubic.derivative(x);
    const error = Math.abs(interpolated - value);
    expect(error).toBeLessThan(tolerance);
}

function check2ndDerivativeValue(cubic, x, value) {
    const tolerance = 1.0e-13;
    const interpolated = cubic.secondDerivative(x);
    const error = Math.abs(interpolated - value);
    expect(error).toBeLessThan(tolerance);
}

function checkNotAKnotCondition(cubic) {
    const tolerance = 1.0e-14;
    const c = cubic.cCoefficients();
    expect(Math.abs(c[0] - c[1])).toBeLessThan(tolerance);
    const n = c.length;
    expect(Math.abs(c[n - 2] - c[n - 1])).toBeLessThan(tolerance);
}

function checkSymmetry(cubic, xMin) {
    const tolerance = 1.0e-15;
    for (let x = xMin; x < 0.0; x += 0.1) {
        const y1 = cubic.f(x), y2 = cubic.f(-x);
        expect(Math.abs(y1 - y2)).toBeLessThan(tolerance);
    }
}

class errorFunction {
    constructor(f) {
        this._f = f;
    }
    f(x) {
        const temp = this._f.f(x) - Math.exp(-x * x);
        return temp * temp;
    }
}

function make_error_function(f) {
    return new errorFunction(f);
}

function multif(s, t, u, v, w) {
  return Math.sqrt(s * Math.sinh(Math.log(t)) + Math.exp(Math.sin(u) * Math.sin(3 * v)) +
      Math.sinh(Math.log(v * w)));
}

function epanechnikovKernel(u) {
  if (Math.abs(u) <= 1) {
      return (3.0 / 4.0) * (1 - u * u);
  }
  else {
      return 0.0;
  }
}

function f(h) {
  return Math.pow(1.0 + h, 1 / h);
}

function sign(y1, y2) {
    return y1 === y2 ? 0 : y1 < y2 ? 1 : -1;
}

function lagrangeTestFct(x) {
    return Math.abs(x) + 0.5 * x - x * x;
}

describe('Interpolation tests', () => {
    it('Testing spline approximation on Gaussian data sets...', () => {
        const points = [5, 9, 17, 33];
        const tabulatedErrors = [3.5e-2, 2.0e-3, 4.0e-5, 1.8e-6];
        const toleranceOnTabErr = [0.1e-2, 0.1e-3, 0.1e-5, 0.1e-6];
        const tabulatedMCErrors = [1.7e-2, 2.0e-3, 4.0e-5, 1.8e-6];
        const toleranceOnTabMCErr = [0.1e-2, 0.1e-3, 0.1e-5, 0.1e-6];
        const integral = new SimpsonIntegral(1e-12, 10000);
        const scaleFactor = 1.9;
        for (let i = 0; i < points.length; i++) {
            const n = points[i];
            const x = xRange(-1.7, 1.9, n);
            const y = gaussian(x);
            let f = new CubicInterpolation(x, 0, x.length, y, 0, CubicInterpolation.DerivativeApprox.Spline, false, CubicInterpolation.BoundaryCondition.NotAKnot, QL_NULL_REAL, CubicInterpolation.BoundaryCondition.NotAKnot, QL_NULL_REAL);
            f.update();
            let result = Math.sqrt(integral.f(make_error_function(f), -1.7, 1.9));
            result /= scaleFactor;
            expect(Math.abs(result - tabulatedErrors[i]))
                .toBeLessThan(toleranceOnTabErr[i]);
            f = new CubicInterpolation(x, 0, x.length, y, 0, CubicInterpolation.DerivativeApprox.Spline, true, CubicInterpolation.BoundaryCondition.NotAKnot, QL_NULL_REAL, CubicInterpolation.BoundaryCondition.NotAKnot, QL_NULL_REAL);
            f.update();
            result = Math.sqrt(integral.f(make_error_function(f), -1.7, 1.9));
            result /= scaleFactor;
            expect(Math.abs(result - tabulatedMCErrors[i]))
                .toBeLessThan(toleranceOnTabMCErr[i]);
        }
    });

    it('Testing spline interpolation on a Gaussian data set...', () => {
        let interpolated, interpolated2;
        const n = 5;
        let x = new Array(n), y = new Array(n);
        const x1_bad = -1.7, x2_bad = 1.7;
        for (let start = -1.9, j = 0; j < 2; start += 0.2, j++) {
            x = xRange(start, start + 3.6, n);
            y = gaussian(x);
            let f = new CubicInterpolation(x, 0, x.length, y, 0, CubicInterpolation.DerivativeApprox.Spline, false, CubicInterpolation.BoundaryCondition.NotAKnot, QL_NULL_REAL, CubicInterpolation.BoundaryCondition.NotAKnot, QL_NULL_REAL);
            f.update();
            checkValues(f, x, 0, x.length, y, 0);
            checkNotAKnotCondition(f);
            interpolated = f.f(x1_bad);
            interpolated2 = f.f(x2_bad);
            expect(interpolated <= 0.0 || interpolated2 <= 0.0).toEqual(true);
            f = new CubicInterpolation(x, 0, x.length, y, 0, CubicInterpolation.DerivativeApprox.Spline, true, CubicInterpolation.BoundaryCondition.NotAKnot, QL_NULL_REAL, CubicInterpolation.BoundaryCondition.NotAKnot, QL_NULL_REAL);
            f.update();
            checkValues(f, x, 0, x.length, y, 0);
            interpolated = f.f(x1_bad);
            expect(interpolated).toBeGreaterThanOrEqual(0.0);
            interpolated = f.f(x2_bad);
            expect(interpolated).toBeGreaterThanOrEqual(0.0);
        }
    });

    it('Testing spline interpolation on RPN15A data set...', () => {
        const RPN15A_x = [7.99, 8.09, 8.19, 8.7, 9.2, 10.0, 12.0, 15.0, 20.0];
        const RPN15A_y = [
            0.0, 2.76429e-5, 4.37498e-5, 0.169183, 0.469428, 0.943740, 0.998636,
            0.999919, 0.999994
        ];
        let interpolated;
        let f = new CubicInterpolation(RPN15A_x, 0, RPN15A_x.length, RPN15A_y, 0, CubicInterpolation.DerivativeApprox.Spline, false, CubicInterpolation.BoundaryCondition.SecondDerivative, 0.0, CubicInterpolation.BoundaryCondition.SecondDerivative, 0.0);
        f.update();
        checkValues(f, RPN15A_x, 0, RPN15A_x.length, RPN15A_y, 0);
        check2ndDerivativeValue(f, RPN15A_x[0], 0.0);
        check2ndDerivativeValue(f, RPN15A_x[RPN15A_x.length - 1], 0.0);
        const x_bad = 11.0;
        interpolated = f.f(x_bad);
        expect(interpolated).toBeGreaterThanOrEqual(1.0);
        f = new CubicInterpolation(RPN15A_x, 0, RPN15A_x.length, RPN15A_y, 0, CubicInterpolation.DerivativeApprox.Spline, false, CubicInterpolation.BoundaryCondition.FirstDerivative, 0.0, CubicInterpolation.BoundaryCondition.FirstDerivative, 0.0);
        f.update();
        checkValues(f, RPN15A_x, 0, RPN15A_x.length, RPN15A_y, 0);
        check1stDerivativeValue(f, RPN15A_x[0], 0.0);
        check1stDerivativeValue(f, RPN15A_x[RPN15A_x.length - 1], 0.0);
        interpolated = f.f(x_bad);
        expect(interpolated).toBeGreaterThanOrEqual(1.0);
        f = new CubicInterpolation(RPN15A_x, 0, RPN15A_x.length, RPN15A_y, 0, CubicInterpolation.DerivativeApprox.Spline, false, CubicInterpolation.BoundaryCondition.NotAKnot, QL_NULL_REAL, CubicInterpolation.BoundaryCondition.NotAKnot, QL_NULL_REAL);
        f.update();
        checkValues(f, RPN15A_x, 0, RPN15A_x.length, RPN15A_y, 0);
        checkNotAKnotCondition(f);
        interpolated = f.f(x_bad);
        expect(interpolated).toBeGreaterThanOrEqual(1.0);
        f = new CubicInterpolation(RPN15A_x, 0, RPN15A_x.length, RPN15A_y, 0, CubicInterpolation.DerivativeApprox.Spline, true, CubicInterpolation.BoundaryCondition.SecondDerivative, 0.0, CubicInterpolation.BoundaryCondition.SecondDerivative, 0.0);
        f.update();
        checkValues(f, RPN15A_x, 0, RPN15A_x.length, RPN15A_y, 0);
        interpolated = f.f(x_bad);
        expect(interpolated).toBeLessThanOrEqual(1.0);
        f = new CubicInterpolation(RPN15A_x, 0, RPN15A_x.length, RPN15A_y, 0, CubicInterpolation.DerivativeApprox.Spline, true, CubicInterpolation.BoundaryCondition.FirstDerivative, 0.0, CubicInterpolation.BoundaryCondition.FirstDerivative, 0.0);
        f.update();
        checkValues(f, RPN15A_x, 0, RPN15A_x.length, RPN15A_y, 0);
        check1stDerivativeValue(f, RPN15A_x[0], 0.0);
        check1stDerivativeValue(f, RPN15A_x[RPN15A_x.length - 1], 0.0);
        interpolated = f.f(x_bad);
        expect(interpolated).toBeLessThanOrEqual(1.0);
        f = new CubicInterpolation(RPN15A_x, 0, RPN15A_x.length, RPN15A_y, 0, CubicInterpolation.DerivativeApprox.Spline, true, CubicInterpolation.BoundaryCondition.NotAKnot, QL_NULL_REAL, CubicInterpolation.BoundaryCondition.NotAKnot, QL_NULL_REAL);
        f.update();
        checkValues(f, RPN15A_x, 0, RPN15A_x.length, RPN15A_y, 0);
        interpolated = f.f(x_bad);
        expect(interpolated).toBeLessThanOrEqual(1.0);
    });

    it('Testing spline interpolation on generic values...', () => {
        const generic_x = [0.0, 1.0, 3.0, 4.0];
        const generic_y = [0.0, 0.0, 2.0, 2.0];
        const generic_natural_y2 = [0.0, 1.5, -1.5, 0.0];
        let interpolated, error;
        let i;
        const n = generic_x.length;
        const x35 = new Array(3);
        let f = new CubicInterpolation(generic_x, 0, generic_x.length, generic_y, 0, CubicInterpolation.DerivativeApprox.Spline, false, CubicInterpolation.BoundaryCondition.SecondDerivative, generic_natural_y2[0], CubicInterpolation.BoundaryCondition.SecondDerivative, generic_natural_y2[n - 1]);
        f.update();
        checkValues(f, generic_x, 0, generic_x.length, generic_y, 0);
        for (i = 0; i < n; i++) {
            interpolated = f.secondDerivative(generic_x[i]);
            error = interpolated - generic_natural_y2[i];
            expect(Math.abs(error)).toBeLessThan(3e-16);
        }
        x35[1] = f.f(3.5);
        const y1a = 0.0, y1b = 0.0;
        f = new CubicInterpolation(generic_x, 0, generic_x.length, generic_y, 0, CubicInterpolation.DerivativeApprox.Spline, false, CubicInterpolation.BoundaryCondition.FirstDerivative, y1a, CubicInterpolation.BoundaryCondition.FirstDerivative, y1b);
        f.update();
        checkValues(f, generic_x, 0, generic_x.length, generic_y, 0);
        check1stDerivativeValue(f, generic_x[0], 0.0);
        check1stDerivativeValue(f, generic_x[generic_x.length - 1], 0.0);
        x35[0] = f.f(3.5);
        f = new CubicInterpolation(generic_x, 0, generic_x.length, generic_y, 0, CubicInterpolation.DerivativeApprox.Spline, false, CubicInterpolation.BoundaryCondition.NotAKnot, QL_NULL_REAL, CubicInterpolation.BoundaryCondition.NotAKnot, QL_NULL_REAL);
        f.update();
        checkValues(f, generic_x, 0, generic_x.length, generic_y, 0);
        checkNotAKnotCondition(f);
        x35[2] = f.f(3.5);
        expect(x35[0] > x35[1] || x35[1] > x35[2]).toEqual(false);
    });

    it('Testing symmetry of spline interpolation end-conditions ...', () => {
        const n = 9;
        let x, y;
        x = xRange(-1.8, 1.8, n);
        y = gaussian(x);
        let f = new CubicInterpolation(x, 0, x.length, y, 0, CubicInterpolation.DerivativeApprox.Spline, false, CubicInterpolation.BoundaryCondition.NotAKnot, QL_NULL_REAL, CubicInterpolation.BoundaryCondition.NotAKnot, QL_NULL_REAL);
        f.update();
        checkValues(f, x, 0, x.length, y, 0);
        checkNotAKnotCondition(f);
        checkSymmetry(f, x[0]);
        f = new CubicInterpolation(x, 0, x.length, y, 0, CubicInterpolation.DerivativeApprox.Spline, true, CubicInterpolation.BoundaryCondition.NotAKnot, QL_NULL_REAL, CubicInterpolation.BoundaryCondition.NotAKnot, QL_NULL_REAL);
        f.update();
        checkValues(f, x, 0, x.length, y, 0);
        checkSymmetry(f, x[0]);
    });

    it('Testing derivative end-conditions for spline interpolation ...', () => {
        const n = 4;
        const x = xRange(-2.0, 2.0, n), y = parabolic(x);
        let f = new CubicInterpolation(x, 0, x.length, y, 0, CubicInterpolation.DerivativeApprox.Spline, false, CubicInterpolation.BoundaryCondition.NotAKnot, QL_NULL_REAL, CubicInterpolation.BoundaryCondition.NotAKnot, QL_NULL_REAL);
        f.update();
        checkValues(f, x, 0, x.length, y, 0);
        check1stDerivativeValue(f, x[0], 4.0);
        check1stDerivativeValue(f, x[n - 1], -4.0);
        check2ndDerivativeValue(f, x[0], -2.0);
        check2ndDerivativeValue(f, x[n - 1], -2.0);
        f = new CubicInterpolation(x, 0, x.length, y, 0, CubicInterpolation.DerivativeApprox.Spline, false, CubicInterpolation.BoundaryCondition.FirstDerivative, 4.0, CubicInterpolation.BoundaryCondition.FirstDerivative, -4.0);
        f.update();
        checkValues(f, x, 0, x.length, y, 0);
        check1stDerivativeValue(f, x[0], 4.0);
        check1stDerivativeValue(f, x[n - 1], -4.0);
        check2ndDerivativeValue(f, x[0], -2.0);
        check2ndDerivativeValue(f, x[n - 1], -2.0);
        f = new CubicInterpolation(x, 0, x.length, y, 0, CubicInterpolation.DerivativeApprox.Spline, false, CubicInterpolation.BoundaryCondition.SecondDerivative, -2.0, CubicInterpolation.BoundaryCondition.SecondDerivative, -2.0);
        f.update();
        checkValues(f, x, 0, x.length, y, 0);
        check1stDerivativeValue(f, x[0], 4.0);
        check1stDerivativeValue(f, x[n - 1], -4.0);
        check2ndDerivativeValue(f, x[0], -2.0);
        check2ndDerivativeValue(f, x[n - 1], -2.0);
        f = new CubicInterpolation(x, 0, x.length, y, 0, CubicInterpolation.DerivativeApprox.Spline, true, CubicInterpolation.BoundaryCondition.NotAKnot, QL_NULL_REAL, CubicInterpolation.BoundaryCondition.NotAKnot, QL_NULL_REAL);
        f.update();
        checkValues(f, x, 0, x.length, y, 0);
        check1stDerivativeValue(f, x[0], 4.0);
        check1stDerivativeValue(f, x[n - 1], -4.0);
        check2ndDerivativeValue(f, x[0], -2.0);
        check2ndDerivativeValue(f, x[n - 1], -2.0);
        f = new CubicInterpolation(x, 0, x.length, y, 0, CubicInterpolation.DerivativeApprox.Spline, true, CubicInterpolation.BoundaryCondition.FirstDerivative, 4.0, CubicInterpolation.BoundaryCondition.FirstDerivative, -4.0);
        f.update();
        checkValues(f, x, 0, x.length, y, 0);
        check1stDerivativeValue(f, x[0], 4.0);
        check1stDerivativeValue(f, x[n - 1], -4.0);
        check2ndDerivativeValue(f, x[0], -2.0);
        check2ndDerivativeValue(f, x[n - 1], -2.0);
        f = new CubicInterpolation(x, 0, x.length, y, 0, CubicInterpolation.DerivativeApprox.Spline, true, CubicInterpolation.BoundaryCondition.SecondDerivative, -2.0, CubicInterpolation.BoundaryCondition.SecondDerivative, -2.0);
        f.update();
        checkValues(f, x, 0, x.length, y, 0);
        check1stDerivativeValue(f, x[0], 4.0);
        check1stDerivativeValue(f, x[n - 1], -4.0);
        check2ndDerivativeValue(f, x[0], -2.0);
        check2ndDerivativeValue(f, x[n - 1], -2.0);
    });

    it('Testing non-restrictive Hyman filter...', () => {
        const n = 4;
        const x = xRange(-2.0, 2.0, n), y = parabolic(x);
        const zero = 0.0, expected = 0.0;
        let interpolated;
        let f = new CubicInterpolation(x, 0, x.length, y, 0, CubicInterpolation.DerivativeApprox.Spline, false, CubicInterpolation.BoundaryCondition.NotAKnot, QL_NULL_REAL, CubicInterpolation.BoundaryCondition.NotAKnot, QL_NULL_REAL);
        f.update();
        interpolated = f.f(zero);
        expect(Math.abs(interpolated - expected)).toBeLessThan(1e-15);
        f = new CubicInterpolation(x, 0, x.length, y, 0, CubicInterpolation.DerivativeApprox.Spline, false, CubicInterpolation.BoundaryCondition.FirstDerivative, 4.0, CubicInterpolation.BoundaryCondition.FirstDerivative, -4.0);
        f.update();
        interpolated = f.f(zero);
        expect(Math.abs(interpolated - expected)).toBeLessThan(1e-15);
        f = new CubicInterpolation(x, 0, x.length, y, 0, CubicInterpolation.DerivativeApprox.Spline, true, CubicInterpolation.BoundaryCondition.SecondDerivative, -2.0, CubicInterpolation.BoundaryCondition.SecondDerivative, -2.0);
        f.update();
        interpolated = f.f(zero);
        expect(Math.abs(interpolated - expected)).toBeLessThan(1e-15);
    });

    it('Testing N-dimensional cubic spline...', () => {
        const dim = new Array(5);
        dim[0] = 6;
        dim[1] = 5;
        dim[2] = 5;
        dim[3] = 6;
        dim[4] = 4;
        const args = new Array(5), offsets = new Array(5);
        offsets[0] = 1.005;
        offsets[1] = 14.0;
        offsets[2] = 33.005;
        offsets[3] = 35.025;
        offsets[4] = 19.025;
        let s = args[0] = offsets[0], t = args[1] = offsets[1], u = args[2] = offsets[2], v = args[3] = offsets[3], w = args[4] = offsets[4];
        let i, j, k, l, m;
        const grid = new Array(5);
        const r = 0.15;
        for (i = 0; i < 5; ++i) {
            let temp = offsets[i];
            for (j = 0; j < dim[i]; temp += r, ++j) {
                grid[i].push(temp);
            }
        }
        const y5 = [];
        for (i = 0; i < dim[0]; ++i) {
            for (j = 0; j < dim[1]; ++j) {
                for (k = 0; k < dim[2]; ++k) {
                    for (l = 0; l < dim[3]; ++l) {
                        for (m = 0; m < dim[4]; ++m) {
                            y5[i][j][k][l][m] = multif(grid[0][i], grid[1][j], grid[2][k], grid[3][l], grid[4][m]);
                        }
                    }
                }
            }
        }
        const cs = new MultiCubicSpline(grid, y5);
        for (i = 1; i < dim[0] - 1; ++i) {
            for (j = 1; j < dim[1] - 1; ++j) {
                for (k = 1; k < dim[2] - 1; ++k) {
                    for (l = 1; l < dim[3] - 1; ++l) {
                        for (m = 1; m < dim[4] - 1; ++m) {
                            s = grid[0][i];
                            t = grid[1][j];
                            u = grid[2][k];
                            v = grid[3][l];
                            w = grid[4][m];
                            const interpolated = cs.f(args);
                            const expected = y5[i][j][k][l][m];
                            const error = Math.abs(interpolated - expected);
                            const tolerance = 1e-16;
                            expect(error).toBeLessThan(tolerance);
                        }
                    }
                }
            }
        }
        const seed = 42;
        const rsg = new SobolRsg().init(5, seed);
        const tolerance = 1.7e-4;
        for (i = 0; i < 1023; ++i) {
            const next = Array.from(rsg.nextSequence().value);
            s = grid[0][0] + next[0] * (Array1D.back(grid[0]) - grid[0][0]);
            t = grid[1][0] + next[1] * (Array1D.back(grid[1]) - grid[1][0]);
            u = grid[2][0] + next[2] * (Array1D.back(grid[2]) - grid[2][0]);
            v = grid[3][0] + next[3] * (Array1D.back(grid[3]) - grid[3][0]);
            w = grid[4][0] + next[4] * (Array1D.back(grid[4]) - grid[4][0]);
            const interpolated = cs.f(args), expected = multif(s, t, u, v, w);
            const error = Math.abs(interpolated - expected);
            expect(error).toBeLessThan(tolerance);
        }
    });

    it('Testing use of interpolations as functors...', () => {
        const x = [0.0, 1.0, 2.0, 3.0, 4.0];
        const y = [5.0, 4.0, 3.0, 2.0, 1.0];
        const f = new LinearInterpolation(x, 0, 5, y, 0);
        f.update();
        const x2 = [-2.0, -1.0, 0.0, 1.0, 3.0, 4.0, 5.0, 6.0, 7.0];
        const N = x2.length;
        const tolerance = 1.0e-12;
        try {
            x2.map((x) => f.f(x));
            throw new Error('Not Thrown');
        }
        catch (e) {
        }
        f.enableExtrapolation();
        const y2 = x2.map((x) => f.f(x));
        for (let i = 0; i < N; i++) {
            const expected = 5.0 - x2[i];
            expect(Math.abs(y2[i] - expected)).toBeLessThan(tolerance);
        }
    });

    it('Testing Fritsch-Butland interpolation...', () => {
        const x = [0.0, 1.0, 2.0, 3.0, 4.0];
        const y = [
            [1.0, 2.0, 1.0, 1.0, 2.0], [1.0, 2.0, 1.0, 1.0, 1.0],
            [2.0, 1.0, 0.0, 2.0, 3.0]
        ];
        for (let i = 0; i < 3; ++i) {
            const f = new FritschButlandCubic(x, 0, x.length, y[i], 0);
            for (let j = 0; j < 4; ++j) {
                const left_knot = x[j];
                const expected_sign = sign(y[i][j], y[i][j + 1]);
                for (let k = 0; k < 10; ++k) {
                    const x1 = left_knot + k * 0.1, x2 = left_knot + (k + 1) * 0.1;
                    const y1 = f.f(x1), y2 = f.f(x2);
                    expect(sign(y1, y2)).toEqual(expected_sign);
                }
            }
        }
    });

    it('Testing backward-flat interpolation...', () => {
        const x = [0.0, 1.0, 2.0, 3.0, 4.0];
        const y = [5.0, 4.0, 3.0, 2.0, 1.0];
        const f = new BackwardFlatInterpolation(x, 0, x.length, y, 0);
        f.update();
        const N = x.length;
        let i;
        const tolerance = 1.0e-12;
        for (i = 0; i < N; i++) {
            const p = x[i];
            const calculated = f.f(p);
            const expected = y[i];
            expect(Math.abs(expected - calculated)).toBeLessThan(tolerance);
        }
        for (i = 0; i < N - 1; i++) {
            const p = (x[i] + x[i + 1]) / 2;
            const calculated = f.f(p);
            const expected = y[i + 1];
            expect(Math.abs(expected - calculated)).toBeLessThan(tolerance);
        }
        f.enableExtrapolation();
        let p = x[0] - 0.5;
        let calculated = f.f(p);
        let expected = y[0];
        expect(Math.abs(expected - calculated)).toBeLessThan(tolerance);
        p = x[N - 1] + 0.5;
        calculated = f.f(p);
        expected = y[N - 1];
        expect(Math.abs(expected - calculated)).toBeLessThan(tolerance);
        calculated = f.primitive(x[0]);
        expected = 0.0;
        expect(Math.abs(expected - calculated)).toBeLessThan(tolerance);
        let sum = 0.0;
        for (i = 1; i < N; i++) {
            sum += (x[i] - x[i - 1]) * y[i];
            const calculated = f.primitive(x[i]);
            const expected = sum;
            expect(Math.abs(expected - calculated)).toBeLessThan(tolerance);
        }
        sum = 0.0;
        for (i = 0; i < N - 1; i++) {
            const p = (x[i] + x[i + 1]) / 2;
            sum += (x[i + 1] - x[i]) * y[i + 1] / 2;
            const calculated = f.primitive(p);
            const expected = sum;
            sum += (x[i + 1] - x[i]) * y[i + 1] / 2;
            expect(Math.abs(expected - calculated)).toBeLessThan(tolerance);
        }
    });

    it('Testing forward-flat interpolation...', () => {
        const x = [0.0, 1.0, 2.0, 3.0, 4.0];
        const y = [5.0, 4.0, 3.0, 2.0, 1.0];
        const f = new ForwardFlatInterpolation(x, 0, x.length, y, 0);
        f.update();
        const N = x.length;
        let i;
        const tolerance = 1.0e-12;
        for (i = 0; i < N; i++) {
            const p = x[i];
            const calculated = f.f(p);
            const expected = y[i];
            expect(Math.abs(expected - calculated)).toBeLessThan(tolerance);
        }
        for (i = 0; i < N - 1; i++) {
            const p = (x[i] + x[i + 1]) / 2;
            const calculated = f.f(p);
            const expected = y[i];
            expect(Math.abs(expected - calculated)).toBeLessThan(tolerance);
        }
        f.enableExtrapolation();
        let p = x[0] - 0.5;
        let calculated = f.f(p);
        let expected = y[0];
        expect(Math.abs(expected - calculated)).toBeLessThan(tolerance);
        p = x[N - 1] + 0.5;
        calculated = f.f(p);
        expected = y[N - 1];
        expect(Math.abs(expected - calculated)).toBeLessThan(tolerance);
        calculated = f.primitive(x[0]);
        expected = 0.0;
        expect(Math.abs(expected - calculated)).toBeLessThan(tolerance);
        let sum = 0.0;
        for (i = 1; i < N; i++) {
            sum += (x[i] - x[i - 1]) * y[i - 1];
            const calculated = f.primitive(x[i]);
            const expected = sum;
            expect(Math.abs(expected - calculated)).toBeLessThan(tolerance);
        }
        sum = 0.0;
        for (i = 0; i < N - 1; i++) {
            const p = (x[i] + x[i + 1]) / 2;
            sum += (x[i + 1] - x[i]) * y[i] / 2;
            const calculated = f.primitive(p);
            const expected = sum;
            sum += (x[i + 1] - x[i]) * y[i] / 2;
            expect(Math.abs(expected - calculated)).toBeLessThan(tolerance);
        }
    });

    it('Testing Sabr interpolation...', () => {
        const tolerance = 1.0e-12;
        const strikes = new Array(31);
        const volatilities = new Array(31);
        strikes[0] = 0.03;
        strikes[1] = 0.032;
        strikes[2] = 0.034;
        strikes[3] = 0.036;
        strikes[4] = 0.038;
        strikes[5] = 0.04;
        strikes[6] = 0.042;
        strikes[7] = 0.044;
        strikes[8] = 0.046;
        strikes[9] = 0.048;
        strikes[10] = 0.05;
        strikes[11] = 0.052;
        strikes[12] = 0.054;
        strikes[13] = 0.056;
        strikes[14] = 0.058;
        strikes[15] = 0.06;
        strikes[16] = 0.062;
        strikes[17] = 0.064;
        strikes[18] = 0.066;
        strikes[19] = 0.068;
        strikes[20] = 0.07;
        strikes[21] = 0.072;
        strikes[22] = 0.074;
        strikes[23] = 0.076;
        strikes[24] = 0.078;
        strikes[25] = 0.08;
        strikes[26] = 0.082;
        strikes[27] = 0.084;
        strikes[28] = 0.086;
        strikes[29] = 0.088;
        strikes[30] = 0.09;
        volatilities[0] = 1.16725837321531;
        volatilities[1] = 1.15226075991385;
        volatilities[2] = 1.13829711098834;
        volatilities[3] = 1.12524190877505;
        volatilities[4] = 1.11299079244474;
        volatilities[5] = 1.10145609357162;
        volatilities[6] = 1.09056348513411;
        volatilities[7] = 1.08024942745106;
        volatilities[8] = 1.07045919457758;
        volatilities[9] = 1.06114533019077;
        volatilities[10] = 1.05226642581503;
        volatilities[11] = 1.04378614411707;
        volatilities[12] = 1.03567243073732;
        volatilities[13] = 1.0278968727451;
        volatilities[14] = 1.02043417226345;
        volatilities[15] = 1.01326171139321;
        volatilities[16] = 1.00635919013311;
        volatilities[17] = 0.999708323124949;
        volatilities[18] = 0.993292584155381;
        volatilities[19] = 0.987096989695393;
        volatilities[20] = 0.98110791455717;
        volatilities[21] = 0.975312934134512;
        volatilities[22] = 0.969700688771689;
        volatilities[23] = 0.964260766651027;
        volatilities[24] = 0.958983602256592;
        volatilities[25] = 0.953860388001395;
        volatilities[26] = 0.948882997029509;
        volatilities[27] = 0.944043915545469;
        volatilities[28] = 0.939336183299237;
        volatilities[29] = 0.934753341079515;
        volatilities[30] = 0.930289384251337;
        const expiry = 1.0;
        const forward = 0.039;
        const initialAlpha = 0.3;
        const initialBeta = 0.6;
        const initialNu = 0.02;
        const initialRho = 0.01;
        for (let i = 0; i < strikes.length; i++) {
            const calculatedVol = sabrVolatility(strikes[i], forward, expiry, initialAlpha, initialBeta, initialNu, initialRho);
            expect(Math.abs(volatilities[i] - calculatedVol)).toBeLessThan(tolerance);
        }
        const alphaGuess = Math.sqrt(0.2);
        const betaGuess = 0.5;
        const nuGuess = Math.sqrt(0.4);
        const rhoGuess = 0.0;
        const vegaWeighted = [true, false];
        const isAlphaFixed = [true, false];
        const isBetaFixed = [true, false];
        const isNuFixed = [true, false];
        const isRhoFixed = [true, false];
        const calibrationTolerance = 5.0e-8;
        const methods_ = [];
        methods_.push(new Simplex(0.01));
        methods_.push(new LevenbergMarquardt(1e-8, 1e-8, 1e-8));
        const endCriteria = new EndCriteria(100000, 100, 1e-8, 1e-8, 1e-8);
        for (let j = 0; j < methods_.length; ++j) {
            for (let i = 0; i < vegaWeighted.length; ++i) {
                for (let k_a = 0; k_a < isAlphaFixed.length; ++k_a) {
                    for (let k_b = 0; k_b < isBetaFixed.length; ++k_b) {
                        for (let k_n = 0; k_n < isNuFixed.length; ++k_n) {
                            for (let k_r = 0; k_r < isRhoFixed.length; ++k_r) {
                                const sabrInterpolation = new SABRInterpolation().sabrInit(strikes, 0, strikes.length, volatilities, 0, expiry, forward, isAlphaFixed[k_a] ? initialAlpha : alphaGuess, isBetaFixed[k_b] ? initialBeta : betaGuess, isNuFixed[k_n] ? initialNu : nuGuess, isRhoFixed[k_r] ? initialRho : rhoGuess, isAlphaFixed[k_a], isBetaFixed[k_b], isNuFixed[k_n], isRhoFixed[k_r], vegaWeighted[i], endCriteria, methods_[j], 1E-10);
                                sabrInterpolation.update();
                                const calibratedAlpha = sabrInterpolation.alpha();
                                const calibratedBeta = sabrInterpolation.beta();
                                const calibratedNu = sabrInterpolation.nu();
                                const calibratedRho = sabrInterpolation.rho();
                                let error;
                                error = Math.abs(initialAlpha - calibratedAlpha);
                                expect(error).toBeLessThan(calibrationTolerance);
                                error = Math.abs(initialBeta - calibratedBeta);
                                expect(error).toBeLessThan(calibrationTolerance);
                                error = Math.abs(initialNu - calibratedNu);
                                expect(error).toBeLessThan(calibrationTolerance);
                                error = Math.abs(initialRho - calibratedRho);
                                expect(error).toBeLessThan(calibrationTolerance);
                            }
                        }
                    }
                }
            }
        }
    });

    it('Testing kernel 1D interpolation...', () => {
        const deltaGrid = new Array(5);
        deltaGrid[0] = 0.10;
        deltaGrid[1] = 0.25;
        deltaGrid[2] = 0.50;
        deltaGrid[3] = 0.75;
        deltaGrid[4] = 0.90;
        const yd1 = new Array(deltaGrid.length);
        yd1[0] = 11.275;
        yd1[1] = 11.125;
        yd1[2] = 11.250;
        yd1[3] = 11.825;
        yd1[4] = 12.625;
        const yd2 = new Array(deltaGrid.length);
        yd2[0] = 16.025;
        yd2[1] = 13.450;
        yd2[2] = 11.350;
        yd2[3] = 10.150;
        yd2[4] = 10.075;
        const yd3 = new Array(deltaGrid.length);
        yd3[0] = 10.3000;
        yd3[1] = 9.6375;
        yd3[2] = 9.2000;
        yd3[3] = 9.1125;
        yd3[4] = 9.4000;
        const yd = [];
        yd.push(yd1);
        yd.push(yd2);
        yd.push(yd3);
        const lambdaVec = new Array(5);
        lambdaVec[0] = 0.05;
        lambdaVec[1] = 0.50;
        lambdaVec[2] = 0.75;
        lambdaVec[3] = 1.65;
        lambdaVec[4] = 2.55;
        const tolerance = 2.0e-5;
        let expectedVal;
        let calcVal;
        for (let i = 0; i < lambdaVec.length; ++i) {
            const myKernel = new GaussianKernel(0, lambdaVec[i]);
            for (let j = 0; j < yd.length; ++j) {
                const currY = yd[j];
                const f = new KernelInterpolation(deltaGrid, 0, deltaGrid.length, currY, 0, myKernel, 1e-6);
                f.update();
                for (let dIt = 0; dIt < deltaGrid.length; ++dIt) {
                    expectedVal = currY[dIt];
                    calcVal = f.f(deltaGrid[dIt]);
                    expect(Math.abs(expectedVal - calcVal)).toBeLessThan(tolerance);
                }
            }
        }
        const testDeltaGrid = new Array(deltaGrid.length);
        testDeltaGrid[0] = 0.121;
        testDeltaGrid[1] = 0.279;
        testDeltaGrid[2] = 0.678;
        testDeltaGrid[3] = 0.790;
        testDeltaGrid[4] = 0.980;
        const ytd1 = new Array(testDeltaGrid.length);
        ytd1[0] = 11.23847;
        ytd1[1] = 11.12003;
        ytd1[2] = 11.58932;
        ytd1[3] = 11.99168;
        ytd1[4] = 13.29650;
        const ytd2 = new Array(testDeltaGrid.length);
        ytd2[0] = 15.55922;
        ytd2[1] = 13.11088;
        ytd2[2] = 10.41615;
        ytd2[3] = 10.05153;
        ytd2[4] = 10.50741;
        const ytd3 = new Array(testDeltaGrid.length);
        ytd3[0] = 10.17473;
        ytd3[1] = 9.557842;
        ytd3[2] = 9.09339;
        ytd3[3] = 9.149687;
        ytd3[4] = 9.779971;
        const ytd = [];
        ytd.push(ytd1);
        ytd.push(ytd2);
        ytd.push(ytd3);
        const myKernel = new GaussianKernel(0, 2.05);
        for (let j = 0; j < ytd.length; ++j) {
            const currY = yd[j];
            const currTY = ytd[j];
            const f = new KernelInterpolation(deltaGrid, 0, deltaGrid.length, currY, 0, myKernel);
            f.update();
            for (let dIt = 0; dIt < testDeltaGrid.length; ++dIt) {
                expectedVal = currTY[dIt];
                f.enableExtrapolation();
                calcVal = f.f(testDeltaGrid[dIt]);
                expect(Math.abs(expectedVal - calcVal)).toBeLessThan(tolerance);
            }
        }
    });

    it('Testing kernel 2D interpolation...', () => {
        const mean = 0.0, v = 0.18;
        const myKernel = new GaussianKernel(mean, v);
        const xVec = new Array(10);
        xVec[0] = 0.10;
        xVec[1] = 0.20;
        xVec[2] = 0.30;
        xVec[3] = 0.40;
        xVec[4] = 0.50;
        xVec[5] = 0.60;
        xVec[6] = 0.70;
        xVec[7] = 0.80;
        xVec[8] = 0.90;
        xVec[9] = 1.00;
        const yVec = new Array(3);
        yVec[0] = 1.0;
        yVec[1] = 2.0;
        yVec[2] = 3.5;
        const M = Array2D.newMatrix(xVec.length, yVec.length);
        M[0][0] = 0.25;
        M[1][0] = 0.24;
        M[2][0] = 0.23;
        M[3][0] = 0.20;
        M[4][0] = 0.19;
        M[5][0] = 0.20;
        M[6][0] = 0.21;
        M[7][0] = 0.22;
        M[8][0] = 0.26;
        M[9][0] = 0.29;
        M[0][1] = 0.27;
        M[1][1] = 0.26;
        M[2][1] = 0.25;
        M[3][1] = 0.22;
        M[4][1] = 0.21;
        M[5][1] = 0.22;
        M[6][1] = 0.23;
        M[7][1] = 0.24;
        M[8][1] = 0.28;
        M[9][1] = 0.31;
        M[0][2] = 0.21;
        M[1][2] = 0.22;
        M[2][2] = 0.27;
        M[3][2] = 0.29;
        M[4][2] = 0.24;
        M[5][2] = 0.28;
        M[6][2] = 0.25;
        M[7][2] = 0.22;
        M[8][2] = 0.29;
        M[9][2] = 0.30;
        const kernel2D = new KernelInterpolation2D(xVec, 0, xVec.length, yVec, 0, yVec.length, M, myKernel);
        let calcVal, expectedVal;
        const tolerance = 1.0e-10;
        for (let i = 0; i < Array2D.rows(M); ++i) {
            for (let j = 0; j < Array2D.columns(M); ++j) {
                calcVal = kernel2D.f(xVec[i], yVec[j]);
                expectedVal = M[i][j];
                expect(Math.abs(expectedVal - calcVal)).toBeLessThan(tolerance);
            }
        }
        const xVec1 = new Array(4);
        xVec1[0] = 80.0;
        xVec1[1] = 90.0;
        xVec1[2] = 100.0;
        xVec1[3] = 110.0;
        const yVec1 = new Array(8);
        yVec1[0] = 0.5;
        yVec1[1] = 0.7;
        yVec1[2] = 1.0;
        yVec1[3] = 2.0;
        yVec1[4] = 3.5;
        yVec1[5] = 4.5;
        yVec1[6] = 5.5;
        yVec1[7] = 6.5;
        const M1 = Array2D.newMatrix(xVec1.length, yVec1.length);
        M1[0][0] = 10.25;
        M1[1][0] = 12.24;
        M1[2][0] = 14.23;
        M1[3][0] = 17.20;
        M1[0][1] = 12.25;
        M1[1][1] = 15.24;
        M1[2][1] = 16.23;
        M1[3][1] = 16.20;
        M1[0][2] = 12.25;
        M1[1][2] = 13.24;
        M1[2][2] = 13.23;
        M1[3][2] = 17.20;
        M1[0][3] = 13.25;
        M1[1][3] = 15.24;
        M1[2][3] = 12.23;
        M1[3][3] = 19.20;
        M1[0][4] = 14.25;
        M1[1][4] = 16.24;
        M1[2][4] = 13.23;
        M1[3][4] = 12.20;
        M1[0][5] = 15.25;
        M1[1][5] = 17.24;
        M1[2][5] = 14.23;
        M1[3][5] = 12.20;
        M1[0][6] = 16.25;
        M1[1][6] = 13.24;
        M1[2][6] = 15.23;
        M1[3][6] = 10.20;
        M1[0][7] = 14.25;
        M1[1][7] = 14.24;
        M1[2][7] = 16.23;
        M1[3][7] = 19.20;
        const kernel2DEp = new KernelInterpolation2D(xVec, 0, xVec1.length, yVec1, 0, yVec1.length, M1, { f: epanechnikovKernel });
        for (let i = 0; i < Array2D.rows(M1); ++i) {
            for (let j = 0; j < Array2D.columns(M1); ++j) {
                calcVal = kernel2DEp.f(xVec1[i], yVec1[j]);
                expectedVal = M1[i][j];
                expect(Math.abs(expectedVal - calcVal)).toBeLessThan(tolerance);
            }
        }
        xVec1[0] = 60.0;
        xVec1[1] = 95.0;
        xVec1[2] = 105.0;
        xVec1[3] = 135.0;
        yVec1[0] = 12.5;
        yVec1[1] = 13.7;
        yVec1[2] = 15.0;
        yVec1[3] = 19.0;
        yVec1[4] = 26.5;
        yVec1[5] = 27.5;
        yVec1[6] = 29.2;
        yVec1[7] = 36.5;
        kernel2DEp.update();
        for (let i = 0; i < Array2D.rows(M1); ++i) {
            for (let j = 0; j < Array2D.columns(M1); ++j) {
                calcVal = kernel2DEp.f(xVec1[i], yVec1[j]);
                expectedVal = M1[i][j];
                expect(Math.abs(expectedVal - calcVal)).toBeLessThan(tolerance);
            }
        }
    });

    it('Testing bicubic spline derivatives...', () => {
        const x = new Array(100), y = new Array(100);
        for (let i = 0; i < 100; ++i) {
            x[i] = y[i] = i / 20.0;
        }
        const f = Array2D.newMatrix(100, 100);
        for (let i = 0; i < 100; ++i) {
            for (let j = 0; j < 100; ++j) {
                f[i][j] = y[i] / 10 * Math.sin(x[j]) + Math.cos(y[i]);
            }
        }
        const tol = 0.005;
        const spline = new BicubicSpline(x, 0, x.length, y, 0, y.length, f);
        for (let i = 5; i < 95; i += 10) {
            for (let j = 5; j < 95; j += 10) {
                const f_x = spline.derivativeX(x[j], y[i]);
                const f_xx = spline.secondDerivativeX(x[j], y[i]);
                const f_y = spline.derivativeY(x[j], y[i]);
                const f_yy = spline.secondDerivativeY(x[j], y[i]);
                const f_xy = spline.derivativeXY(x[j], y[i]);
                expect(Math.abs(f_x - y[i] / 10 * Math.cos(x[j]))).toBeLessThan(tol);
                expect(Math.abs(f_xx + y[i] / 10 * Math.sin(x[j]))).toBeLessThan(tol);
                expect(Math.abs(f_y - (Math.sin(x[j]) / 10 - Math.sin(y[i]))))
                    .toBeLessThan(tol);
                expect(Math.abs(f_yy + Math.cos(y[i]))).toBeLessThan(tol);
                expect(Math.abs(f_xy - Math.cos(x[j]) / 10)).toBeLessThan(tol);
            }
        }
    });

    it('Testing that bicubic splines actually update...', () => {
        const N = 6;
        const x = new Array(N), y = new Array(N);
        for (let i = 0; i < N; ++i) {
            x[i] = y[i] = i * 0.2;
        }
        const f = Array2D.newMatrix(N, N);
        for (let i = 0; i < N; ++i) {
            for (let j = 0; j < N; ++j) {
                f[i][j] = x[j] * (x[j] + y[i]);
            }
        }
        const spline = new BicubicSpline(x, 0, x.length, y, 0, y.length, f);
        const old_result = spline.f(x[2] + 0.1, y[4]);
        f[4][3] += 1.0;
        spline.update();
        const new_result = spline.f(x[2] + 0.1, y[4]);
        expect(Math.abs(old_result - new_result)).toBeLessThan(0.5);
    });

    it('Testing Richardson extrapolation...', () => {
        const stepSize = 0.1;
        const orderOfConvergence = 1.0;
        const extrap = new RichardsonExtrapolation({ f }, stepSize, orderOfConvergence);
        const tol = 0.00002;
        let expected = 2.71285;
        const scalingFactor = 2.0;
        let calculated = extrap.f1(scalingFactor);
        expect(Math.abs(expected - calculated)).toBeLessThan(tol);
        calculated = extrap.f1();
        expect(Math.abs(expected - calculated)).toBeLessThan(tol);
        expected = 2.721376;
        const scalingFactor2 = 4.0;
        calculated = extrap.f2(scalingFactor2, scalingFactor);
        expect(Math.abs(expected - calculated)).toBeLessThan(tol);
    });

    it('Testing no-arbitrage Sabr interpolation...', () => {
        const tolerance = 1.0e-12;
        const strikes = new Array(31);
        const volatilities = new Array(31);
        strikes[0] = 0.03;
        strikes[1] = 0.032;
        strikes[2] = 0.034;
        strikes[3] = 0.036;
        strikes[4] = 0.038;
        strikes[5] = 0.04;
        strikes[6] = 0.042;
        strikes[7] = 0.044;
        strikes[8] = 0.046;
        strikes[9] = 0.048;
        strikes[10] = 0.05;
        strikes[11] = 0.052;
        strikes[12] = 0.054;
        strikes[13] = 0.056;
        strikes[14] = 0.058;
        strikes[15] = 0.06;
        strikes[16] = 0.062;
        strikes[17] = 0.064;
        strikes[18] = 0.066;
        strikes[19] = 0.068;
        strikes[20] = 0.07;
        strikes[21] = 0.072;
        strikes[22] = 0.074;
        strikes[23] = 0.076;
        strikes[24] = 0.078;
        strikes[25] = 0.08;
        strikes[26] = 0.082;
        strikes[27] = 0.084;
        strikes[28] = 0.086;
        strikes[29] = 0.088;
        strikes[30] = 0.09;
        volatilities[0] = 0.773729077752926;
        volatilities[1] = 0.763916242454194;
        volatilities[2] = 0.754773878663612;
        volatilities[3] = 0.746222305031368;
        volatilities[4] = 0.738193023523582;
        volatilities[5] = 0.730629785825930;
        volatilities[6] = 0.723484825471685;
        volatilities[7] = 0.716716812668892;
        volatilities[8] = 0.710290301049393;
        volatilities[9] = 0.704174528906769;
        volatilities[10] = 0.698342635400901;
        volatilities[11] = 0.692771033345972;
        volatilities[12] = 0.687438902593476;
        volatilities[13] = 0.682327777297265;
        volatilities[14] = 0.677421206991904;
        volatilities[15] = 0.672704476238547;
        volatilities[16] = 0.668164371832768;
        volatilities[17] = 0.663788984329375;
        volatilities[18] = 0.659567547226380;
        volatilities[19] = 0.655490294349232;
        volatilities[20] = 0.651548341349061;
        volatilities[21] = 0.647733583657137;
        volatilities[22] = 0.644038608699086;
        volatilities[23] = 0.640456620061898;
        volatilities[24] = 0.636981371712714;
        volatilities[25] = 0.633607110719560;
        volatilities[26] = 0.630328527192861;
        volatilities[27] = 0.627140710386248;
        volatilities[28] = 0.624039110072250;
        volatilities[29] = 0.621019502453590;
        volatilities[30] = 0.618077959983455;
        const expiry = 1.0;
        const forward = 0.039;
        const initialAlpha = 0.2;
        const initialBeta = 0.6;
        const initialNu = 0.02;
        const initialRho = 0.01;
        const noarbSabr = new NoArbSabrSmileSection().nasssInit1(expiry, forward, [initialAlpha, initialBeta, initialNu, initialRho]);
        for (let i = 0; i < strikes.length; i++) {
            const calculatedVol = noarbSabr.volatility1(strikes[i]);
            expect(Math.abs(volatilities[i] - calculatedVol)).toBeLessThan(tolerance);
        }
        const betaGuess = 0.5;
        const alphaGuess = 0.2 /
            Math.pow(forward, betaGuess - 1.0);
        const nuGuess = Math.sqrt(0.4);
        const rhoGuess = 0.0;
        const vegaWeighted = [true, false];
        const isAlphaFixed = [true, false];
        const isBetaFixed = [true, false];
        const isNuFixed = [true, false];
        const isRhoFixed = [true, false];
        const calibrationTolerance = 5.0e-6;
        const methods_ = [];
        methods_.push(new Simplex(0.01));
        methods_.push(new LevenbergMarquardt(1e-8, 1e-8, 1e-8));
        const endCriteria = new EndCriteria(100000, 100, 1e-8, 1e-8, 1e-8);
        for (let j = 1; j < methods_.length; ++j) {
            for (let i = 0; i < vegaWeighted.length; ++i) {
                for (let k_a = 0; k_a < isAlphaFixed.length; ++k_a) {
                    for (let k_b = 0; k_b < 1; ++k_b) {
                        for (let k_n = 0; k_n < isNuFixed.length; ++k_n) {
                            for (let k_r = 0; k_r < isRhoFixed.length; ++k_r) {
                                const noarbSabrInterpolation = new NoArbSabrInterpolation(strikes, 0, strikes.length, volatilities, 0, expiry, forward, isAlphaFixed[k_a] ? initialAlpha : alphaGuess, isBetaFixed[k_b] ? initialBeta : betaGuess, isNuFixed[k_n] ? initialNu : nuGuess, isRhoFixed[k_r] ? initialRho : rhoGuess, isAlphaFixed[k_a], isBetaFixed[k_b], isNuFixed[k_n], isRhoFixed[k_r], vegaWeighted[i], endCriteria, methods_[j], 1E-10);
                                noarbSabrInterpolation.update();
                                const calibratedAlpha = noarbSabrInterpolation.alpha();
                                const calibratedBeta = noarbSabrInterpolation.beta();
                                const calibratedNu = noarbSabrInterpolation.nu();
                                const calibratedRho = noarbSabrInterpolation.rho();
                                let error;
                                error = Math.abs(initialAlpha - calibratedAlpha);
                                expect(error).toBeLessThan(calibrationTolerance);
                                error = Math.abs(initialBeta - calibratedBeta);
                                expect(error).toBeLessThan(calibrationTolerance);
                                error = Math.abs(initialNu - calibratedNu);
                                expect(error).toBeLessThan(calibrationTolerance);
                                error = Math.abs(initialRho - calibratedRho);
                                expect(error).toBeLessThan(calibrationTolerance);
                            }
                        }
                    }
                }
            }
        }
    });

    it('Testing Sabr calibration single cases...', () => {
        const strikes = [0.01, 0.01125, 0.0125, 0.01375, 0.0150], vols = [0.1667, 0.2020, 0.2785, 0.3279, 0.3727];
        const tte = 0.3833;
        const forward = 0.011025;
        const s0 = new SABRInterpolation().sabrInit(strikes, 0, strikes.length, vols, 0, tte, forward, QL_NULL_REAL, 0.25, QL_NULL_REAL, QL_NULL_REAL, false, true, false, false);
        s0.update();
        expect(s0.maxError()).toBeLessThan(0.01);
        expect(s0.rmsError()).toBeLessThan(0.01);
  });

  it('Testing Sabr and no-arbitrage Sabr transformation functions...', () => {
        const size = 25.0;
        const N = 100000;
        const x = new Array(4);
        let y = new Array(4), z = new Array(4);
        let s;
        const fixed = Array1D.fromSizeValue(4, false);
        const params = Array1D.fromSizeValue(4, 0.0);
        const forward = 0.03;
        const h = new HaltonRsg().init(4, 42, false, false);
        for (let i = 0; i < 1E6; ++i) {
            s = Array.from(h.nextSequence().value);
            for (let j = 0; j < 4; ++j) {
                x[j] = 2.0 * size * s[j] - size;
            }
            y = new SABRSpecs().direct(x, fixed, params, forward);
            validateSabrParameters(y[0], y[1], y[2], y[3]);
            z = new SABRSpecs().inverse(y, fixed, params, forward);
            z = new SABRSpecs().direct(z, fixed, params, forward);
            expect(Comparison.close(z[0], y[0], N)).toBeTruthy();
            expect(Comparison.close(z[1], y[1], N)).toBeTruthy();
            expect(Comparison.close(z[2], y[2], N)).toBeTruthy();
            expect(Comparison.close(z[3], y[3], N)).toBeTruthy();
            y = new NoArbSabrSpecs().direct(x, fixed, params, forward);
            const alpha = y[0];
            const beta = y[1];
            const nu = y[2];
            const rho = y[3];
            expect(beta).toBeGreaterThan(NoArbSabrModel.beta_min);
            expect(beta).toBeLessThan(NoArbSabrModel.beta_max);
            const sigmaI = alpha * Math.pow(forward, beta - 1.0);
            expect(sigmaI).toBeGreaterThanOrEqual(NoArbSabrModel.sigmaI_min);
            expect(sigmaI).toBeLessThan(NoArbSabrModel.sigmaI_max);
            expect(nu).toBeGreaterThanOrEqual(NoArbSabrModel.nu_min);
            expect(nu).toBeLessThan(NoArbSabrModel.nu_max);
            expect(rho).toBeGreaterThan(NoArbSabrModel.rho_min);
            expect(rho).toBeLessThan(NoArbSabrModel.rho_max);
            z = new NoArbSabrSpecs().inverse(y, fixed, params, forward);
            z = new NoArbSabrSpecs().direct(z, fixed, params, forward);
            expect(Comparison.close(z[0], y[0], N)).toBeTruthy();
            expect(Comparison.close(z[1], y[1], N)).toBeTruthy();
            expect(Comparison.close(z[2], y[2], N)).toBeTruthy();
            expect(Comparison.close(z[3], y[3], N)).toBeTruthy();
        }
    });

    it('Testing Lagrange interpolation...', () => {
        const x = [-1.0, -0.5, -0.25, 0.1, 0.4, 0.75, 0.96];
        const y = x.map(lagrangeTestFct);
        const interpl = new LagrangeInterpolation(x, 0, x.length, y, 0);
        const references = [
            -0.5000000000000000, -0.5392414024347419, -0.5591485962711904,
            -0.5629199661387594, -0.5534414777017116, -0.5333043347921566,
            -0.5048221831582063, -0.4700478608272949, -0.4307896950846587,
            -0.3886273460669714, -0.3449271969711449, -0.3008572908782903,
            -0.2574018141928359, -0.2153751266968088, -0.1754353382192734,
            -0.1380974319209344, -0.1037459341938971, -0.0726471311765894,
            -0.0449608318838433, -0.0207516779521373, 0.0000000000000000,
            0.0173877793964286, 0.0315691961126723, 0.0427562482700356,
            0.0512063534145595, 0.0572137590808174, 0.0611014067405497,
            0.0632132491361394, 0.0639070209989264, 0.0635474631523613,
            0.0625000000000000, 0.0611248703983366, 0.0597717119144768,
            0.0587745984686508, 0.0584475313615655, 0.0590803836865967,
            0.0609352981268212, 0.0642435381368876, 0.0692027925097279,
            0.0759749333281079, 0.0846842273010179, 0.0954160004849021,
            0.1082157563897290, 0.1230887474699003, 0.1400000000000001,
            0.1588747923353829, 0.1795995865576031, 0.2020234135046815,
            0.2259597111862140, 0.2511886165833182, 0.2774597108334206,
            0.3044952177998833, 0.3319936560264689, 0.3596339440766487,
            0.3870799592577457, 0.4139855497299214, 0.4400000000000001,
            0.4647739498001331, 0.4879657663513030, 0.5092483700116673,
            0.5283165133097421, 0.5448945133624253, 0.5587444376778583,
            0.5696747433431296, 0.5775493695968156, 0.5822972837863635,
            0.5839224807103117, 0.5825144353453510, 0.5782590089582251,
            0.5714498086024714, 0.5625000000000000, 0.5519545738075141,
            0.5405030652677689, 0.5289927272456703, 0.5184421566492137,
            0.5100553742352614, 0.5052363578001620, 0.5056040287552059,
            0.5130076920869246
        ];
        const tol = 50 * QL_EPSILON;
        for (let i = 0; i < 79; ++i) {
            const xx = -1.0 + i * 0.025;
            const calculated = interpl.f(xx);
            expect(Math.abs(references[i] - calculated)).toBeLessThan(tol);
        }
    });

    it('Testing Lagrange interpolation at supporting points...', () => {
        const n = 5;
        const x = new Array(n), y = new Array(n);
        for (let i = 0; i < n; ++i) {
            x[i] = i / n;
            y[i] = 1.0 / (1.0 - x[i]);
        }
        const interpl = new LagrangeInterpolation(x, 0, x.length, y, 0);
        const relTol = 5e-12;
        for (let i = 1; i < n - 1; ++i) {
            for (let z = x[i] - 100 * QL_EPSILON; z < x[i] + 100 * QL_EPSILON; z += 2 * QL_EPSILON) {
                const expected = 1.0 / (1.0 - x[i]);
                const calculated = interpl.f(z);
                expect(Math.abs(expected - calculated)).toBeLessThan(relTol);
            }
        }
    });

    it('Testing Lagrange interpolation derivatives...', () => {
        const x = new Array(5), y = new Array(5);
        x[0] = -1.0;
        y[0] = 2.0;
        x[1] = -0.3;
        y[1] = 3.0;
        x[2] = 0.1;
        y[2] = 6.0;
        x[3] = 0.3;
        y[3] = 3.0;
        x[4] = 0.9;
        y[4] = -1.0;
        const interpl = new LagrangeInterpolation(x, 0, x.length, y, 0);
        const eps = Math.sqrt(QL_EPSILON);
        for (let x = -1.0; x <= 0.9; x += 0.01) {
            const calculated = interpl.derivative(x, true);
            const expected = (interpl.f(x + eps, true) - interpl.f(x - eps, true)) / (2 * eps);
            expect(Math.abs(expected - calculated)).toBeLessThan(25 * eps);
        }
    });

    it('Testing Lagrange interpolation on Chebyshev points...', () => {
        const n = 50;
        const x = new Array(n + 1), y = new Array(n + 1);
        for (let i = 0; i <= n; ++i) {
            x[i] = Math.cos((2 * i + 1) * M_PI / (2 * n + 2));
            y[i] = Math.exp(x[i]) / Math.cos(x[i]);
        }
        const interpl = new LagrangeInterpolation(x, 0, x.length, y, 0);
        const tol = 1e-13;
        const tolDeriv = 1e-11;
        for (let x = -1.0; x <= 1.0; x += 0.03) {
            const calculated = interpl.f(x, true);
            const expected = Math.exp(x) / Math.cos(x);
            const diff = Math.abs(expected - calculated);
            expect(diff).toBeLessThan(tol);
            const calculatedDeriv = interpl.derivative(x, true);
            const expectedDeriv = Math.exp(x) * (Math.cos(x) + Math.sin(x)) /
                (Math.cos(x) * Math.cos(x));
            const diffDeriv = Math.abs(expectedDeriv - calculatedDeriv);
            expect(diffDeriv).toBeLessThan(tolDeriv);
        }
    });

    it('Testing B-Splines...', () => {
        const knots = [-1.0, 0.5, 0.75, 1.2, 3.0, 4.0, 5.0];
        const p = 2;
        const bspline = new BSpline(p, knots.length - p - 2, knots);
        const referenceValues = [
            [0, -0.95, 9.5238095238e-04], [0, -0.01, 0.37337142857],
            [0, 0.49, 0.84575238095], [0, 1.21, 0.0], [1, 1.49, 0.562987654321],
            [1, 1.59, 0.490888888889], [2, 1.99, 0.62429409171], [3, 1.19, 0.0],
            [3, 1.99, 0.12382936508], [3, 3.59, 0.765914285714]
        ];
        const tol = 1e-10;
        for (let i = 0; i < referenceValues.length; ++i) {
            const idx = referenceValues[i][0];
            const x = referenceValues[i][1];
            const expected = referenceValues[i][2];
            const calculated = bspline.f(idx, x);
            expect(calculated).not.toBeNaN();
            expect(Math.abs(calculated - expected)).toBeLessThan(tol);
        }
    });

    it('Testing piecewise constant interpolation on a single point...', () => {
        const knots = [1.0], values = [2.5];
        const impl = new BackwardFlat().interpolate(knots, 0, knots.length, values, 0);
        const x = [-1.0, 1.0, 2.0, 3.0];
        for (let i = 0; i < x.length; ++i) {
            const calculated = impl.f(x[i], true);
            const expected = values[0];
            expect(Comparison.close_enough(calculated, expected)).toBeTruthy();
            const expectedPrimitive = values[0] * (x[i] - knots[0]);
            const calculatedPrimitive = impl.primitive(x[i], true);
            expect(Comparison.close_enough(calculatedPrimitive, expectedPrimitive))
                .toBeTruthy();
        }
    });
});