import { BoundedGrid, SampledCurve } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

class FSquared {
    f(x) {
        return x * x;
    }
}

describe('sampled curve tests', () => {
    it('Testing sampled curve construction...', () => {
        const curve = new SampledCurve().init2(BoundedGrid(-10.0, 10.0, 100));
        const f2 = new FSquared();
        curve.sample(f2);
        const expected = 100.0;
        expect(Math.abs(curve.value(0) - expected)).toBeLessThan(1e-5);
        curve.set(0, 2.0);
        expect(Math.abs(curve.value(0) - 2.0)).toBeLessThan(1e-5);
        const value = curve.values();
        value[1] = 3.0;
        expect(Math.abs(curve.value(1) - 3.0)).toBeLessThan(1e-5);
        curve.shiftGrid(10.0);
        expect(Math.abs(curve.gridValue(0) - 0.0)).toBeLessThan(1e-5);
        expect(Math.abs(curve.value(0) - 2.0)).toBeLessThan(1e-5);
        curve.sample(f2);
        curve.regrid1(BoundedGrid(0.0, 20.0, 200));
        const tolerance = 1.0e-2;
        for (let i = 0; i < curve.size(); i++) {
            const grid = curve.gridValue(i);
            const value = curve.value(i);
            const expected = f2.f(grid);
            expect(Math.abs(value - expected)).toBeLessThan(tolerance);
        }
    });
});