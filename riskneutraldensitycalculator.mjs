import { Actual365Fixed, BlackCalculator, BlackScholesMertonProcess, BSMRNDCalculator, Handle, Option, QL_EPSILON, SavedSettings, Settings, SimpleQuote } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql/ql.mjs';
import { flatRate2, flatVol4 } from '/test-suite/utilities.mjs';

describe('Risk neutral density calculator tests', () => {
    it('Testing density against option prices...', () => {
        const backup = new SavedSettings();
        const dayCounter = new Actual365Fixed();
        const todaysDate = Settings.evaluationDate.f();
        const s0 = 100;
        const spot = new Handle(new SimpleQuote(s0));
        const r = 0.075;
        const q = 0.04;
        const v = 0.27;
        const rTS = new Handle(flatRate2(todaysDate, r, dayCounter));
        const qTS = new Handle(flatRate2(todaysDate, q, dayCounter));
        const bsmProcess = new BlackScholesMertonProcess(spot, qTS, rTS, new Handle(flatVol4(v, dayCounter)));
        const bsm = new BSMRNDCalculator(bsmProcess);
        const times = [0.5, 1.0, 2.0];
        const strikes = [75.0, 100.0, 150.0];
        for (let i = 0; i < times.length; ++i) {
            const t = times[i];
            const stdDev = v * Math.sqrt(t);
            const df = rTS.currentLink().discount2(t);
            const fwd = s0 * qTS.currentLink().discount2(t) / df;
            for (let j = 0; j < strikes.length; ++j) {
                const strike = strikes[j];
                const xs = Math.log(strike);
                const blackCalc = new BlackCalculator().init2(Option.Type.Put, strike, fwd, stdDev, df);
                const tol = Math.sqrt(QL_EPSILON);
                const calculatedCDF = bsm.cdf(xs, t);
                const expectedCDF = blackCalc.strikeSensitivity() / df;
                expect(Math.abs(calculatedCDF - expectedCDF)).toBeLessThan(tol);
                const deltaStrike = strike * Math.sqrt(QL_EPSILON);
                const calculatedPDF = bsm.pdf(xs, t);
                const expectedPDF = strike / df *
                    (new BlackCalculator()
                        .init2(Option.Type.Put, strike + deltaStrike, fwd, stdDev, df)
                        .strikeSensitivity() -
                        new BlackCalculator()
                            .init2(Option.Type.Put, strike - deltaStrike, fwd, stdDev, df)
                            .strikeSensitivity()) /
                    (2 * deltaStrike);
                expect(Math.abs(calculatedPDF - expectedPDF)).toBeLessThan(tol);
            }
        }
        backup.dispose();
    });
    it('Testing Black-Scholes-Merton and Heston densities...', () => {
    });
    it('Testing Fokker-Planck forward equation for local volatility' +
        ' process to calculate risk neutral densities...', () => {
    });
    it('Testing probability density for a square root process...', () => {
    });
    it('Testing probability density for a BSM process with strike' +
        ' dependent volatility vs local volatility...', () => {
    });
});