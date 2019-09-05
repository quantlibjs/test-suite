import { AdaptiveRungeKutta, Array1D, Array2D, Expm, QL_EPSILON, Complex } from '/ql.mjs';

class ode1 {
    f1(x, y) {
        return y;
    }
}
class ode2 {
    f1(x, y) {
        return new Complex(0.0, 1.0).mul(y);
    }
}
class ode3 {
    f2(x, y) {
        const r = new Array(2);
        r[0] = y[1];
        r[1] = y[0].mulScalar(-1);
        return r;
    }
}
class ode4 {
    f2(x, y) {
        const r = new Array(2);
        r[0] = y[1];
        r[1] = y[0].mulScalar(-1);
        return r;
    }
}
function frobenuiusNorm(m) {
    const trans = Array2D.transpose(m);
    const mmt = Array2D.mul(m, trans);
    const diag = Array2D.diagonal(mmt);
    const v1 = Array1D.fromSizeValue(Array2D.rows(m), 1.0);
    const dotProd = Array1D.DotProduct(diag, v1);
    return Math.sqrt(dotProd);
}
describe('ode tests', () => {
    it('Testing adaptive Runge Kutta...', () => {
        const rk_real = new AdaptiveRungeKutta(1E-12, 1E-4, 0.0);
        const rk_complex = new AdaptiveRungeKutta(1E-12, 1E-4, 0.0);
        const tol1 = 5E-10, tol2 = 2E-12, tol3 = 2E-12, tol4 = 2E-12;
        const ode1_ = new ode1();
        const y10 = new Complex(1);
        const ode2_ = new ode2();
        const y20 = new Complex(0.0, 1.0);
        const ode3_ = new ode3();
        const y30 = new Array(2);
        y30[0] = new Complex(0.0);
        y30[1] = new Complex(1.0);
        const ode4_ = new ode4();
        const y40 = new Array(2);
        y40[0] = new Complex(1.0);
        y40[1] = new Complex(0.0, 1.0);
        let x = 0.0;
        let y1 = y10.clone();
        let y2 = y20;
        let y3 = y30;
        let y4 = y40;
        while (x < 5.0) {
            const exact1 = Math.exp(x);
            const exact2 = Complex.mul(Complex.exp(new Complex(0.0, x)), new Complex(0.0, 1.0));
            const exact3 = Math.sin(x);
            const exact4 = Complex.exp(new Complex(0.0, x));
            expect(Math.abs(exact1 - y1.real())).toBeLessThan(tol1);
            expect(Math.sqrt(Complex.sub(exact2, y2).norm())).toBeLessThan(tol2);
            expect(Math.abs(exact3 - y3[0].real())).toBeLessThan(tol3);
            expect(Math.sqrt(Complex.sub(exact4, y4[0]).norm())).toBeLessThan(tol4);
            x += 0.01;
            y1 = rk_real.f1(ode1_, y10, 0.0, x);
            y2 = rk_complex.f1(ode2_, y20, 0.0, x);
            y3 = rk_real.f2(ode3_, y30, 0.0, x);
            y4 = rk_complex.f2(ode4_, y40, 0.0, x);
        }
    });
    it('Testing matrix exponential based on ode...', () => {
        const m = Array2D.newMatrix(3, 3);
        m[0][0] = 5;
        m[0][1] = -6;
        m[0][2] = -6;
        m[1][0] = -1;
        m[1][1] = 4;
        m[1][2] = 2;
        m[2][0] = 3;
        m[2][1] = -6;
        m[2][2] = -4;
        const tol = 1e-12;
        for (let t = 0.01; t < 11; t += t) {
            const calculated = Expm(m, t, tol);
            const expected = Array2D.newMatrix(3, 3);
            expected[0][0] = -3 * Math.exp(t) + 4 * Math.exp(2 * t);
            expected[0][1] = 6 * Math.exp(t) - 6 * Math.exp(2 * t);
            expected[0][2] = 6 * Math.exp(t) - 6 * Math.exp(2 * t);
            expected[1][0] = Math.exp(t) - Math.exp(2 * t);
            expected[1][1] = -2 * Math.exp(t) + 3 * Math.exp(2 * t);
            expected[1][2] = -2 * Math.exp(t) + 2 * Math.exp(2 * t);
            expected[2][0] = -3 * Math.exp(t) + 3 * Math.exp(2 * t);
            expected[2][1] = 6 * Math.exp(t) - 6 * Math.exp(2 * t);
            expected[2][2] = 6 * Math.exp(t) - 5 * Math.exp(2 * t);
            let diff = Array2D.sub(calculated, expected);
            let relDiffNorm = frobenuiusNorm(diff) / frobenuiusNorm(expected);
            expect(Math.abs(relDiffNorm)).toBeLessThan(100 * tol);
            const negativeTime = Expm(Array2D.mulScalar(m, -1), -t, tol);
            diff = Array2D.sub(negativeTime, expected);
            relDiffNorm = frobenuiusNorm(diff) / frobenuiusNorm(expected);
            expect(Math.abs(relDiffNorm)).toBeLessThan(100 * tol);
        }
    });
    it('Testing matrix exponential of a zero matrix based on ode...', () => {
        const m = Array2D.newMatrix(3, 3, 0.0);
        const tol = 100 * QL_EPSILON;
        const t = 1.0;
        const calculated = Expm(m, t);
        for (let i = 0; i < Array2D.rows(calculated); ++i) {
            for (let j = 0; j < Array2D.columns(calculated); ++j) {
                const kroneckerDelta = (i === j) ? 1.0 : 0.0;
                expect(Math.abs(calculated[i][j] - kroneckerDelta)).toBeLessThan(tol);
            }
        }
    });
});
//# sourceMappingURL=ode.js.map