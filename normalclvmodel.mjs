import { Actual365Fixed, BSMRNDCalculator, DateExt, GeneralizedBlackScholesProcess, Handle, Month, NormalCLVModel, OrnsteinUhlenbeckProcess, QL_EPSILON, SavedSettings, SimpleQuote, TimeUnit } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate2, flatVol2 } from '/test-suite/utilities.mjs';

describe('NormalCLVModel tests', () => {
    it('Testing Black-Scholes cumulative distribution' +
        ' function with constant volatility...', () => {
        const backup = new SavedSettings();
        const dc = new Actual365Fixed();
        const today = new Date(2016, Month.June - 1, 22);
        const maturity = DateExt.advance(today, 6, TimeUnit.Months);
        const s0 = 100;
        const rRate = 0.1;
        const qRate = 0.05;
        const vol = 0.25;
        const spot = new Handle(new SimpleQuote(s0));
        const qTS = new Handle(flatRate2(today, qRate, dc));
        const rTS = new Handle(flatRate2(today, rRate, dc));
        const volTS = new Handle(flatVol2(today, vol, dc));
        const bsProcess = new GeneralizedBlackScholesProcess().init1(spot, qTS, rTS, volTS);
        const ouProcess = new OrnsteinUhlenbeckProcess(0, 0);
        const m = new NormalCLVModel(bsProcess, ouProcess, null, 5);
        const rndCalculator = new BSMRNDCalculator(bsProcess);
        const tol = 1e5 * QL_EPSILON;
        const t = dc.yearFraction(today, maturity);
        for (let x = 10; x < 400; x += 10) {
            const calculated = m.cdf(maturity, x);
            const expected = rndCalculator.cdf(Math.log(x), t);
            expect(Math.abs(calculated - expected)).toBeLessThan(tol);
        }
        backup.dispose();
    });
    it('Testing Heston cumulative distribution function...', () => {
    });
    it('Testing illustrative 1D example of normal CLV model...', () => {
    });
    it('Testing Monte Carlo BS option pricing...', () => {
    });
    it('Testing double no-touch pricing with normal CLV model...', () => {
    });
});