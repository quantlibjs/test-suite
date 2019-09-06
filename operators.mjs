import '/test-suite/quantlibtestsuite.mjs';
import { Actual360, Array1D, BSMOperator, CumulativeNormalDistribution, DateExt, DPlusDMinus, DZero, GeneralizedBlackScholesProcess, Handle, NormalDistribution, PdeOperator, PdeType, SimpleQuote, TimeUnit, TridiagonalOperator } from '/ql.mjs';
import { flatRate2, flatVol2, norm } from '/test-suite/utilities.mjs';

const average = 0.0;
const sigma = 1.0;

describe('Operator tests', () => {
    it('Testing tridiagonal operator...', () => {
        const n = 8;
        const T = new TridiagonalOperator().init1(n);
        T.setFirstRow(1.0, 2.0);
        T.setMidRows(0.0, 2.0, 0.0);
        T.setLastRow(2.0, 1.0);
        const original = Array1D.fromSizeValue(n, 1.0);
        const intermediate = T.applyTo(original);
        let final = Array.from(intermediate);
        T.solveFor2(final, final);
        for (let i = 0; i < n; ++i) {
            expect(final[i]).toEqual(original[i]);
        }
        final = Array1D.fromSizeValue(n, 0.0);
        const temp = Array.from(intermediate);
        T.solveFor2(temp, final);
        for (let i = 0; i < n; ++i) {
            expect(temp[i]).toEqual(intermediate[i]);
        }
        for (let i = 0; i < n; ++i) {
            expect(final[i]).toEqual(original[i]);
        }
        final = T.solveFor1(temp);
        for (let i = 0; i < n; ++i) {
            expect(temp[i]).toEqual(intermediate[i]);
        }
        for (let i = 0; i < n; ++i) {
            expect(final[i]).toEqual(original[i]);
        }
        let delta, error = 0.0;
        const tolerance = 1e-9;
        final = T.SOR(temp, tolerance);
        for (let i = 0; i < n; ++i) {
            delta = final[i] - original[i];
            error += delta * delta;
            expect(temp[i]).toEqual(intermediate[i]);
        }
        expect(error).toBeLessThan(tolerance);
    });
    it('Testing differential operators...', () => {
        const normal = new NormalDistribution(average, sigma);
        const cum = new CumulativeNormalDistribution(average, sigma);
        const xMin = average - 4 * sigma, xMax = average + 4 * sigma;
        const N = 10001;
        const h = (xMax - xMin) / (N - 1);
        const x = new Array(N), yd = new Array(N);
        let y, yi, temp, diff;
        let i;
        for (i = 0; i < N; i++) {
            x[i] = xMin + h * i;
        }
        y = x.map((xx) => normal.f(xx));
        yi = x.map((xx) => cum.f(xx));
        for (i = 0; i < x.length; i++) {
            yd[i] = normal.d(x[i]);
        }
        const D = new DZero(N, h);
        const D2 = new DPlusDMinus(N, h);
        temp = D.applyTo(yi);
        diff = Array1D.sub(temp, y);
        let e = norm(diff, h);
        expect(e).toBeLessThan(1.0e-6);
        temp = D2.applyTo(yi);
        diff = Array1D.sub(temp, yd);
        e = norm(diff, h);
        expect(e).toBeLessThan(1.0e-4);
    });
    it('Testing consistency of BSM operators...', () => {
        const grid = new Array(10);
        let price = 20.0;
        const factor = 1.1;
        let i;
        for (i = 0; i < grid.length; i++) {
            grid[i] = price;
            price *= factor;
        }
        const dx = Math.log(factor);
        const r = 0.05;
        const q = 0.01;
        const sigma = 0.5;
        const ref = new BSMOperator().bsmInit1(grid.length, dx, r, q, sigma);
        const dc = new Actual360();
        const today = new Date();
        const exercise = DateExt.advance(today, 2, TimeUnit.Years);
        const residualTime = dc.yearFraction(today, exercise);
        const spot = new SimpleQuote(0.0);
        const qTS = flatRate2(today, q, dc);
        const rTS = flatRate2(today, r, dc);
        const volTS = flatVol2(today, sigma, dc);
        const stochProcess = new GeneralizedBlackScholesProcess().init1(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
        const op1 = new BSMOperator().bsmInit2(grid, stochProcess, residualTime);
        const op2 = new PdeOperator(PdeType.PdeBSM, grid, stochProcess, residualTime);
        const tolerance = 1.0e-6;
        let lderror = Array1D.sub(ref.lowerDiagonal(), op1.lowerDiagonal());
        let derror = Array1D.sub(ref.diagonal(), op1.diagonal());
        let uderror = Array1D.sub(ref.upperDiagonal(), op1.upperDiagonal());
        for (i = 2; i < grid.length - 2; i++) {
            expect(Math.abs(lderror[i])).toBeLessThan(tolerance);
            expect(Math.abs(derror[i])).toBeLessThan(tolerance);
            expect(Math.abs(uderror[i])).toBeLessThan(tolerance);
        }
        lderror = Array1D.sub(ref.lowerDiagonal(), op2.lowerDiagonal());
        derror = Array1D.sub(ref.diagonal(), op2.diagonal());
        uderror = Array1D.sub(ref.upperDiagonal(), op2.upperDiagonal());
        for (i = 2; i < grid.length - 2; i++) {
            expect(Math.abs(lderror[i])).toBeLessThan(tolerance);
            expect(Math.abs(derror[i])).toBeLessThan(tolerance);
            expect(Math.abs(uderror[i])).toBeLessThan(tolerance);
        }
    });
});