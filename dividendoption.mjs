import { Actual360, AmericanExercise, AnalyticDividendEuropeanEngine, AnalyticEuropeanEngine, BlackScholesMertonProcess, CrankNicolson, DateExt, DividendVanillaOption, EuropeanExercise, FDDividendAmericanEngine, FDDividendEuropeanEngine, Handle, Option, PlainVanillaPayoff, SavedSettings, Settings, SimpleQuote, TimeUnit, VanillaOption, first } from '/ql.mjs';
import { flatRate3, flatRate4, flatVol3, flatVol4, relativeError } from '/test-suite/utilities.mjs';
function testFdGreeks(Engine, today, exercise) {
    const calculated = new Map(), expected = new Map(), tolerance = new Map();
    tolerance.set('delta', 5.0e-3);
    tolerance.set('gamma', 7.0e-3);
    const types = [Option.Type.Call, Option.Type.Put];
    const strikes = [50.0, 99.5, 100.0, 100.5, 150.0];
    const underlyings = [100.0];
    const qRates = [0.00, 0.10, 0.20];
    const rRates = [0.01, 0.05, 0.15];
    const vols = [0.05, 0.20, 0.50];
    const dc = new Actual360();
    const spot = new SimpleQuote(0.0);
    const qRate = new SimpleQuote(0.0);
    const qTS = new Handle(flatRate3(qRate, dc));
    const rRate = new SimpleQuote(0.0);
    const rTS = new Handle(flatRate3(rRate, dc));
    const vol = new SimpleQuote(0.0);
    const volTS = new Handle(flatVol3(vol, dc));
    for (let i = 0; i < types.length; i++) {
        for (let j = 0; j < strikes.length; j++) {
            const dividendDates = [];
            const dividends = [];
            for (let d = DateExt.advance(today, 3, TimeUnit.Months); d.valueOf() < exercise.lastDate().valueOf(); d = DateExt.advance(d, 6, TimeUnit.Months)) {
                dividendDates.push(d);
                dividends.push(5.0);
            }
            const payoff = new PlainVanillaPayoff(types[i], strikes[j]);
            const stochProcess = new BlackScholesMertonProcess(new Handle(spot), qTS, rTS, volTS);
            const engine = Engine.init1(stochProcess);
            const option = new DividendVanillaOption(payoff, exercise, dividendDates, dividends);
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
                            if (value > spot.value() * 1.0e-5) {
                                const du = u * 1.0e-4;
                                spot.setValue(u + du);
                                const value_p = option.NPV(), delta_p = option.delta();
                                spot.setValue(u - du);
                                const value_m = option.NPV(), delta_m = option.delta();
                                spot.setValue(u);
                                expected.set('delta', (value_p - value_m) / (2 * du));
                                expected.set('gamma', (delta_p - delta_m) / (2 * du));
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
function testFdDegenerate(Engine, today, exercise) {
    const dc = new Actual360();
    const spot = new SimpleQuote(54.625);
    const rTS = new Handle(flatRate4(0.052706, dc));
    const qTS = new Handle(flatRate4(0.0, dc));
    const volTS = new Handle(flatVol4(0.282922, dc));
    const process = new BlackScholesMertonProcess(new Handle(spot), qTS, rTS, volTS);
    const timeSteps = 300;
    const gridPoints = 300;
    const engine = Engine.init1(process, timeSteps, gridPoints);
    const payoff = new PlainVanillaPayoff(Option.Type.Call, 55.0);
    const tolerance = 3.0e-3;
    const dividends = [];
    const dividendDates = [];
    const option1 = new DividendVanillaOption(payoff, exercise, dividendDates, dividends);
    option1.setPricingEngine(engine);
    const refValue = option1.NPV();
    for (let i = 0; i <= 6; i++) {
        dividends.push(0.0);
        dividendDates.push(DateExt.add(today, i));
        const option = new DividendVanillaOption(payoff, exercise, dividendDates, dividends);
        option.setPricingEngine(engine);
        const value = option.NPV();
        expect(Math.abs(refValue - value)).toBeLessThan(tolerance);
    }
}
describe('Dividend European option tests', () => {
    it('Testing dividend European option values with no dividends...', () => {
        const backup = new SavedSettings();
        const tolerance = 1.0e-5;
        const types = [Option.Type.Call, Option.Type.Put];
        const strikes = [50.0, 99.5, 100.0, 100.5, 150.0];
        const underlyings = [100.0];
        const qRates = [0.00, 0.10, 0.30];
        const rRates = [0.01, 0.05, 0.15];
        const lengths = [1, 2];
        const vols = [0.05, 0.20, 0.70];
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
        for (let i = 0; i < types.length; i++) {
            for (let j = 0; j < strikes.length; j++) {
                for (let k = 0; k < lengths.length; k++) {
                    const exDate = DateExt.advance(today, lengths[k], TimeUnit.Years);
                    const exercise = new EuropeanExercise(exDate);
                    const dividendDates = [];
                    const dividends = [];
                    for (let d = DateExt.advance(today, 3, TimeUnit.Months); d.valueOf() < exercise.lastDate().valueOf(); d = DateExt.advance(d, 6, TimeUnit.Months)) {
                        dividendDates.push(d);
                        dividends.push(0.0);
                    }
                    const payoff = new PlainVanillaPayoff(types[i], strikes[j]);
                    const stochProcess = new BlackScholesMertonProcess(new Handle(spot), qTS, rTS, volTS);
                    const ref_engine = new AnalyticEuropeanEngine().init1(stochProcess);
                    const engine = new AnalyticDividendEuropeanEngine(stochProcess);
                    const option = new DividendVanillaOption(payoff, exercise, dividendDates, dividends);
                    option.setPricingEngine(engine);
                    const ref_option = new VanillaOption(payoff, exercise);
                    ref_option.setPricingEngine(ref_engine);
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
                                    const calculated = option.NPV();
                                    const expected = ref_option.NPV();
                                    const error = Math.abs(calculated - expected);
                                    expect(error).toBeLessThan(tolerance);
                                }
                            }
                        }
                    }
                }
            }
        }
        backup.dispose();
    });
    it('Testing dividend European option values with known value...', () => {
        const backup = new SavedSettings();
        const tolerance = 1.0e-2;
        const expected = 3.67;
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
        const exDate = DateExt.advance(today, 6, TimeUnit.Months);
        const exercise = new EuropeanExercise(exDate);
        const dividendDates = [];
        const dividends = [];
        dividendDates.push(DateExt.advance(today, 2, TimeUnit.Months));
        dividends.push(0.50);
        dividendDates.push(DateExt.advance(today, 5, TimeUnit.Months));
        dividends.push(0.50);
        const payoff = new PlainVanillaPayoff(Option.Type.Call, 40.0);
        const stochProcess = new BlackScholesMertonProcess(new Handle(spot), qTS, rTS, volTS);
        const engine = new AnalyticDividendEuropeanEngine(stochProcess);
        const option = new DividendVanillaOption(payoff, exercise, dividendDates, dividends);
        option.setPricingEngine(engine);
        const u = 40.0;
        const q = 0.0, r = 0.09;
        const v = 0.30;
        spot.setValue(u);
        qRate.setValue(q);
        rRate.setValue(r);
        vol.setValue(v);
        const calculated = option.NPV();
        const error = Math.abs(calculated - expected);
        expect(error).toBeLessThan(tolerance);
        backup.dispose();
    });
    it('Testing dividend European option with a dividend on today\'s date...', () => {
        const backup = new SavedSettings();
        const tolerance = 1.0e-5;
        const dividendValue = 10.0;
        const types = [Option.Type.Call, Option.Type.Put];
        const strikes = [50.0, 99.5, 100.0, 100.5, 150.0];
        const underlyings = [100.0];
        const qRates = [0.00, 0.10, 0.30];
        const rRates = [0.01, 0.05, 0.15];
        const lengths = [1, 2];
        const vols = [0.05, 0.20, 0.70];
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
        for (let i = 0; i < types.length; i++) {
            for (let j = 0; j < strikes.length; j++) {
                for (let k = 0; k < lengths.length; k++) {
                    const exDate = DateExt.advance(today, lengths[k], TimeUnit.Years);
                    const exercise = new EuropeanExercise(exDate);
                    const dividendDates = [];
                    const dividends = [];
                    dividendDates.push(today);
                    dividends.push(dividendValue);
                    const payoff = new PlainVanillaPayoff(types[i], strikes[j]);
                    const stochProcess = new BlackScholesMertonProcess(new Handle(spot), qTS, rTS, volTS);
                    const engine = new AnalyticDividendEuropeanEngine(stochProcess);
                    const ref_engine = new AnalyticEuropeanEngine().init1(stochProcess);
                    const option = new DividendVanillaOption(payoff, exercise, dividendDates, dividends);
                    option.setPricingEngine(engine);
                    const ref_option = new VanillaOption(payoff, exercise);
                    ref_option.setPricingEngine(ref_engine);
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
                                    const calculated = option.NPV();
                                    spot.setValue(u - dividendValue);
                                    const expected = ref_option.NPV();
                                    const error = Math.abs(calculated - expected);
                                    expect(error).toBeLessThan(tolerance);
                                }
                            }
                        }
                    }
                }
            }
        }
        backup.dispose();
    });
    it('Testing dividend European option values with end limits...', () => {
        const backup = new SavedSettings();
        const tolerance = 1.0e-5;
        const dividendValue = 10.0;
        const types = [Option.Type.Call, Option.Type.Put];
        const strikes = [50.0, 99.5, 100.0, 100.5, 150.0];
        const underlyings = [100.0];
        const qRates = [0.00, 0.10, 0.30];
        const rRates = [0.01, 0.05, 0.15];
        const lengths = [1, 2];
        const vols = [0.05, 0.20, 0.70];
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
        for (let i = 0; i < types.length; i++) {
            for (let j = 0; j < strikes.length; j++) {
                for (let k = 0; k < lengths.length; k++) {
                    const exDate = DateExt.advance(today, lengths[k], TimeUnit.Years);
                    const exercise = new EuropeanExercise(exDate);
                    const dividendDates = [];
                    const dividends = [];
                    dividendDates.push(exercise.lastDate());
                    dividends.push(dividendValue);
                    const payoff = new PlainVanillaPayoff(types[i], strikes[j]);
                    const refPayoff = new PlainVanillaPayoff(types[i], strikes[j] + dividendValue);
                    const stochProcess = new BlackScholesMertonProcess(new Handle(spot), qTS, rTS, volTS);
                    const engine = new AnalyticDividendEuropeanEngine(stochProcess);
                    const ref_engine = new AnalyticEuropeanEngine().init1(stochProcess);
                    const option = new DividendVanillaOption(payoff, exercise, dividendDates, dividends);
                    option.setPricingEngine(engine);
                    const ref_option = new VanillaOption(refPayoff, exercise);
                    ref_option.setPricingEngine(ref_engine);
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
                                    const calculated = option.NPV();
                                    const expected = ref_option.NPV();
                                    const error = Math.abs(calculated - expected);
                                    expect(error).toBeLessThan(tolerance);
                                }
                            }
                        }
                    }
                }
            }
        }
        backup.dispose();
    });
    it('Testing dividend European option greeks...', () => {
        const backup = new SavedSettings();
        const calculated = new Map(), expected = new Map(), tolerance = new Map();
        tolerance.set('delta', 1.0e-5);
        tolerance.set('gamma', 1.0e-5);
        tolerance.set('theta', 1.0e-5);
        tolerance.set('rho', 1.0e-5);
        tolerance.set('vega', 1.0e-5);
        const types = [Option.Type.Call, Option.Type.Put];
        const strikes = [50.0, 99.5, 100.0, 100.5, 150.0];
        const underlyings = [100.0];
        const qRates = [0.00, 0.10, 0.30];
        const rRates = [0.01, 0.05, 0.15];
        const lengths = [1, 2];
        const vols = [0.05, 0.20, 0.40];
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
        for (let i = 0; i < types.length; i++) {
            for (let j = 0; j < strikes.length; j++) {
                for (let k = 0; k < lengths.length; k++) {
                    const exDate = DateExt.advance(today, lengths[k], TimeUnit.Years);
                    const exercise = new EuropeanExercise(exDate);
                    const dividendDates = [];
                    const dividends = [];
                    for (let d = DateExt.advance(today, 3, TimeUnit.Months); d.valueOf() < exercise.lastDate().valueOf(); d = DateExt.advance(d, 6, TimeUnit.Months)) {
                        dividendDates.push(d);
                        dividends.push(5.0);
                    }
                    const payoff = new PlainVanillaPayoff(types[i], strikes[j]);
                    const stochProcess = new BlackScholesMertonProcess(new Handle(spot), qTS, rTS, volTS);
                    const engine = new AnalyticDividendEuropeanEngine(stochProcess);
                    const option = new DividendVanillaOption(payoff, exercise, dividendDates, dividends);
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
        backup.dispose();
    });
    it('Testing finite-difference dividend European option values...', () => {
        const backup = new SavedSettings();
        const gridPoints = 300;
        const timeSteps = 40;
        const types = [Option.Type.Call, Option.Type.Put];
        const strikes = [50.0, 99.5, 100.0, 100.5, 150.0];
        const underlyings = [100.0];
        const qRates = [0.00];
        const rRates = [0.01, 0.05, 0.15];
        const lengths = [1, 2];
        const vols = [0.05, 0.20, 0.40];
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
        for (let i = 0; i < types.length; i++) {
            for (let j = 0; j < strikes.length; j++) {
                for (let k = 0; k < lengths.length; k++) {
                    const exDate = DateExt.advance(today, lengths[k], TimeUnit.Years);
                    const exercise = new EuropeanExercise(exDate);
                    const dividendDates = [];
                    const dividends = [];
                    for (let d = DateExt.advance(today, 3, TimeUnit.Months); d.valueOf() < exercise.lastDate().valueOf(); d = DateExt.advance(d, 6, TimeUnit.Months)) {
                        dividendDates.push(d);
                        dividends.push(5.0);
                    }
                    const payoff = new PlainVanillaPayoff(types[i], strikes[j]);
                    const stochProcess = new BlackScholesMertonProcess(new Handle(spot), qTS, rTS, volTS);
                    const engine = new FDDividendEuropeanEngine(new CrankNicolson())
                        .init1(stochProcess, timeSteps, gridPoints);
                    const ref_engine = new AnalyticDividendEuropeanEngine(stochProcess);
                    const option = new DividendVanillaOption(payoff, exercise, dividendDates, dividends);
                    option.setPricingEngine(engine);
                    const ref_option = new DividendVanillaOption(payoff, exercise, dividendDates, dividends);
                    ref_option.setPricingEngine(ref_engine);
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
                                    const calculated = option.NPV();
                                    expect(calculated).toBeLessThan(spot.value() * 1.0e-5);
                                }
                            }
                        }
                    }
                }
            }
        }
        backup.dispose();
    });
    it('Testing finite-differences dividend European option greeks...', () => {
        const backup = new SavedSettings();
        const today = new Date();
        Settings.evaluationDate.set(today);
        const lengths = [1, 2];
        for (let i = 0; i < lengths.length; i++) {
            const exDate = DateExt.advance(today, lengths[i], TimeUnit.Years);
            const exercise = new EuropeanExercise(exDate);
            testFdGreeks(new FDDividendEuropeanEngine(new CrankNicolson()), today, exercise);
        }
        backup.dispose();
    });
    it('Testing finite-differences dividend American option greeks...', () => {
        const backup = new SavedSettings();
        const today = new Date();
        Settings.evaluationDate.set(today);
        const lengths = [1, 2];
        for (let i = 0; i < lengths.length; i++) {
            const exDate = DateExt.advance(today, lengths[i], TimeUnit.Years);
            const exercise = new AmericanExercise().init1(today, exDate);
            testFdGreeks(new FDDividendAmericanEngine(new CrankNicolson()), today, exercise);
        }
        backup.dispose();
    });
    it('Testing degenerate finite-differences dividend European option...', () => {
        const backup = new SavedSettings();
        const today = new Date('27-February-2005');
        Settings.evaluationDate.set(today);
        const exDate = new Date('13-April-2005');
        const exercise = new EuropeanExercise(exDate);
        testFdDegenerate(new FDDividendEuropeanEngine(new CrankNicolson()), today, exercise);
        backup.dispose();
    });
    it('Testing degenerate finite-differences dividend American option...', () => {
        const backup = new SavedSettings();
        const today = new Date('27-February-2005');
        Settings.evaluationDate.set(today);
        const exDate = new Date('13-April-2005');
        const exercise = new AmericanExercise().init1(today, exDate);
        testFdDegenerate(new FDDividendAmericanEngine(new CrankNicolson()), today, exercise);
        backup.dispose();
    });
});
//# sourceMappingURL=dividendoption.js.map