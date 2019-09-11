import { AbcdFunction, AbcdSquared, Comparison, constant, cos, Default, DiscreteSimpsonIntegral, DiscreteSimpsonIntegrator, DiscreteTrapezoidIntegral, DiscreteTrapezoidIntegrator, FilonIntegral, GaussKronrodAdaptive, GaussKronrodNonAdaptive, GaussLobattoIntegral, identity, M_PI, M_PI_2, MidPoint, NormalDistribution, PiecewiseIntegral, QL_EPSILON, QL_PIECEWISE_FUNCTION, SegmentIntegral, SimpsonIntegral, sin, square, TrapezoidIntegral, TwoDimensionalIntegral } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql/ql.mjs';

const tolerance = 1.0e-6;

function testSingle(I, f, xMin, xMax, expected) {
    const calculated = I.f(f, xMin, xMax);
    expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
}

function testSeveral(I) {
    testSingle(I, new constant(0.0), 0.0, 1.0, 0.0);
    testSingle(I, new constant(1.0), 0.0, 1.0, 1.0);
    testSingle(I, new identity(), 0.0, 1.0, 0.5);
    testSingle(I, new square(), 0.0, 1.0, 1.0 / 3.0);
    testSingle(I, new sin(), 0.0, M_PI, 2.0);
    testSingle(I, new cos(), 0.0, M_PI, 0.0);
    testSingle(I, new NormalDistribution(), -10.0, 10.0, 1.0);
    testSingle(I, new AbcdSquared(0.07, 0.07, 0.5, 0.1, 8.0, 10.0), 5.0, 6.0, new AbcdFunction(0.07, 0.07, 0.5, 0.1).covariance2(5.0, 6.0, 8.0, 10.0));
}

function testDegeneratedDomain(I) {
    testSingle(I, new constant(0.0), 1.0, 1.0 + QL_EPSILON, 0.0);
}

class sineF {
    f(x) {
        return Math.exp(-0.5 * (x - M_PI_2 / 100));
    }
}

class cosineF {
    f(x) {
        return Math.exp(-0.5 * x);
    }
}

function f1(x) {
    return 1.2 * x * x + 3.2 * x + 3.1;
}

function f2(x) {
    return 4.3 * (x - 2.34) * (x - 2.34) - 6.2 * (x - 2.34) + f1(2.34);
}

let X;
let Y;

function pw_fct(t) {
    return QL_PIECEWISE_FUNCTION(X, Y, t);
}

function pw_check(input, a, b, expected) {
    const calculated = input.f({ f: pw_fct }, a, b);
    expect(Comparison.close(calculated, expected)).toBeTruthy();
}

describe('Integration tests', () => {
    it('Testing segment integration...', () => {
        testSeveral(new SegmentIntegral(10000));
        testDegeneratedDomain(new SegmentIntegral(10000));
    });
    it('Testing trapezoid integration...', () => {
        testSeveral(new TrapezoidIntegral(new Default(), tolerance, 10000));
        testDegeneratedDomain(new TrapezoidIntegral(new Default(), tolerance, 10000));
    });
    it('Testing mid-point trapezoid integration...', () => {
        testSeveral(new TrapezoidIntegral(new MidPoint(), tolerance, 10000));
        testDegeneratedDomain(new TrapezoidIntegral(new MidPoint(), tolerance, 10000));
    });
    it('Testing Simpson integration...', () => {
        testSeveral(new SimpsonIntegral(tolerance, 10000));
        testDegeneratedDomain(new SimpsonIntegral(tolerance, 10000));
    });
    it('Testing adaptive Gauss-Kronrod integration...', () => {
        const maxEvaluations = 1000;
        testSeveral(new GaussKronrodAdaptive(tolerance, maxEvaluations));
        testDegeneratedDomain(new GaussKronrodAdaptive(tolerance, maxEvaluations));
    });
    it('Testing adaptive Gauss-Lobatto integration...', () => {
        const maxEvaluations = 1000;
        testSeveral(new GaussLobattoIntegral(maxEvaluations, tolerance));
    });
    it('Testing non-adaptive Gauss-Kronrod integration...', () => {
        const precision = tolerance;
        const maxEvaluations = 100;
        const relativeAccuracy = tolerance;
        const gaussKronrodNonAdaptive = new GaussKronrodNonAdaptive(precision, maxEvaluations, relativeAccuracy);
        testSeveral(gaussKronrodNonAdaptive);
        testDegeneratedDomain(gaussKronrodNonAdaptive);
    });
    it('Testing two dimensional adaptive Gauss-Lobatto integration...', () => {
        const maxEvaluations = 1000;
        const uf = {
            f: (x) => {
                return x[0] * x[1];
            }
        };
        const calculated = new TwoDimensionalIntegral(new TrapezoidIntegral(new Default(), tolerance, maxEvaluations), new TrapezoidIntegral(new Default(), tolerance, maxEvaluations))
            .f(uf, [0.0, 0.0], [1.0, 2.0]);
        const expected = 1.0;
        expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
    });
    it('Testing Folin\'s integral formulae...', () => {
        const nr = [4, 8, 16, 128, 256, 1024, 2048];
        const expected = [
            4.55229440e-5, 4.72338540e-5, 4.72338540e-5, 4.78308678e-5, 4.78404787e-5,
            4.78381120e-5, 4.78381084e-5
        ];
        const t = 100;
        const o = M_PI_2 / t;
        const tol = 1e-12;
        for (let i = 0; i < nr.length; ++i) {
            const n = nr[i];
            const calculatedCosine = new FilonIntegral(FilonIntegral.Type.Cosine, t, n)
                .f(new cosineF(), 0, 2 * M_PI);
            const calculatedSine = new FilonIntegral(FilonIntegral.Type.Sine, t, n)
                .f(new sineF(), o, 2 * M_PI + o);
            expect(Math.abs(calculatedCosine - expected[i])).toBeLessThan(tol);
            expect(Math.abs(calculatedSine - expected[i])).toBeLessThan(tol);
        }
    });
    it('Testing discrete integral formulae...', () => {
        const x = [1.0, 2.02, 2.34, 3.3, 4.2, 4.6];
        const f = [f1(x[0]), f1(x[1]), f1(x[2]), f2(x[3]), f2(x[4]), f2(x[5])];
        const expectedSimpson = 16.0401216 + 30.4137528 + 0.2 * f2(4.2) + 0.2 * f2(4.6);
        const expectedTrapezoid = 0.5 * (f1(1.0) + f1(2.02)) * 1.02 +
            0.5 * (f1(2.02) + f1(2.34)) * 0.32 + 0.5 * (f2(2.34) + f2(3.3)) * 0.96 +
            0.5 * (f2(3.3) + f2(4.2)) * 0.9 + 0.5 * (f2(4.2) + f2(4.6)) * 0.4;
        const calculatedSimpson = new DiscreteSimpsonIntegral().f(x, f);
        const calculatedTrapezoid = new DiscreteTrapezoidIntegral().f(x, f);
        const tol = 1e-12;
        expect(Math.abs(calculatedSimpson - expectedSimpson)).toBeLessThan(tol);
        expect(Math.abs(calculatedTrapezoid - expectedTrapezoid)).toBeLessThan(tol);
    });
    it('Testing discrete integrator formulae...', () => {
        testSeveral(new DiscreteSimpsonIntegrator(300));
        testSeveral(new DiscreteTrapezoidIntegrator(3000));
    });
    it('Testing piecewise integral...', () => {
        X = [1.0, 2.0, 3.0, 4.0, 5.0];
        Y = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0];
        const segment = new SegmentIntegral(1);
        const piecewise = new PiecewiseIntegral(segment, X);
        pw_check(piecewise, -1.0, 0.0, 1.0);
        pw_check(piecewise, 0.0, 1.0, 1.0);
        pw_check(piecewise, 0.0, 1.5, 2.0);
        pw_check(piecewise, 0.0, 2.0, 3.0);
        pw_check(piecewise, 0.0, 2.5, 4.5);
        pw_check(piecewise, 0.0, 3.0, 6.0);
        pw_check(piecewise, 0.0, 4.0, 10.0);
        pw_check(piecewise, 0.0, 5.0, 15.0);
        pw_check(piecewise, 0.0, 6.0, 21.0);
        pw_check(piecewise, 0.0, 7.0, 27.0);
        pw_check(piecewise, 3.5, 4.5, 4.5);
        pw_check(piecewise, 5.0, 10.0, 30.0);
        pw_check(piecewise, 9.0, 10.0, 6.0);
    });
});