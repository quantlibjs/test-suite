import { Actual360, AmericanExercise, AnalyticDigitalAmericanEngine, AnalyticDigitalAmericanKOEngine, AnalyticEuropeanEngine, AssetOrNothingPayoff, BlackScholesMertonProcess, CashOrNothingPayoff, DateExt, EuropeanExercise, GapPayoff, Handle, LowDiscrepancy, MakeMCDigitalEngine, Option, SavedSettings, Settings, SimpleQuote, VanillaOption, first } from '/ql.mjs';
import { flatRate1, flatRate3, flatVol1, flatVol3, relativeError } from '/test-suite/utilities.mjs';
class DigitalOptionData {
    constructor(type, strike, s, q, r, t, v, result, tol, knockin) {
        this.strike = strike;
        this.s = s;
        this.q = q;
        this.r = r;
        this.t = t;
        this.v = v;
        this.result = result;
        this.tol = tol;
        this.knockin = knockin;
    }
}
describe('Digital option tests', () => {
    it('Testing European cash-or-nothing digital option...', () => {
        const values = [
            new DigitalOptionData(Option.Type.Put, 80.00, 100.0, 0.06, 0.06, 0.75, 0.35, 2.6710, 1e-4, true)
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
            const payoff = new CashOrNothingPayoff(values[i].type, values[i].strike, 10.0);
            const exDate = DateExt.add(today, Math.floor(values[i].t * 360 + 0.5));
            const exercise = new EuropeanExercise(exDate);
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol.setValue(values[i].v);
            const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
            const engine = new AnalyticEuropeanEngine().init1(stochProcess);
            const opt = new VanillaOption(payoff, exercise);
            opt.setPricingEngine(engine);
            const calculated = opt.NPV();
            const error = Math.abs(calculated - values[i].result);
            expect(error).toBeLessThan(values[i].tol);
        }
    });
    it('Testing European asset-or-nothing digital option...', () => {
        const values = [
            new DigitalOptionData(Option.Type.Put, 65.00, 70.0, 0.05, 0.07, 0.50, 0.27, 20.2069, 1e-4, true)
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
            const payoff = new AssetOrNothingPayoff(values[i].type, values[i].strike);
            const exDate = DateExt.add(today, Math.floor(values[i].t * 360 + 0.5));
            const exercise = new EuropeanExercise(exDate);
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol.setValue(values[i].v);
            const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
            const engine = new AnalyticEuropeanEngine().init1(stochProcess);
            const opt = new VanillaOption(payoff, exercise);
            opt.setPricingEngine(engine);
            const calculated = opt.NPV();
            const error = Math.abs(calculated - values[i].result);
            expect(error).toBeLessThan(values[i].tol);
        }
    });
    it('Testing European gap digital option...', () => {
        const values = [
            new DigitalOptionData(Option.Type.Call, 50.00, 50.0, 0.00, 0.09, 0.50, 0.20, -0.0053, 1e-4, true)
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
            const payoff = new GapPayoff(values[i].type, values[i].strike, 57.00);
            const exDate = DateExt.add(today, Math.floor(values[i].t * 360 + 0.5));
            const exercise = new EuropeanExercise(exDate);
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol.setValue(values[i].v);
            const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
            const engine = new AnalyticEuropeanEngine().init1(stochProcess);
            const opt = new VanillaOption(payoff, exercise);
            opt.setPricingEngine(engine);
            const calculated = opt.NPV();
            const error = Math.abs(calculated - values[i].result);
            expect(error).toBeLessThan(values[i].tol);
        }
    });
    it('Testing American cash-(at-hit)-or-nothing digital option...', () => {
        const values = [
            new DigitalOptionData(Option.Type.Put, 100.00, 105.00, 0.00, 0.10, 0.5, 0.20, 9.7264, 1e-4, true),
            new DigitalOptionData(Option.Type.Call, 100.00, 95.00, 0.00, 0.10, 0.5, 0.20, 11.6553, 1e-4, true),
            new DigitalOptionData(Option.Type.Call, 100.00, 105.00, 0.00, 0.10, 0.5, 0.20, 15.0000, 1e-16, true),
            new DigitalOptionData(Option.Type.Put, 100.00, 95.00, 0.00, 0.10, 0.5, 0.20, 15.0000, 1e-16, true),
            new DigitalOptionData(Option.Type.Put, 100.00, 105.00, 0.20, 0.10, 0.5, 0.20, 12.2715, 1e-4, true),
            new DigitalOptionData(Option.Type.Call, 100.00, 95.00, 0.20, 0.10, 0.5, 0.20, 8.9109, 1e-4, true),
            new DigitalOptionData(Option.Type.Call, 100.00, 105.00, 0.20, 0.10, 0.5, 0.20, 15.0000, 1e-16, true),
            new DigitalOptionData(Option.Type.Put, 100.00, 95.00, 0.20, 0.10, 0.5, 0.20, 15.0000, 1e-16, true)
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
            const payoff = new CashOrNothingPayoff(values[i].type, values[i].strike, 15.00);
            const exDate = DateExt.add(today, Math.floor(values[i].t * 360 + 0.5));
            const amExercise = new AmericanExercise().init1(today, exDate);
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol.setValue(values[i].v);
            const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
            const engine = new AnalyticDigitalAmericanEngine(stochProcess);
            const opt = new VanillaOption(payoff, amExercise);
            opt.setPricingEngine(engine);
            const calculated = opt.NPV();
            const error = Math.abs(calculated - values[i].result);
            expect(error).toBeLessThan(values[i].tol);
        }
    });
    it('Testing American asset-(at-hit)-or-nothing digital option...', () => {
        const values = [
            new DigitalOptionData(Option.Type.Put, 100.00, 105.00, 0.00, 0.10, 0.5, 0.20, 64.8426, 1e-04, true),
            new DigitalOptionData(Option.Type.Call, 100.00, 95.00, 0.00, 0.10, 0.5, 0.20, 77.7017, 1e-04, true),
            new DigitalOptionData(Option.Type.Put, 100.00, 105.00, 0.01, 0.10, 0.5, 0.20, 65.7811, 1e-04, true),
            new DigitalOptionData(Option.Type.Call, 100.00, 95.00, 0.01, 0.10, 0.5, 0.20, 76.8858, 1e-04, true),
            new DigitalOptionData(Option.Type.Call, 100.00, 105.00, 0.00, 0.10, 0.5, 0.20, 105.0000, 1e-16, true),
            new DigitalOptionData(Option.Type.Put, 100.00, 95.00, 0.00, 0.10, 0.5, 0.20, 95.0000, 1e-16, true),
            new DigitalOptionData(Option.Type.Call, 100.00, 105.00, 0.01, 0.10, 0.5, 0.20, 105.0000, 1e-16, true),
            new DigitalOptionData(Option.Type.Put, 100.00, 95.00, 0.01, 0.10, 0.5, 0.20, 95.0000, 1e-16, true)
        ];
        const dc = new Actual360();
        const today = new Date();
        const spot = new SimpleQuote(100.0);
        const qRate = new SimpleQuote(0.04);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.01);
        const rTS = flatRate1(today, rRate, dc);
        const vol = new SimpleQuote(0.25);
        const volTS = flatVol1(today, vol, dc);
        for (let i = 0; i < values.length; i++) {
            const payoff = new AssetOrNothingPayoff(values[i].type, values[i].strike);
            const exDate = DateExt.add(today, Math.floor(values[i].t * 360 + 0.5));
            const amExercise = new AmericanExercise().init1(today, exDate);
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol.setValue(values[i].v);
            const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
            const engine = new AnalyticDigitalAmericanEngine(stochProcess);
            const opt = new VanillaOption(payoff, amExercise);
            opt.setPricingEngine(engine);
            const calculated = opt.NPV();
            const error = Math.abs(calculated - values[i].result);
            expect(error).toBeLessThan(values[i].tol);
        }
    });
    it('Testing American cash-(at-expiry)-or-nothing digital option...', () => {
        const values = [
            new DigitalOptionData(Option.Type.Put, 100.00, 105.00, 0.00, 0.10, 0.5, 0.20, 9.3604, 1e-4, true),
            new DigitalOptionData(Option.Type.Call, 100.00, 95.00, 0.00, 0.10, 0.5, 0.20, 11.2223, 1e-4, true),
            new DigitalOptionData(Option.Type.Put, 100.00, 105.00, 0.00, 0.10, 0.5, 0.20, 4.9081, 1e-4, false),
            new DigitalOptionData(Option.Type.Call, 100.00, 95.00, 0.00, 0.10, 0.5, 0.20, 3.0461, 1e-4, false),
            new DigitalOptionData(Option.Type.Call, 100.00, 105.00, 0.00, 0.10, 0.5, 0.20, 15.0000 * Math.exp(-0.05), 1e-12, true),
            new DigitalOptionData(Option.Type.Put, 100.00, 95.00, 0.00, 0.10, 0.5, 0.20, 15.0000 * Math.exp(-0.05), 1e-12, true),
            new DigitalOptionData(Option.Type.Call, 2.37, 2.33, 0.07, 0.43, 0.19, 0.005, 0.0000, 1e-4, false)
        ];
        const dc = new Actual360();
        const today = new Date();
        const spot = new SimpleQuote(100.0);
        const qRate = new SimpleQuote(0.04);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.01);
        const rTS = flatRate1(today, rRate, dc);
        const vol = new SimpleQuote(0.25);
        const volTS = flatVol1(today, vol, dc);
        for (let i = 0; i < values.length; i++) {
            const payoff = new CashOrNothingPayoff(values[i].type, values[i].strike, 15.0);
            const exDate = DateExt.add(today, Math.floor(values[i].t * 360 + 0.5));
            const amExercise = new AmericanExercise().init1(today, exDate, true);
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol.setValue(values[i].v);
            const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
            let engine;
            if (values[i].knockin) {
                engine = new AnalyticDigitalAmericanEngine(stochProcess);
            }
            else {
                engine = new AnalyticDigitalAmericanKOEngine(stochProcess);
            }
            const opt = new VanillaOption(payoff, amExercise);
            opt.setPricingEngine(engine);
            const calculated = opt.NPV();
            const error = Math.abs(calculated - values[i].result);
            expect(error).toBeLessThan(values[i].tol);
        }
    });
    it('Testing American asset-(at-expiry)-or-nothing digital option...', () => {
        const values = [
            new DigitalOptionData(Option.Type.Put, 100.00, 105.00, 0.00, 0.10, 0.5, 0.20, 64.8426, 1e-04, true),
            new DigitalOptionData(Option.Type.Call, 100.00, 95.00, 0.00, 0.10, 0.5, 0.20, 77.7017, 1e-04, true),
            new DigitalOptionData(Option.Type.Put, 100.00, 105.00, 0.00, 0.10, 0.5, 0.20, 40.1574, 1e-04, false),
            new DigitalOptionData(Option.Type.Call, 100.00, 95.00, 0.00, 0.10, 0.5, 0.20, 17.2983, 1e-04, false),
            new DigitalOptionData(Option.Type.Put, 100.00, 105.00, 0.01, 0.10, 0.5, 0.20, 65.5291, 1e-04, true),
            new DigitalOptionData(Option.Type.Call, 100.00, 95.00, 0.01, 0.10, 0.5, 0.20, 76.5951, 1e-04, true),
            new DigitalOptionData(Option.Type.Call, 100.00, 105.00, 0.00, 0.10, 0.5, 0.20, 105.0000, 1e-12, true),
            new DigitalOptionData(Option.Type.Put, 100.00, 95.00, 0.00, 0.10, 0.5, 0.20, 95.0000, 1e-12, true),
            new DigitalOptionData(Option.Type.Call, 100.00, 105.00, 0.01, 0.10, 0.5, 0.20, 105.0000 * Math.exp(-0.005), 1e-12, true),
            new DigitalOptionData(Option.Type.Put, 100.00, 95.00, 0.01, 0.10, 0.5, 0.20, 95.0000 * Math.exp(-0.005), 1e-12, true)
        ];
        const dc = new Actual360();
        const today = new Date();
        const spot = new SimpleQuote(100.0);
        const qRate = new SimpleQuote(0.04);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.01);
        const rTS = flatRate1(today, rRate, dc);
        const vol = new SimpleQuote(0.25);
        const volTS = flatVol1(today, vol, dc);
        for (let i = 0; i < values.length; i++) {
            const payoff = new AssetOrNothingPayoff(values[i].type, values[i].strike);
            const exDate = DateExt.add(today, Math.floor(values[i].t * 360 + 0.5));
            const amExercise = new AmericanExercise().init1(today, exDate, true);
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol.setValue(values[i].v);
            const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
            let engine;
            if (values[i].knockin) {
                engine = new AnalyticDigitalAmericanEngine(stochProcess);
            }
            else {
                engine = new AnalyticDigitalAmericanKOEngine(stochProcess);
            }
            const opt = new VanillaOption(payoff, amExercise);
            opt.setPricingEngine(engine);
            const calculated = opt.NPV();
            const error = Math.abs(calculated - values[i].result);
            expect(error).toBeLessThan(values[i].tol);
        }
    });
    it('Testing American cash-(at-hit)-or-nothing digital option greeks...', () => {
        const backup = new SavedSettings();
        const calculated = new Map(), expected = new Map(), tolerance = new Map();
        tolerance.set('delta', 5.0e-5);
        tolerance.set('gamma', 5.0e-5);
        tolerance.set('rho', 5.0e-5);
        const types = [Option.Type.Call, Option.Type.Put];
        const strikes = [50.0, 99.5, 100.5, 150.0];
        const cashPayoff = 100.0;
        const underlyings = [100];
        const qRates = [0.04, 0.05, 0.06];
        const rRates = [0.01, 0.05, 0.15];
        const vols = [0.11, 0.5, 1.2];
        const dc = new Actual360();
        const today = new Date();
        Settings.evaluationDate.set(today);
        const spot = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.0);
        const qTS = new Handle(flatRate3(qRate, dc));
        const rRate = new SimpleQuote(0.0);
        const rTS = new Handle(flatRate3(rRate, dc));
        const vol = new SimpleQuote(0.0);
        const volTS = new Handle(flatVol3(vol, dc));
        const exDate = DateExt.add(today, 360);
        const exercise = new EuropeanExercise(exDate);
        const amExercise = new AmericanExercise().init1(today, exDate, false);
        const exercises = [exercise, amExercise];
        const stochProcess = new BlackScholesMertonProcess(new Handle(spot), qTS, rTS, volTS);
        const euroEngine = new AnalyticEuropeanEngine().init1(stochProcess);
        const amEngine = new AnalyticDigitalAmericanEngine(stochProcess);
        const engines = [euroEngine, amEngine];
        for (let j = 0; j < engines.length; j++) {
            for (let i1 = 0; i1 < types.length; i1++) {
                for (let i6 = 0; i6 < strikes.length; i6++) {
                    const payoff = new CashOrNothingPayoff(types[i1], strikes[i6], cashPayoff);
                    const opt = new VanillaOption(payoff, exercises[j]);
                    opt.setPricingEngine(engines[j]);
                    for (let i2 = 0; i2 < underlyings.length; i2++) {
                        for (let i4 = 0; i4 < qRates.length; i4++) {
                            for (let i3 = 0; i3 < rRates.length; i3++) {
                                for (let i7 = 0; i7 < vols.length; i7++) {
                                    const u = underlyings[i2];
                                    const q = qRates[i4];
                                    const r = rRates[i3];
                                    const v = vols[i7];
                                    spot.setValue(u);
                                    qRate.setValue(q);
                                    rRate.setValue(r);
                                    vol.setValue(v);
                                    const value = opt.NPV();
                                    calculated.set('delta', opt.delta());
                                    calculated.set('gamma', opt.gamma());
                                    calculated.set('rho', opt.rho());
                                    if (value > 1.0e-6) {
                                        const du = u * 1.0e-4;
                                        spot.setValue(u + du);
                                        let value_p = opt.NPV();
                                        const delta_p = opt.delta();
                                        spot.setValue(u - du);
                                        let value_m = opt.NPV();
                                        const delta_m = opt.delta();
                                        spot.setValue(u);
                                        expected.set('delta', (value_p - value_m) / (2 * du));
                                        expected.set('gamma', (delta_p - delta_m) / (2 * du));
                                        const dr = r * 1.0e-4;
                                        rRate.setValue(r + dr);
                                        value_p = opt.NPV();
                                        rRate.setValue(r - dr);
                                        value_m = opt.NPV();
                                        rRate.setValue(r);
                                        expected.set('rho', (value_p - value_m) / (2 * dr));
                                        let it;
                                        const calculatedArray = Array.from(calculated);
                                        for (it = 0; it < calculatedArray.length; ++it) {
                                            const greek = calculatedArray[it][first];
                                            const expct = expected.get(greek), calcl = calculated.get(greek), tol = tolerance.get(greek);
                                            const error = relativeError(expct, calcl, value);
                                            expect(error).toBeLessThan(tol);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        backup.dispose();
    });
    it('Testing Monte Carlo cash-(at-hit)-or-nothing American engine...', () => {
        const backup = new SavedSettings();
        const values = [
            new DigitalOptionData(Option.Type.Put, 100.00, 105.00, 0.20, 0.10, 0.5, 0.20, 12.2715, 1e-2, true),
            new DigitalOptionData(Option.Type.Call, 100.00, 95.00, 0.20, 0.10, 0.5, 0.20, 8.9109, 1e-2, true)
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
        const timeStepsPerYear = 90;
        const maxSamples = 1000000;
        const seed = 1;
        for (let i = 0; i < values.length; i++) {
            const payoff = new CashOrNothingPayoff(values[i].type, values[i].strike, 15.0);
            const exDate = DateExt.add(today, Math.floor(values[i].t * 360 + 0.5));
            const amExercise = new AmericanExercise().init1(today, exDate);
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol.setValue(values[i].v);
            const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
            const requiredSamples = Math.floor(Math.pow(2.0, 14) - 1);
            const mcldEngine = new MakeMCDigitalEngine(new LowDiscrepancy())
                .mmcdeInit(stochProcess)
                .withStepsPerYear(timeStepsPerYear)
                .withBrownianBridge()
                .withSamples(requiredSamples)
                .withMaxSamples(maxSamples)
                .withSeed(seed)
                .f();
            const opt = new VanillaOption(payoff, amExercise);
            opt.setPricingEngine(mcldEngine);
            const calculated = opt.NPV();
            const error = Math.abs(calculated - values[i].result);
            expect(error).toBeLessThan(values[i].tol);
        }
        backup.dispose();
    });
});
//# sourceMappingURL=digitaloption.js.map