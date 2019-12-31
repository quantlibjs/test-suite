/**
 * Copyright 2019 - 2020 Jin Yang. All Rights Reserved.
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
import { Actual360, AnalyticBarrierEngine, AnalyticDoubleBarrierEngine, AnalyticEuropeanEngine, Barrier, BarrierOptionEngine, BlackScholesMertonProcess, DateExt, DoubleBarrier, DoubleBarrierOptionEngine, EuropeanExercise, ForwardOptionArguments, ForwardPerformanceVanillaEngine, ForwardVanillaEngine, ForwardVanillaOption, Handle, Option, PlainVanillaPayoff, QuantoBarrierOption, QuantoDoubleBarrierOption, QuantoEngine, QuantoForwardVanillaOption, QuantoVanillaOption, SavedSettings, Settings, SimpleQuote, TimeUnit, VanillaOptionEngine, first, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate1, flatRate3, flatVol1, flatVol3, relativeError } from '/test-suite/utilities.mjs';

class QuantoOptionData {
    constructor(type, strike, s, q, r, t, v, fxr, fxv, corr, result, tol) {
        this.type = type;
        this.strike = strike;
        this.s = s;
        this.q = q;
        this.r = r;
        this.t = t;
        this.v = v;
        this.fxr = fxr;
        this.fxv = fxv;
        this.corr = corr;
        this.result = result;
        this.tol = tol;
    }
}

class QuantoForwardOptionData {
    constructor(type, moneyness, s, q, r, start, t, v, fxr, fxv, corr, result, tol) {
        this.type = type;
        this.moneyness = moneyness;
        this.s = s;
        this.q = q;
        this.r = r;
        this.start = start;
        this.t = t;
        this.v = v;
        this.fxr = fxr;
        this.fxv = fxv;
        this.corr = corr;
        this.result = result;
        this.tol = tol;
    }
}

class QuantoBarrierOptionData {
    constructor(barrierType, barrier, rebate, type, s, strike, q, r, t, v, fxr, fxv, corr, result, tol) {
        this.barrierType = barrierType;
        this.barrier = barrier;
        this.rebate = rebate;
        this.type = type;
        this.s = s;
        this.strike = strike;
        this.q = q;
        this.r = r;
        this.t = t;
        this.v = v;
        this.fxr = fxr;
        this.fxv = fxv;
        this.corr = corr;
        this.result = result;
        this.tol = tol;
    }
}

class QuantoDoubleBarrierOptionData {
    constructor(barrierType, barrier_lo, barrier_hi, rebate, type, s, strike, q, r, t, v, fxr, fxv, corr, result, tol) {
        this.barrierType = barrierType;
        this.barrier_lo = barrier_lo;
        this.barrier_hi = barrier_hi;
        this.rebate = rebate;
        this.type = type;
        this.s = s;
        this.strike = strike;
        this.q = q;
        this.r = r;
        this.t = t;
        this.v = v;
        this.fxr = fxr;
        this.fxv = fxv;
        this.corr = corr;
        this.result = result;
        this.tol = tol;
    }
}

describe(`Quanto option tests ${version}`, () => {
    it('Testing quanto option values...', () => {
        const backup = new SavedSettings();
        const values = [
            new QuantoOptionData(Option.Type.Call, 105.0, 100.0, 0.04, 0.08, 0.5, 0.2, 0.05, 0.10, 0.3, 5.3280 / 1.5, 1.0e-4),
            new QuantoOptionData(Option.Type.Put, 105.0, 100.0, 0.04, 0.08, 0.5, 0.2, 0.05, 0.10, 0.3, 8.1636, 1.0e-4)
        ];
        const dc = new Actual360();
        const today = DateExt.UTC();
        const spot = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.0);
        const qTS = new Handle(flatRate1(today, qRate, dc));
        const rRate = new SimpleQuote(0.0);
        const rTS = new Handle(flatRate1(today, rRate, dc));
        const vol = new SimpleQuote(0.0);
        const volTS = new Handle(flatVol1(today, vol, dc));
        const fxRate = new SimpleQuote(0.0);
        const fxrTS = new Handle(flatRate1(today, fxRate, dc));
        const fxVol = new SimpleQuote(0.0);
        const fxVolTS = new Handle(flatVol1(today, fxVol, dc));
        const correlation = new SimpleQuote(0.0);
        const stochProcess = new BlackScholesMertonProcess(new Handle(spot), qTS, rTS, volTS);
        const engine = new QuantoEngine(new VanillaOptionEngine.Arguments(), new VanillaOptionEngine.Results(), new AnalyticEuropeanEngine())
            .qeInit(stochProcess, fxrTS, fxVolTS, new Handle(correlation));
        for (let i = 0; i < values.length; i++) {
            const payoff = new PlainVanillaPayoff(values[i].type, values[i].strike);
            const exDate = DateExt.add(today, Math.floor(values[i].t * 360 + 0.5));
            const exercise = new EuropeanExercise(exDate);
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol.setValue(values[i].v);
            fxRate.setValue(values[i].fxr);
            fxVol.setValue(values[i].fxv);
            correlation.setValue(values[i].corr);
            const option = new QuantoVanillaOption(payoff, exercise);
            option.setPricingEngine(engine);
            const calculated = option.NPV();
            const error = Math.abs(calculated - values[i].result);
            const tolerance = 1e-4;
            expect(error).toBeLessThan(tolerance);
        }
        backup.dispose();
    });

    it('Testing quanto option greeks...', () => {
        const backup = new SavedSettings();
        const calculated = new Map(), expected = new Map(), tolerance = new Map();
        tolerance.set('delta', 1.0e-5);
        tolerance.set('gamma', 1.0e-5);
        tolerance.set('theta', 1.0e-5);
        tolerance.set('rho', 1.0e-5);
        tolerance.set('divRho', 1.0e-5);
        tolerance.set('vega', 1.0e-5);
        tolerance.set('qrho', 1.0e-5);
        tolerance.set('qvega', 1.0e-5);
        tolerance.set('qlambda', 1.0e-5);
        const types = [Option.Type.Call, Option.Type.Put];
        const strikes = [50.0, 99.5, 100.0, 100.5, 150.0];
        const underlyings = [100.0];
        const qRates = [0.04, 0.05];
        const rRates = [0.01, 0.05, 0.15];
        const lengths = [2];
        const vols = [0.11, 1.20];
        const correlations = [0.10, 0.90];
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
        const fxRate = new SimpleQuote(0.0);
        const fxrTS = new Handle(flatRate3(fxRate, dc));
        const fxVol = new SimpleQuote(0.0);
        const fxVolTS = new Handle(flatVol3(fxVol, dc));
        const correlation = new SimpleQuote(0.0);
        const stochProcess = new BlackScholesMertonProcess(new Handle(spot), qTS, rTS, volTS);
        const engine = new QuantoEngine(new VanillaOptionEngine.Arguments(), new VanillaOptionEngine.Results(), new AnalyticEuropeanEngine())
            .qeInit(stochProcess, fxrTS, fxVolTS, new Handle(correlation));
        for (let i = 0; i < types.length; i++) {
            for (let j = 0; j < strikes.length; j++) {
                for (let k = 0; k < lengths.length; k++) {
                    const exDate = DateExt.advance(today, lengths[k], TimeUnit.Years);
                    const exercise = new EuropeanExercise(exDate);
                    const payoff = new PlainVanillaPayoff(types[i], strikes[j]);
                    const option = new QuantoVanillaOption(payoff, exercise);
                    option.setPricingEngine(engine);
                    for (let l = 0; l < underlyings.length; l++) {
                        for (let m = 0; m < qRates.length; m++) {
                            for (let n = 0; n < rRates.length; n++) {
                                for (let p = 0; p < vols.length; p++) {
                                    for (let a = 0; a < rRates.length; a++) {
                                        for (let b = 0; b < vols.length; b++) {
                                            for (let c = 0; c < correlations.length; c++) {
                                                const u = underlyings[l];
                                                const q = qRates[m], r = rRates[n];
                                                const v = vols[p];
                                                const fxr = rRates[a];
                                                const fxv = vols[b];
                                                const corr = correlations[c];
                                                spot.setValue(u);
                                                qRate.setValue(q);
                                                rRate.setValue(r);
                                                vol.setValue(v);
                                                fxRate.setValue(fxr);
                                                fxVol.setValue(fxv);
                                                correlation.setValue(corr);
                                                const value = option.NPV();
                                                calculated.set('delta', option.delta());
                                                calculated.set('gamma', option.gamma());
                                                calculated.set('theta', option.theta());
                                                calculated.set('rho', option.rho());
                                                calculated.set('divRho', option.dividendRho());
                                                calculated.set('vega', option.vega());
                                                calculated.set('qrho', option.qrho());
                                                calculated.set('qvega', option.qvega());
                                                calculated.set('qlambda', option.qlambda());
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
                                                    const dfxr = fxr * 1.0e-4;
                                                    fxRate.setValue(fxr + dfxr);
                                                    value_p = option.NPV();
                                                    fxRate.setValue(fxr - dfxr);
                                                    value_m = option.NPV();
                                                    fxRate.setValue(fxr);
                                                    expected.set('qrho', (value_p - value_m) / (2 * dfxr));
                                                    const dfxv = fxv * 1.0e-4;
                                                    fxVol.setValue(fxv + dfxv);
                                                    value_p = option.NPV();
                                                    fxVol.setValue(fxv - dfxv);
                                                    value_m = option.NPV();
                                                    fxVol.setValue(fxv);
                                                    expected.set('qvega', (value_p - value_m) / (2 * dfxv));
                                                    const dcorr = corr * 1.0e-4;
                                                    correlation.setValue(corr + dcorr);
                                                    value_p = option.NPV();
                                                    correlation.setValue(corr - dcorr);
                                                    value_m = option.NPV();
                                                    correlation.setValue(corr);
                                                    expected.set('qlambda', (value_p - value_m) / (2 * dcorr));
                                                    const dT = dc.yearFraction(DateExt.sub(today, 1), DateExt.add(today, 1));
                                                    Settings.evaluationDate.set(DateExt.sub(today, 1));
                                                    value_m = option.NPV();
                                                    Settings.evaluationDate.set(DateExt.add(today, 1));
                                                    value_p = option.NPV();
                                                    Settings.evaluationDate.set(today);
                                                    expected.set('theta', (value_p - value_m) / dT);
                                                    let it;
                                                    const calculatedArray = Array.from(calculated);
                                                    for (it = 0; it !== calculatedArray.length; ++it) {
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
        }
        backup.dispose();
    });

    it('Testing quanto-forward option values...', () => {
        const backup = new SavedSettings();
        const values = [
            new QuantoForwardOptionData(Option.Type.Call, 1.05, 100.0, 0.04, 0.08, 0.00, 0.5, 0.20, 0.05, 0.10, 0.3, 5.3280 / 1.5, 1.0e-4),
            new QuantoForwardOptionData(Option.Type.Put, 1.05, 100.0, 0.04, 0.08, 0.00, 0.5, 0.20, 0.05, 0.10, 0.3, 8.1636, 1.0e-4),
            new QuantoForwardOptionData(Option.Type.Call, 1.05, 100.0, 0.04, 0.08, 0.25, 0.5, 0.20, 0.05, 0.10, 0.3, 2.0171, 1.0e-4),
            new QuantoForwardOptionData(Option.Type.Put, 1.05, 100.0, 0.04, 0.08, 0.25, 0.5, 0.20, 0.05, 0.10, 0.3, 6.7296, 1.0e-4)
        ];
        const dc = new Actual360();
        const today = DateExt.UTC();
        const spot = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.0);
        const qTS = new Handle(flatRate1(today, qRate, dc));
        const rRate = new SimpleQuote(0.0);
        const rTS = new Handle(flatRate1(today, rRate, dc));
        const vol = new SimpleQuote(0.0);
        const volTS = new Handle(flatVol1(today, vol, dc));
        const fxRate = new SimpleQuote(0.0);
        const fxrTS = new Handle(flatRate1(today, fxRate, dc));
        const fxVol = new SimpleQuote(0.0);
        const fxVolTS = new Handle(flatVol1(today, fxVol, dc));
        const correlation = new SimpleQuote(0.0);
        const stochProcess = new BlackScholesMertonProcess(new Handle(spot), qTS, rTS, volTS);
        const engine = new QuantoEngine(new ForwardOptionArguments(), new ForwardVanillaOption.Results(), new ForwardVanillaEngine(new AnalyticEuropeanEngine()))
            .qeInit(stochProcess, fxrTS, fxVolTS, new Handle(correlation));
        for (let i = 0; i < values.length; i++) {
            const payoff = new PlainVanillaPayoff(values[i].type, 0.0);
            const exDate = DateExt.add(today, Math.floor(values[i].t * 360 + 0.5));
            const exercise = new EuropeanExercise(exDate);
            const reset = DateExt.add(today, Math.floor(values[i].start * 360 + 0.5));
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol.setValue(values[i].v);
            fxRate.setValue(values[i].fxr);
            fxVol.setValue(values[i].fxv);
            correlation.setValue(values[i].corr);
            const option = new QuantoForwardVanillaOption(values[i].moneyness, reset, payoff, exercise);
            option.setPricingEngine(engine);
            const calculated = option.NPV();
            const error = Math.abs(calculated - values[i].result);
            const tolerance = 1e-4;
            expect(error).toBeLessThan(tolerance);
        }
        backup.dispose();
    });

    it('Testing quanto-forward option greeks...', () => {
        const backup = new SavedSettings();
        const calculated = new Map(), expected = new Map(), tolerance = new Map();
        tolerance.set('delta', 1.0e-5);
        tolerance.set('gamma', 1.0e-5);
        tolerance.set('theta', 1.0e-5);
        tolerance.set('rho', 1.0e-5);
        tolerance.set('divRho', 1.0e-5);
        tolerance.set('vega', 1.0e-5);
        tolerance.set('qrho', 1.0e-5);
        tolerance.set('qvega', 1.0e-5);
        tolerance.set('qlambda', 1.0e-5);
        const types = [Option.Type.Call, Option.Type.Put];
        const moneyness = [0.9, 1.0, 1.1];
        const underlyings = [100.0];
        const qRates = [0.04, 0.05];
        const rRates = [0.01, 0.05, 0.15];
        const lengths = [2];
        const startMonths = [6, 9];
        const vols = [0.11, 1.20];
        const correlations = [0.10, 0.90];
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
        const fxRate = new SimpleQuote(0.0);
        const fxrTS = new Handle(flatRate3(fxRate, dc));
        const fxVol = new SimpleQuote(0.0);
        const fxVolTS = new Handle(flatVol3(fxVol, dc));
        const correlation = new SimpleQuote(0.0);
        const stochProcess = new BlackScholesMertonProcess(new Handle(spot), qTS, rTS, volTS);
        const engine = new QuantoEngine(new ForwardOptionArguments(), new ForwardVanillaOption.Results(), new ForwardVanillaEngine(new AnalyticEuropeanEngine()))
            .qeInit(stochProcess, fxrTS, fxVolTS, new Handle(correlation));
        for (let i = 0; i < types.length; i++) {
            for (let j = 0; j < moneyness.length; j++) {
                for (let k = 0; k < lengths.length; k++) {
                    for (let h = 0; h < startMonths.length; h++) {
                        const exDate = DateExt.advance(today, lengths[k], TimeUnit.Years);
                        const exercise = new EuropeanExercise(exDate);
                        const reset = DateExt.advance(today, startMonths[h], TimeUnit.Months);
                        const payoff = new PlainVanillaPayoff(types[i], 0.0);
                        const option = new QuantoForwardVanillaOption(moneyness[j], reset, payoff, exercise);
                        option.setPricingEngine(engine);
                        for (let l = 0; l < underlyings.length; l++) {
                            for (let m = 0; m < qRates.length; m++) {
                                for (let n = 0; n < rRates.length; n++) {
                                    for (let p = 0; p < vols.length; p++) {
                                        for (let a = 0; a < rRates.length; a++) {
                                            for (let b = 0; b < vols.length; b++) {
                                                for (let c = 0; c < correlations.length; c++) {
                                                    const u = underlyings[l];
                                                    const q = qRates[m], r = rRates[n];
                                                    const v = vols[p];
                                                    const fxr = rRates[a];
                                                    const fxv = vols[b];
                                                    const corr = correlations[c];
                                                    spot.setValue(u);
                                                    qRate.setValue(q);
                                                    rRate.setValue(r);
                                                    vol.setValue(v);
                                                    fxRate.setValue(fxr);
                                                    fxVol.setValue(fxv);
                                                    correlation.setValue(corr);
                                                    const value = option.NPV();
                                                    calculated.set('delta', option.delta());
                                                    calculated.set('gamma', option.gamma());
                                                    calculated.set('theta', option.theta());
                                                    calculated.set('rho', option.rho());
                                                    calculated.set('divRho', option.dividendRho());
                                                    calculated.set('vega', option.vega());
                                                    calculated.set('qrho', option.qrho());
                                                    calculated.set('qvega', option.qvega());
                                                    calculated.set('qlambda', option.qlambda());
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
                                                        const dfxr = fxr * 1.0e-4;
                                                        fxRate.setValue(fxr + dfxr);
                                                        value_p = option.NPV();
                                                        fxRate.setValue(fxr - dfxr);
                                                        value_m = option.NPV();
                                                        fxRate.setValue(fxr);
                                                        expected.set('qrho', (value_p - value_m) / (2 * dfxr));
                                                        const dfxv = fxv * 1.0e-4;
                                                        fxVol.setValue(fxv + dfxv);
                                                        value_p = option.NPV();
                                                        fxVol.setValue(fxv - dfxv);
                                                        value_m = option.NPV();
                                                        fxVol.setValue(fxv);
                                                        expected.set('qvega', (value_p - value_m) / (2 * dfxv));
                                                        const dcorr = corr * 1.0e-4;
                                                        correlation.setValue(corr + dcorr);
                                                        value_p = option.NPV();
                                                        correlation.setValue(corr - dcorr);
                                                        value_m = option.NPV();
                                                        correlation.setValue(corr);
                                                        expected.set('qlambda', (value_p - value_m) / (2 * dcorr));
                                                        const dT = dc.yearFraction(DateExt.sub(today, 1), DateExt.add(today, 1));
                                                        Settings.evaluationDate.set(DateExt.sub(today, 1));
                                                        value_m = option.NPV();
                                                        Settings.evaluationDate.set(DateExt.add(today, 1));
                                                        value_p = option.NPV();
                                                        Settings.evaluationDate.set(today);
                                                        expected.set('theta', (value_p - value_m) / dT);
                                                        let it;
                                                        const calculatedArray = Array.from(calculated);
                                                        for (it = 0; it !== calculatedArray.length; ++it) {
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
            }
        }
        backup.dispose();
    });

    it('Testing quanto-forward-performance option values...', () => {
        const backup = new SavedSettings();
        const values = [
            new QuantoForwardOptionData(Option.Type.Call, 1.05, 100.0, 0.04, 0.08, 0.00, 0.5, 0.20, 0.05, 0.10, 0.3, 5.3280 / 150, 1.0e-4),
            new QuantoForwardOptionData(Option.Type.Put, 1.05, 100.0, 0.04, 0.08, 0.00, 0.5, 0.20, 0.05, 0.10, 0.3, 0.0816, 1.0e-4),
            new QuantoForwardOptionData(Option.Type.Call, 1.05, 100.0, 0.04, 0.08, 0.25, 0.5, 0.20, 0.05, 0.10, 0.3, 0.0201, 1.0e-4),
            new QuantoForwardOptionData(Option.Type.Put, 1.05, 100.0, 0.04, 0.08, 0.25, 0.5, 0.20, 0.05, 0.10, 0.3, 0.0672, 1.0e-4)
        ];
        const dc = new Actual360();
        const today = DateExt.UTC();
        const spot = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.0);
        const qTS = new Handle(flatRate1(today, qRate, dc));
        const rRate = new SimpleQuote(0.0);
        const rTS = new Handle(flatRate1(today, rRate, dc));
        const vol = new SimpleQuote(0.0);
        const volTS = new Handle(flatVol1(today, vol, dc));
        const fxRate = new SimpleQuote(0.0);
        const fxrTS = new Handle(flatRate1(today, fxRate, dc));
        const fxVol = new SimpleQuote(0.0);
        const fxVolTS = new Handle(flatVol1(today, fxVol, dc));
        const correlation = new SimpleQuote(0.0);
        const stochProcess = new BlackScholesMertonProcess(new Handle(spot), qTS, rTS, volTS);
        const engine = new QuantoEngine(new ForwardOptionArguments(), new ForwardVanillaOption.Results(), new ForwardPerformanceVanillaEngine(new AnalyticEuropeanEngine()))
            .qeInit(stochProcess, fxrTS, fxVolTS, new Handle(correlation));
        for (let i = 0; i < values.length; i++) {
            const payoff = new PlainVanillaPayoff(values[i].type, 0.0);
            const exDate = DateExt.add(today, Math.floor(values[i].t * 360 + 0.5));
            const exercise = new EuropeanExercise(exDate);
            const reset = DateExt.add(today, Math.floor(values[i].start * 360 + 0.5));
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol.setValue(values[i].v);
            fxRate.setValue(values[i].fxr);
            fxVol.setValue(values[i].fxv);
            correlation.setValue(values[i].corr);
            const option = new QuantoForwardVanillaOption(values[i].moneyness, reset, payoff, exercise);
            option.setPricingEngine(engine);
            const calculated = option.NPV();
            const error = Math.abs(calculated - values[i].result);
            const tolerance = 1e-4;
            expect(error).toBeLessThan(tolerance);
        }
        backup.dispose();
    });

    it('Testing quanto-barrier option values...', () => {
        const backup = new SavedSettings();
        const values = [
            new QuantoBarrierOptionData(Barrier.Type.DownOut, 95.0, 3.0, Option.Type.Call, 100, 90, 0.04, 0.0212, 0.50, 0.25, 0.05, 0.2, 0.3, 8.247, 0.5),
            new QuantoBarrierOptionData(Barrier.Type.DownOut, 95.0, 3.0, Option.Type.Put, 100, 90, 0.04, 0.0212, 0.50, 0.25, 0.05, 0.2, 0.3, 2.274, 0.5),
            new QuantoBarrierOptionData(Barrier.Type.DownIn, 95.0, 0, Option.Type.Put, 100, 90, 0.04, 0.0212, 0.50, 0.25, 0.05, 0.2, 0.3, 2.85, 0.5)
        ];
        const dc = new Actual360();
        const today = DateExt.UTC();
        const spot = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.0);
        const qTS = new Handle(flatRate1(today, qRate, dc));
        const rRate = new SimpleQuote(0.0);
        const rTS = new Handle(flatRate1(today, rRate, dc));
        const vol = new SimpleQuote(0.0);
        const volTS = new Handle(flatVol1(today, vol, dc));
        const fxRate = new SimpleQuote(0.0);
        const fxrTS = new Handle(flatRate1(today, fxRate, dc));
        const fxVol = new SimpleQuote(0.0);
        const fxVolTS = new Handle(flatVol1(today, fxVol, dc));
        const correlation = new SimpleQuote(0.0);
        const stochProcess = new BlackScholesMertonProcess(new Handle(spot), qTS, rTS, volTS);
        const engine = new QuantoEngine(new BarrierOptionEngine.Arguments(), new BarrierOptionEngine.Results(), new AnalyticBarrierEngine())
            .qeInit(stochProcess, fxrTS, fxVolTS, new Handle(correlation));
        for (let i = 0; i < values.length; i++) {
            const payoff = new PlainVanillaPayoff(values[i].type, values[i].strike);
            const exDate = DateExt.add(today, Math.floor(values[i].t * 360 + 0.5));
            const exercise = new EuropeanExercise(exDate);
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol.setValue(values[i].v);
            fxRate.setValue(values[i].fxr);
            fxVol.setValue(values[i].fxv);
            correlation.setValue(values[i].corr);
            const option = new QuantoBarrierOption(values[i].barrierType, values[i].barrier, values[i].rebate, payoff, exercise);
            option.setPricingEngine(engine);
            const calculated = option.NPV();
            const error = Math.abs(calculated - values[i].result);
            const tolerance = values[i].tol;
            expect(error).toBeLessThan(tolerance);
        }
        backup.dispose();
    });
});

describe(`Experimental quanto option tests ${version}`, () => {
    it('Testing quanto-double-barrier option values...', () => {
        const backup = new SavedSettings();
        const values = [
            new QuantoDoubleBarrierOptionData(DoubleBarrier.Type.KnockOut, 50.0, 150.0, 0, Option.Type.Call, 100, 100.0, 0.00, 0.1, 0.25, 0.15, 0.05, 0.2, 0.3, 3.4623, 1.0e-4),
            new QuantoDoubleBarrierOptionData(DoubleBarrier.Type.KnockOut, 90.0, 110.0, 0, Option.Type.Call, 100, 100.0, 0.00, 0.1, 0.50, 0.15, 0.05, 0.2, 0.3, 0.5236, 1.0e-4),
            new QuantoDoubleBarrierOptionData(DoubleBarrier.Type.KnockOut, 90.0, 110.0, 0, Option.Type.Put, 100, 100.0, 0.00, 0.1, 0.25, 0.15, 0.05, 0.2, 0.3, 1.1320, 1.0e-4),
            new QuantoDoubleBarrierOptionData(DoubleBarrier.Type.KnockIn, 80.0, 120.0, 0, Option.Type.Call, 100, 102.0, 0.00, 0.1, 0.25, 0.25, 0.05, 0.2, 0.3, 2.6313, 1.0e-4),
            new QuantoDoubleBarrierOptionData(DoubleBarrier.Type.KnockIn, 80.0, 120.0, 0, Option.Type.Call, 100, 102.0, 0.00, 0.1, 0.50, 0.15, 0.05, 0.2, 0.3, 1.9305, 1.0e-4)
        ];
        const dc = new Actual360();
        const today = DateExt.UTC();
        const spot = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.0);
        const qTS = new Handle(flatRate1(today, qRate, dc));
        const rRate = new SimpleQuote(0.0);
        const rTS = new Handle(flatRate1(today, rRate, dc));
        const vol = new SimpleQuote(0.0);
        const volTS = new Handle(flatVol1(today, vol, dc));
        const fxRate = new SimpleQuote(0.0);
        const fxrTS = new Handle(flatRate1(today, fxRate, dc));
        const fxVol = new SimpleQuote(0.0);
        const fxVolTS = new Handle(flatVol1(today, fxVol, dc));
        const correlation = new SimpleQuote(0.0);
        const stochProcess = new BlackScholesMertonProcess(new Handle(spot), qTS, rTS, volTS);
        const engine = new QuantoEngine(new DoubleBarrierOptionEngine.Arguments(), new DoubleBarrierOptionEngine.Results(), new AnalyticDoubleBarrierEngine())
            .qeInit(stochProcess, fxrTS, fxVolTS, new Handle(correlation));
        for (let i = 0; i < values.length; i++) {
            const payoff = new PlainVanillaPayoff(values[i].type, values[i].strike);
            const exDate = DateExt.add(today, Math.floor(values[i].t * 360 + 0.5));
            const exercise = new EuropeanExercise(exDate);
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol.setValue(values[i].v);
            fxRate.setValue(values[i].fxr);
            fxVol.setValue(values[i].fxv);
            correlation.setValue(values[i].corr);
            const option = new QuantoDoubleBarrierOption(values[i].barrierType, values[i].barrier_lo, values[i].barrier_hi, values[i].rebate, payoff, exercise);
            option.setPricingEngine(engine);
            const calculated = option.NPV();
            const error = Math.abs(calculated - values[i].result);
            const tolerance = values[i].tol;
            expect(error).toBeLessThan(tolerance);
        }
        backup.dispose();
    });
});
