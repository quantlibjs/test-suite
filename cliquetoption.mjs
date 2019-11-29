/**
 * Copyright 2019 Jin Yang. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import { Actual360, AnalyticCliquetEngine, AnalyticPerformanceEngine, BlackScholesMertonProcess, CliquetOption, DateExt, EuropeanExercise, Frequency, Handle, MakeMCPerformanceEngine, Option, PercentageStrikePayoff, Period, PseudoRandom, SavedSettings, Settings, SimpleQuote, TimeUnit, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate1, flatRate3, flatVol1, flatVol3, relativeError } from '/test-suite/utilities.mjs';

const first = 0;

function testOptionGreeks(T) {
    const backup = new SavedSettings();
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
    const frequencies = [Frequency.Semiannual, Frequency.Quarterly];
    const vols = [0.11, 0.50, 1.20];
    const dc = new Actual360();
    const today = DateExt.UTC();
    Settings.evaluationDate.set(today);
    const spot = new SimpleQuote(0.0);
    const qRate = new SimpleQuote(0.0);
    const qTS = new Handle(flatRate3(qRate, dc));
    const rRate = new SimpleQuote(0.0);
    const rTS = new Handle(flatRate3(rRate, dc));
    const vol = new SimpleQuote(0.0);
    const volTS = new Handle(flatVol3(vol, dc));
    const process = new BlackScholesMertonProcess(new Handle(spot), qTS, rTS, volTS);
    for (let i = 0; i < types.length; i++) {
        for (let j = 0; j < moneyness.length; j++) {
            for (let k = 0; k < lengths.length; k++) {
                for (let kk = 0; kk < frequencies.length; kk++) {
                    const maturity = new EuropeanExercise(DateExt.advance(today, lengths[k], TimeUnit.Years));
                    const payoff = new PercentageStrikePayoff(types[i], moneyness[j]);
                    const reset = [];
                    for (let d = DateExt.advance(today, new Period().init2(frequencies[kk]).length(), new Period().init2(frequencies[kk]).units()); d.valueOf() < maturity.lastDate().valueOf(); d = DateExt.advance(d, new Period().init2(frequencies[kk]).length(), new Period().init2(frequencies[kk]).units())) {
                        reset.push(d);
                    }
                    const engine = T.init(process);
                    const option = new CliquetOption(payoff, maturity, reset);
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
    backup.dispose();
}

describe(`Cliquet option tests ${version}`, () => {
    it('Testing Cliquet option values...', () => {
        const today = DateExt.UTC();
        const dc = new Actual360();
        const spot = new SimpleQuote(60.0);
        const qRate = new SimpleQuote(0.04);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.08);
        const rTS = flatRate1(today, rRate, dc);
        const vol = new SimpleQuote(0.30);
        const volTS = flatVol1(today, vol, dc);
        const process = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
        const engine = new AnalyticCliquetEngine(process);
        const reset = [];
        reset.push(DateExt.add(today, 90));
        const maturity = DateExt.add(today, 360);
        const type = Option.Type.Call;
        const moneyness = 1.1;
        const payoff = new PercentageStrikePayoff(type, moneyness);
        const exercise = new EuropeanExercise(maturity);
        const option = new CliquetOption(payoff, exercise, reset);
        option.setPricingEngine(engine);
        const calculated = option.NPV();
        const expected = 4.4064;
        const error = Math.abs(calculated - expected);
        const tolerance = 1e-4;
        expect(error).toBeLessThan(tolerance);
    });

    it('Testing Cliquet option greeks...', () => {
        testOptionGreeks(new AnalyticCliquetEngine());
    });

    it('Testing performance option greeks...', () => {
        testOptionGreeks(new AnalyticPerformanceEngine());
    });

    it('Testing Monte Carlo performance engine against analytic results...', () => {
        const backup = new SavedSettings();
        const types = [Option.Type.Call, Option.Type.Put];
        const moneyness = [0.9, 1.1];
        const underlyings = [100.0];
        const qRates = [0.04, 0.06];
        const rRates = [0.01, 0.10];
        const lengths = [2, 4];
        const frequencies = [Frequency.Semiannual, Frequency.Quarterly];
        const vols = [0.10, 0.90];
        const dc = new Actual360();
        const today = DateExt.UTC();
        Settings.evaluationDate.set(today);
        const spot = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.0);
        const qTS = new Handle(flatRate3(qRate, dc));
        const rRate = new SimpleQuote(0.0);
        const rTS = new Handle(flatRate3(rRate, dc));
        const vol = new SimpleQuote(0.0);
        const volTS = new Handle(flatVol3(vol, dc));
        const process = new BlackScholesMertonProcess(new Handle(spot), qTS, rTS, volTS);
        for (let i = 0; i < types.length; i++) {
            for (let j = 0; j < moneyness.length; j++) {
                for (let k = 0; k < lengths.length; k++) {
                    for (let kk = 0; kk < frequencies.length; kk++) {
                        const tenor = new Period().init2(frequencies[kk]);
                        const maturity = new EuropeanExercise(DateExt.advance(today, lengths[k] * tenor.length(), tenor.units()));
                        const payoff = new PercentageStrikePayoff(types[i], moneyness[j]);
                        const reset = [];
                        for (let d = DateExt.addPeriod(today, tenor); d.valueOf() < maturity.lastDate().valueOf(); d = DateExt.addPeriod(d, tenor)) {
                            reset.push(d);
                        }
                        const option = new CliquetOption(payoff, maturity, reset);
                        const refEngine = new AnalyticPerformanceEngine(process);
                        const mcEngine = new MakeMCPerformanceEngine(new PseudoRandom())
                            .mmcpeInit(process)
                            .withBrownianBridge()
                            .withAbsoluteTolerance(5.0e-3)
                            .withSeed(42)
                            .f();
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
                                        option.setPricingEngine(refEngine);
                                        const refValue = option.NPV();
                                        option.setPricingEngine(mcEngine);
                                        const value = option.NPV();
                                        const error = Math.abs(refValue - value);
                                        const tolerance = 1.5e-2;
                                        expect(error).toBeLessThan(tolerance);
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
});
