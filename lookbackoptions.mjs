import { Actual360, AnalyticContinuousFloatingLookbackEngine, BlackScholesMertonProcess, ContinuousFloatingLookbackOption, DateExt, EuropeanExercise, FloatingTypePayoff, Handle, Option, SimpleQuote } from '/ql.mjs';
import { flatRate1, flatVol1 } from '/test-suite/utilities.mjs';
class LookbackOptionData {
    constructor(type, strike, minmax, s, q, r, t, v, l, t1, result, tol) {
        this.type = type;
        this.strike = strike;
        this.minmax = minmax;
        this.s = s;
        this.q = q;
        this.r = r;
        this.t = t;
        this.v = v;
        this.l = l;
        this.t1 = t1;
        this.result = result;
        this.tol = tol;
    }
}
describe('Lookback option tests', () => {
    it('Testing analytic continuous floating-strike lookback options...', () => {
        const values = [
            new LookbackOptionData(Option.Type.Call, 0, 100, 120.0, 0.06, 0.10, 0.50, 0.30, 0, 0, 25.3533, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 0, 100, 100.0, 0.00, 0.05, 1.00, 0.30, 0, 0, 23.7884, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 0, 100, 100.0, 0.00, 0.05, 0.20, 0.30, 0, 0, 10.7190, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 0, 100, 110.0, 0.00, 0.05, 0.20, 0.30, 0, 0, 14.4597, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 0, 100, 100.0, 0.00, 0.10, 0.50, 0.30, 0, 0, 15.3526, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 0, 110, 100.0, 0.00, 0.10, 0.50, 0.30, 0, 0, 16.8468, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 0, 120, 100.0, 0.00, 0.10, 0.50, 0.30, 0, 0, 21.0645, 1.0e-4),
        ];
        const dc = new Actual360();
        const today = new Date();
        const spot = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.0);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.0);
        const rTS = flatRate1(today, rRate, dc);
        const vol = new SimpleQuote(0.0);
        const volTS = flatVol1(today, vol, dc);
        for (let i = 0; i < values.length; i++) {
            const exDate = DateExt.add(today, Math.floor(values[i].t * 360 + 0.5));
            const exercise = new EuropeanExercise(exDate);
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol.setValue(values[i].v);
            const payoff = new FloatingTypePayoff(values[i].type);
            const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
            const engine = new AnalyticContinuousFloatingLookbackEngine(stochProcess);
            const option = new ContinuousFloatingLookbackOption(values[i].minmax, payoff, exercise);
            option.setPricingEngine(engine);
            const calculated = option.NPV();
            const expected = values[i].result;
            const error = Math.abs(calculated - expected);
            expect(error).toBeLessThan(values[i].tol);
        }
    });
    it('Testing analytic continuous fixed-strike lookback options...', () => {
    });
    it('Testing analytic continuous partial floating-strike lookback options...', () => {
    });
    it('Testing analytic continuous fixed-strike lookback options...', () => {
    });
});
//# sourceMappingURL=lookbackoptions.js.map