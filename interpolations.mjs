import { BackwardFlatInterpolation, CubicInterpolation, EndCriteria, ForwardFlatInterpolation, FritschButlandCubic, LagrangeInterpolation, LevenbergMarquardt, LinearInterpolation, M_PI, QL_EPSILON, QL_NULL_REAL, SABRInterpolation, sabrVolatility, Simplex, SimpsonIntegral } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql/ql.mjs';

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
            let result = Math.sqrt(integral.f(f, -1.7, 1.9));
            result /= scaleFactor;
            expect(Math.abs(result - tabulatedErrors[i]))
                .toBeLessThan(toleranceOnTabErr[i]);
            f = new CubicInterpolation(x, 0, x.length, y, 0, CubicInterpolation.DerivativeApprox.Spline, true, CubicInterpolation.BoundaryCondition.NotAKnot, QL_NULL_REAL, CubicInterpolation.BoundaryCondition.NotAKnot, QL_NULL_REAL);
            f.update();
            result = Math.sqrt(integral.f(f, -1.7, 1.9));
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
        checkNotAKnotCondition(f);
        interpolated = f.f(x_bad);
        expect(interpolated).toBeGreaterThanOrEqual(1.0);
        f = new CubicInterpolation(RPN15A_x, 0, RPN15A_x.length, RPN15A_y, 0, CubicInterpolation.DerivativeApprox.Spline, true, CubicInterpolation.BoundaryCondition.FirstDerivative, 0.0, CubicInterpolation.BoundaryCondition.FirstDerivative, 0.0);
        f.update();
        checkValues(f, RPN15A_x, 0, RPN15A_x.length, RPN15A_y, 0);
        check1stDerivativeValue(f, RPN15A_x[0], 0.0);
        check1stDerivativeValue(f, RPN15A_x[RPN15A_x.length - 1], 0.0);
        interpolated = f.f(x_bad);
        expect(interpolated).toBeGreaterThanOrEqual(1.0);
        f = new CubicInterpolation(RPN15A_x, 0, RPN15A_x.length, RPN15A_y, 0, CubicInterpolation.DerivativeApprox.Spline, true, CubicInterpolation.BoundaryCondition.NotAKnot, QL_NULL_REAL, CubicInterpolation.BoundaryCondition.NotAKnot, QL_NULL_REAL);
        f.update();
        checkValues(f, RPN15A_x, 0, RPN15A_x.length, RPN15A_y, 0);
        interpolated = f.f(x_bad);
        expect(interpolated).toBeGreaterThanOrEqual(1.0);
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
    });
    it('Testing kernel 2D interpolation...', () => {
    });
    it('Testing bicubic spline derivatives...', () => {
    });
    it('Testing that bicubic splines actually update...', () => {
    });
    it('Testing Richardson extrapolation...', () => {
    });
    it('Testing no-arbitrage Sabr interpolation...', () => {
    });
    it('Testing Sabr calibration single cases...', () => {
    });
    it('Testing Sabr and no-arbitrage Sabr transformation functions...', () => {
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
    });
});