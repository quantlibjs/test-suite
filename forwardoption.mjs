import { Actual360, AnalyticEuropeanEngine, BinomialVanillaEngine, BlackScholesMertonProcess, CoxRossRubinstein, DateExt, EuropeanExercise, ForwardPerformanceVanillaEngine, ForwardVanillaEngine, ForwardVanillaOption, Handle, Option, PlainVanillaPayoff, QL_NULL_REAL, SavedSettings, Settings, SimpleQuote, TimeUnit, VanillaOption } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate1, flatRate3, flatVol1, flatVol3, relativeError } from '/test-suite/utilities.mjs';

const first = 0;

class ForwardOptionData {
    constructor(type, moneyness, s, q, r, start, t, v, result, tol) {
        this.type = type;
        this.moneyness = moneyness;
        this.s = s;
        this.q = q;
        this.r = r;
        this.start = start;
        this.t = t;
        this.v = v;
        this.result = result;
        this.tol = tol;
    }
}

function testForwardGreeks(Engine) {
    const calculated = new Map(), expected = new Map(), tolerance = new Map();
    tolerance.set('delta', 1.0e-5);
    tolerance.set('gamma', 1.0e-5);
    tolerance.set('theta', 1.0e-5);
    tolerance.set('rho', 1.0e-5);
    tolerance.set('divRho', 1.0e-5);
    tolerance.set('vega', 1.0e-5);
    const types = [Option.Type.Call, Option.Type.Put];
    const moneyness = [0.9, 1.0, 1.1];
    const underlyings = [100.0];
    const qRates = [0.04, 0.05, 0.06];
    const rRates = [0.01, 0.05, 0.15];
    const lengths = [1, 2];
    const startMonths = [6, 9];
    const vols = [0.11, 0.50, 1.20];
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
    const stochProcess = new BlackScholesMertonProcess(new Handle(spot), qTS, rTS, volTS);
    const engine = Engine.init1(stochProcess);
    for (let i = 0; i < types.length; i++) {
        for (let j = 0; j < moneyness.length; j++) {
            for (let k = 0; k < lengths.length; k++) {
                for (let h = 0; h < startMonths.length; h++) {
                    const exDate = DateExt.advance(today, lengths[k], TimeUnit.Years);
                    const exercise = new EuropeanExercise(exDate);
                    const reset = DateExt.advance(today, startMonths[h], TimeUnit.Months);
                    const payoff = new PlainVanillaPayoff(types[i], 0.0);
                    const option = new ForwardVanillaOption(moneyness[j], reset, payoff, exercise);
                    option.setPricingEngine(engine);
                    for (let l = 0; l < underlyings.length; l++) {
                        for (let m = 0; m < qRates.length; m++) {
                            for (let n = 0; n < rRates.length; n++) {
                                for (let p = 0; p < vols.length; p++) {
                                    const u = underlyings[l];
                                    const q = qRates[m], r = rRates[n];
                                    const v = vols[p];
                                    spot.setValue(u);
                                    qRate.setValue(q);
                                    rRate.setValue(r);
                                    vol.setValue(v);
                                    const value = option.NPV();
                                    calculated.set('delta', option.delta());
                                    calculated.set('gamma', option.gamma());
                                    calculated.set('theta', option.theta());
                                    calculated.set('rho', option.rho());
                                    calculated.set('divRho', option.dividendRho());
                                    calculated.set('vega', option.vega());
                                    if (value > spot.value() * 1.0e-5) {
                                        const du = u * 1.0e-4;
                                        spot.setValue(u + du);
                                        let value_p = option.NPV();
                                        const delta_p = option.delta();
                                        spot.setValue(u - du);
                                        let value_m = option.NPV();
                                        const delta_m = option.delta();
                                        spot.setValue(u);
                                        expected.set('delta', (value_p - value_m) / (2 * du));
                                        expected.set('gamma', (delta_p - delta_m) / (2 * du));
                                        const dr = r * 1.0e-4;
                                        rRate.setValue(r + dr);
                                        value_p = option.NPV();
                                        rRate.setValue(r - dr);
                                        value_m = option.NPV();
                                        rRate.setValue(r);
                                        expected.set('rho', (value_p - value_m) / (2 * dr));
                                        const dq = q * 1.0e-4;
                                        qRate.setValue(q + dq);
                                        value_p = option.NPV();
                                        qRate.setValue(q - dq);
                                        value_m = option.NPV();
                                        qRate.setValue(q);
                                        expected.set('divRho', (value_p - value_m) / (2 * dq));
                                        const dv = v * 1.0e-4;
                                        vol.setValue(v + dv);
                                        value_p = option.NPV();
                                        vol.setValue(v - dv);
                                        value_m = option.NPV();
                                        vol.setValue(v);
                                        expected.set('vega', (value_p - value_m) / (2 * dv));
                                        const dT = dc.yearFraction(DateExt.sub(today, 1), DateExt.add(today, 1));
                                        Settings.evaluationDate.set(DateExt.sub(today, 1));
                                        value_m = option.NPV();
                                        Settings.evaluationDate.set(DateExt.add(today, 1));
                                        value_p = option.NPV();
                                        Settings.evaluationDate.set(today);
                                        expected.set('theta', (value_p - value_m) / dT);
                                        let it;
                                        const calculatedArray = Array.from(calculated);
                                        for (it = 0; it < calculatedArray.length; ++it) {
                                            const greek = calculatedArray[it][first];
                                            const expct = expected.get(greek), calcl = calculated.get(greek), tol = tolerance.get(greek);
                                            const error = relativeError(expct, calcl, u);
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
    }
}

class TestBinomialEngine extends BinomialVanillaEngine {
    constructor(process) {
        super(new CoxRossRubinstein());
        this.bveInit(process, 300);
    }
}

describe('Forward option tests', () => {
    it('Testing forward option values...', () => {
        const values = [
            new ForwardOptionData(Option.Type.Call, 1.1, 60.0, 0.04, 0.08, 0.25, 1.0, 0.30, 4.4064, 1.0e-4),
            new ForwardOptionData(Option.Type.Put, 1.1, 60.0, 0.04, 0.08, 0.25, 1.0, 0.30, 8.2971, 1.0e-4)
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
        const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
        const engine = new ForwardVanillaEngine(new AnalyticEuropeanEngine())
            .init1(stochProcess);
        for (let i = 0; i < values.length; i++) {
            const payoff = new PlainVanillaPayoff(values[i].type, 0.0);
            const exDate = DateExt.add(today, Math.floor(values[i].t * 360 + 0.5));
            const exercise = new EuropeanExercise(exDate);
            const reset = DateExt.add(today, Math.floor(values[i].start * 360 + 0.5));
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol.setValue(values[i].v);
            const option = new ForwardVanillaOption(values[i].moneyness, reset, payoff, exercise);
            option.setPricingEngine(engine);
            const calculated = option.NPV();
            const error = Math.abs(calculated - values[i].result);
            const tolerance = 1e-4;
            expect(error).toBeLessThan(tolerance);
        }
    });
    it('Testing forward performance option values...', () => {
        const values = [
            new ForwardOptionData(Option.Type.Call, 1.1, 60.0, 0.04, 0.08, 0.25, 1.0, 0.30, 4.4064 / 60 * Math.exp(-0.04 * 0.25), 1.0e-4),
            new ForwardOptionData(Option.Type.Put, 1.1, 60.0, 0.04, 0.08, 0.25, 1.0, 0.30, 8.2971 / 60 * Math.exp(-0.04 * 0.25), 1.0e-4)
        ];
        const dc = new Actual360();
        const today = new Date();
        const spot = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.0);
        const qTS = new Handle(flatRate1(today, qRate, dc));
        const rRate = new SimpleQuote(0.0);
        const rTS = new Handle(flatRate1(today, rRate, dc));
        const vol = new SimpleQuote(0.0);
        const volTS = new Handle(flatVol1(today, vol, dc));
        const stochProcess = new BlackScholesMertonProcess(new Handle(spot), qTS, rTS, volTS);
        const engine = new ForwardPerformanceVanillaEngine(new AnalyticEuropeanEngine())
            .init1(stochProcess);
        for (let i = 0; i < values.length; i++) {
            const payoff = new PlainVanillaPayoff(values[i].type, 0.0);
            const exDate = DateExt.add(today, Math.floor(values[i].t * 360 + 0.5));
            const exercise = new EuropeanExercise(exDate);
            const reset = DateExt.add(today, Math.floor(values[i].start * 360 + 0.5));
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol.setValue(values[i].v);
            const option = new ForwardVanillaOption(values[i].moneyness, reset, payoff, exercise);
            option.setPricingEngine(engine);
            const calculated = option.NPV();
            const error = Math.abs(calculated - values[i].result);
            const tolerance = 1e-4;
            expect(error).toBeLessThan(tolerance);
        }
    });
    it('Testing forward option greeks...', () => {
        const backup = new SavedSettings();
        testForwardGreeks(new ForwardVanillaEngine());
        backup.dispose();
    });
    it('Testing forward performance option greeks...', () => {
        const backup = new SavedSettings();
        testForwardGreeks(new ForwardPerformanceVanillaEngine());
        backup.dispose();
    });
    it('Testing forward option greeks initialization...', () => {
        const dc = new Actual360();
        const backup = new SavedSettings();
        const today = new Date();
        Settings.evaluationDate.set(today);
        const spot = new SimpleQuote(100.0);
        const qRate = new SimpleQuote(0.04);
        const qTS = new Handle(flatRate3(qRate, dc));
        const rRate = new SimpleQuote(0.01);
        const rTS = new Handle(flatRate3(rRate, dc));
        const vol = new SimpleQuote(0.11);
        const volTS = new Handle(flatVol3(vol, dc));
        const stochProcess = new BlackScholesMertonProcess(new Handle(spot), qTS, rTS, volTS);
        const engine = new ForwardVanillaEngine(new TestBinomialEngine(stochProcess));
        const exDate = DateExt.advance(today, 1, TimeUnit.Years);
        const exercise = new EuropeanExercise(exDate);
        const reset = DateExt.advance(today, 6, TimeUnit.Months);
        const payoff = new PlainVanillaPayoff(Option.Type.Call, 0.0);
        const option = new ForwardVanillaOption(0.9, reset, payoff, exercise);
        option.setPricingEngine(engine);
        const ctrlengine = new TestBinomialEngine(stochProcess);
        const ctrloption = new VanillaOption(payoff, exercise);
        ctrloption.setPricingEngine(ctrlengine);
        let delta = 0;
        try {
            delta = ctrloption.delta();
        }
        catch (e) {
            try {
                delta = option.delta();
            }
            catch (e) {
                delta = QL_NULL_REAL;
            }
            expect(delta).not.toEqual(QL_NULL_REAL);
        }
        let rho = 0;
        try {
            rho = ctrloption.rho();
        }
        catch (e) {
            try {
                rho = option.rho();
            }
            catch (e) {
                rho = QL_NULL_REAL;
            }
            expect(rho).not.toEqual(QL_NULL_REAL);
        }
        let divRho = 0;
        try {
            divRho = ctrloption.dividendRho();
        }
        catch (e) {
            try {
                divRho = option.dividendRho();
            }
            catch (e) {
                divRho = QL_NULL_REAL;
            }
            expect(divRho).not.toEqual(QL_NULL_REAL);
        }
        let vega = 0;
        try {
            vega = ctrloption.vega();
        }
        catch (e) {
            try {
                vega = option.vega();
            }
            catch (e) {
                vega = QL_NULL_REAL;
            }
            expect(vega).not.toEqual(QL_NULL_REAL);
        }
        backup.dispose();
    });
});