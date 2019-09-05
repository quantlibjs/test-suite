import { constant, identity, InverseCumulativeNormal, InverseCumulativeRng, LinearRegression, MersenneTwisterUniformRng, SavedSettings, square } from '/ql.mjs';
describe('linear least squares regression tests', () => {
    it('Testing linear least-squares regression...', () => {
        const backup = new SavedSettings();
        const tolerance = 0.05;
        const nr = 100000;
        const rng = new InverseCumulativeRng(new MersenneTwisterUniformRng().init1(1234), new InverseCumulativeNormal());
        const v = [];
        v.push(new constant(1.0));
        v.push(new identity());
        v.push(new square());
        v.push({ f: Math.sin });
        const w = Array.from(v);
        w.push(new square());
        for (let k = 0; k < 3; ++k) {
            let i;
            const a = [
                rng.next().value, rng.next().value, rng.next().value, rng.next().value
            ];
            const x = new Array(nr), y = new Array(nr);
            for (i = 0; i < nr; ++i) {
                x[i] = rng.next().value;
                y[i] = a[0] * v[0].f(x[i]) + a[1] * v[1].f(x[i]) + a[2] * v[2].f(x[i]) +
                    a[3] * v[3].f(x[i]) + rng.next().value;
            }
            let m = new LinearRegression(x, y).lrInit2(v);
            for (i = 0; i < v.length; ++i) {
                expect(m.standardErrors()[i]).toBeLessThan(tolerance);
                expect(Math.abs(m.coefficients()[i] - a[i]))
                    .toBeLessThan(3 * m.standardErrors()[i]);
            }
            m = new LinearRegression(x, y).lrInit2(w);
            const ma = [
                m.coefficients()[0], m.coefficients()[1],
                m.coefficients()[2] + m.coefficients()[4], m.coefficients()[3]
            ];
            const err = [
                m.standardErrors()[0], m.standardErrors()[1],
                Math.sqrt(m.standardErrors()[2] * m.standardErrors()[2] +
                    m.standardErrors()[4] * m.standardErrors()[4]),
                m.standardErrors()[3]
            ];
            for (i = 0; i < v.length; ++i) {
                expect(Math.abs(ma[i] - a[i])).toBeLessThan(3 * err[i]);
            }
        }
        backup.dispose();
    });
    it('Testing multi-dimensional linear least-squares regression...', () => {
    });
    it('Testing 1D simple linear least-squares regression...', () => {
    });
});
//# sourceMappingURL=linearleastsquaresregression.js.map