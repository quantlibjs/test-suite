import { Actual365Fixed, AnalyticBSMHullWhiteEngine, AnalyticEuropeanEngine, BlackScholesMertonProcess, DateExt, EuropeanExercise, EuropeanOption, Handle, HullWhite, Option, PlainVanillaPayoff, SavedSettings, Settings, SimpleQuote, TimeUnit, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate1, flatVol1, flatVol2 } from '/test-suite/utilities.mjs';

describe(`Hybrid Heston-HullWhite tests ${version}`, () => {
    it('Testing European option pricing for a BSM process' +
        ' with one-factor Hull-White model...', () => {
        const backup = new SavedSettings();
        const dc = new Actual365Fixed();
        const today = new Date();
        const maturity = DateExt.advance(today, 20, TimeUnit.Years);
        Settings.evaluationDate.set(today);
        const spot = new Handle(new SimpleQuote(100.0));
        const qRate = new SimpleQuote(0.04);
        const qTS = new Handle(flatRate1(today, qRate, dc));
        const rRate = new SimpleQuote(0.0525);
        const rTS = new Handle(flatRate1(today, rRate, dc));
        const vol = new SimpleQuote(0.25);
        const volTS = new Handle(flatVol1(today, vol, dc));
        const hullWhiteModel = new HullWhite(rTS, 0.00883, 0.00526);
        const stochProcess = new BlackScholesMertonProcess(spot, qTS, rTS, volTS);
        const exercise = new EuropeanExercise(maturity);
        const fwd = spot.currentLink().value() *
            qTS.currentLink().discount1(maturity) /
            rTS.currentLink().discount1(maturity);
        const payoff = new PlainVanillaPayoff(Option.Type.Call, fwd);
        const option = new EuropeanOption(payoff, exercise);
        const tol = 1e-8;
        const corr = [-0.75, -0.25, 0.0, 0.25, 0.75];
        const expectedVol = [0.217064577, 0.243995801, 0.256402830, 0.268236596, 0.290461343];
        for (let i = 0; i < corr.length; ++i) {
            const bsmhwEngine = new AnalyticBSMHullWhiteEngine(corr[i], stochProcess, hullWhiteModel);
            option.setPricingEngine(bsmhwEngine);
            const npv = option.NPV();
            const compVolTS = new Handle(flatVol2(today, expectedVol[i], dc));
            const bsProcess = new BlackScholesMertonProcess(spot, qTS, rTS, compVolTS);
            const bsEngine = new AnalyticEuropeanEngine().init1(bsProcess);
            const comp = new EuropeanOption(payoff, exercise);
            comp.setPricingEngine(bsEngine);
            const impliedVol = comp.impliedVolatility(npv, bsProcess, 1e-10, 100);
            expect(Math.abs(impliedVol - expectedVol[i])).toBeLessThan(tol);
            expect(Math.abs((comp.NPV() - npv) / npv)).toBeLessThan(tol);
            expect(Math.abs(comp.delta() - option.delta())).toBeLessThan(tol);
            expect(Math.abs((comp.gamma() - option.gamma()) / npv))
                .toBeLessThan(tol);
            expect(Math.abs((comp.theta() - option.theta()) / npv))
                .toBeLessThan(tol);
            expect(Math.abs((comp.vega() - option.vega()) / npv))
                .toBeLessThan(tol);
        }
        backup.dispose();
    });
    it('Comparing European option pricing for a BSM process' +
        ' with one-factor Hull-White model...', () => {
    });
    it('Testing Monte-Carlo zero bond pricing...', () => {
    });
    it('Testing Monte-Carlo vanilla option pricing...', () => {
    });
    it('Testing Monte-Carlo Heston option pricing...', () => {
    });
    it('Testing analytic Heston Hull-White option pricing...', () => {
    });
});