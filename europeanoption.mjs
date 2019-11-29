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
import { Actual360, Actual365Fixed, AdditiveEQPBinomialTree, AnalyticEuropeanEngine, Array2D, AssetOrNothingPayoff, Bicubic, BinomialVanillaEngine, BlackScholesMertonProcess, BlackScholesProcess, BlackVarianceSurface, CashOrNothingPayoff, CoxRossRubinstein, CrankNicolson, DateExt, DividendVanillaOption, EuropeanExercise, EuropeanOption, FdBlackScholesVanillaEngine, FDEuropeanEngine, FdmSchemeDesc, FFTVanillaEngine, ForwardCurve, GapPayoff, Handle, IntegralEngine, JarrowRudd, Joshi4, LeisenReimer, LowDiscrepancy, MakeMCEuropeanEngine, Option, PlainVanillaPayoff, PseudoRandom, QL_NULL_INTEGER, SavedSettings, Settings, SimpleQuote, TARGET, Tian, TimeUnit, Trigeorgis, VanillaOption, ZeroCurve, first, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { Flag, flatRate1, flatRate2, flatRate3, flatVol1, flatVol2, flatVol3, relativeError } from '/test-suite/utilities.mjs';

class EuropeanOptionData {
    constructor(type, strike, s, q, r, t, v, result, tol) {
        this.type = type;
        this.strike = strike;
        this.s = s;
        this.q = q;
        this.r = r;
        this.t = t;
        this.v = v;
        this.result = result;
        this.tol = tol;
    }
}

// enum EngineType
var EngineType;
(function (EngineType) {
    EngineType[EngineType["Analytic"] = 0] = "Analytic";
    EngineType[EngineType["JR"] = 1] = "JR";
    EngineType[EngineType["CRR"] = 2] = "CRR";
    EngineType[EngineType["EQP"] = 3] = "EQP";
    EngineType[EngineType["TGEO"] = 4] = "TGEO";
    EngineType[EngineType["TIAN"] = 5] = "TIAN";
    EngineType[EngineType["LR"] = 6] = "LR";
    EngineType[EngineType["JOSHI"] = 7] = "JOSHI";
    EngineType[EngineType["FiniteDifferences"] = 8] = "FiniteDifferences";
    EngineType[EngineType["Integral"] = 9] = "Integral";
    EngineType[EngineType["PseudoMonteCarlo"] = 10] = "PseudoMonteCarlo";
    EngineType[EngineType["QuasiMonteCarlo"] = 11] = "QuasiMonteCarlo";
    EngineType[EngineType["FFT"] = 12] = "FFT";
})(EngineType || (EngineType = {}));

function makeProcess(u, q, r, vol) {
    return new BlackScholesMertonProcess(new Handle(u), new Handle(q), new Handle(r), new Handle(vol));
}

function makeOption(payoff, exercise, u, q, r, vol, engineType, binomialSteps, samples) {
    const stochProcess = makeProcess(u, q, r, vol);
    let engine;
    switch (engineType) {
        case EngineType.Analytic:
            engine = new AnalyticEuropeanEngine().init1(stochProcess);
            break;
        case EngineType.JR:
            engine = new BinomialVanillaEngine(new JarrowRudd())
                .bveInit(stochProcess, binomialSteps);
            break;
        case EngineType.CRR:
            engine = new BinomialVanillaEngine(new CoxRossRubinstein())
                .bveInit(stochProcess, binomialSteps);
            break;
        case EngineType.EQP:
            engine = new BinomialVanillaEngine(new AdditiveEQPBinomialTree())
                .bveInit(stochProcess, binomialSteps);
            break;
        case EngineType.TGEO:
            engine = new BinomialVanillaEngine(new Trigeorgis())
                .bveInit(stochProcess, binomialSteps);
            break;
        case EngineType.TIAN:
            engine = new BinomialVanillaEngine(new Tian())
                .bveInit(stochProcess, binomialSteps);
            break;
        case EngineType.LR:
            engine = new BinomialVanillaEngine(new LeisenReimer())
                .bveInit(stochProcess, binomialSteps);
            break;
        case EngineType.JOSHI:
            engine = new BinomialVanillaEngine(new Joshi4())
                .bveInit(stochProcess, binomialSteps);
            break;
        case EngineType.FiniteDifferences:
            engine = new FDEuropeanEngine(new CrankNicolson())
                .fdInit(stochProcess, binomialSteps, samples);
            break;
        case EngineType.Integral:
            engine = new IntegralEngine(stochProcess);
            break;
        case EngineType.PseudoMonteCarlo:
            engine = new MakeMCEuropeanEngine(new PseudoRandom())
                .mmceeInit(stochProcess)
                .withSteps(1)
                .withSamples(samples)
                .withSeed(42)
                .f();
            break;
        case EngineType.QuasiMonteCarlo:
            engine = new MakeMCEuropeanEngine(new LowDiscrepancy())
                .mmceeInit(stochProcess)
                .withSteps(1)
                .withSamples(samples)
                .f();
            break;
        case EngineType.FFT:
            engine = new FFTVanillaEngine(stochProcess);
            break;
        default:
            throw new Error('unknown engine type');
    }
    const option = new EuropeanOption(payoff, exercise);
    option.setPricingEngine(engine);
    return option;
}

function timeToDays(t) {
    return Math.floor(t * 360 + 0.5);
}

function testEngineConsistency(engine, binomialSteps, samples, tolerance, testGreeks = false) {
    const calculated = new Map(), expected = new Map();
    const types = [Option.Type.Call, Option.Type.Put];
    const strikes = [75.0, 100.0, 125.0];
    const lengths = [1];
    const underlyings = [100.0];
    const qRates = [0.00, 0.05];
    const rRates = [0.01, 0.05, 0.15];
    const vols = [0.11, 0.50, 1.20];
    const dc = new Actual360();
    const today = DateExt.UTC();
    const spot = new SimpleQuote(0.0);
    const vol = new SimpleQuote(0.0);
    const volTS = flatVol1(today, vol, dc);
    const qRate = new SimpleQuote(0.0);
    const qTS = flatRate1(today, qRate, dc);
    const rRate = new SimpleQuote(0.0);
    const rTS = flatRate1(today, rRate, dc);
    for (let i = 0; i < types.length; i++) {
        for (let j = 0; j < strikes.length; j++) {
            for (let k = 0; k < lengths.length; k++) {
                const exDate = DateExt.add(today, lengths[k] * 360);
                const exercise = new EuropeanExercise(exDate);
                const payoff = new PlainVanillaPayoff(types[i], strikes[j]);
                const refOption = makeOption(payoff, exercise, spot, qTS, rTS, volTS, EngineType.Analytic, QL_NULL_INTEGER, QL_NULL_INTEGER);
                const option = makeOption(payoff, exercise, spot, qTS, rTS, volTS, engine, binomialSteps, samples);
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
                                expected.clear();
                                calculated.clear();
                                expected.set('value', refOption.NPV());
                                calculated.set('value', option.NPV());
                                if (testGreeks && option.NPV() > spot.value() * 1.0e-5) {
                                    expected.set('delta', refOption.delta());
                                    expected.set('gamma', refOption.gamma());
                                    expected.set('theta', refOption.theta());
                                    calculated.set('delta', option.delta());
                                    calculated.set('gamma', option.gamma());
                                    calculated.set('theta', option.theta());
                                }
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

describe(`European option tests ${version}`, () => {
    it('Testing European option values...', () => {
        const backup = new SavedSettings();
        const values = [
            new EuropeanOptionData(Option.Type.Call, 65.00, 60.00, 0.00, 0.08, 0.25, 0.30, 2.1334, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 95.00, 100.00, 0.05, 0.10, 0.50, 0.20, 2.4648, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 19.00, 19.00, 0.10, 0.10, 0.75, 0.28, 1.7011, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 19.00, 19.00, 0.10, 0.10, 0.75, 0.28, 1.7011, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 1.60, 1.56, 0.08, 0.06, 0.50, 0.12, 0.0291, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 70.00, 75.00, 0.05, 0.10, 0.50, 0.35, 4.0870, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 90.00, 0.10, 0.10, 0.10, 0.15, 0.0205, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 100.00, 0.10, 0.10, 0.10, 0.15, 1.8734, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 110.00, 0.10, 0.10, 0.10, 0.15, 9.9413, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 90.00, 0.10, 0.10, 0.10, 0.25, 0.3150, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 100.00, 0.10, 0.10, 0.10, 0.25, 3.1217, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 110.00, 0.10, 0.10, 0.10, 0.25, 10.3556, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 90.00, 0.10, 0.10, 0.10, 0.35, 0.9474, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 100.00, 0.10, 0.10, 0.10, 0.35, 4.3693, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 110.00, 0.10, 0.10, 0.10, 0.35, 11.1381, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 90.00, 0.10, 0.10, 0.50, 0.15, 0.8069, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 100.00, 0.10, 0.10, 0.50, 0.15, 4.0232, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 110.00, 0.10, 0.10, 0.50, 0.15, 10.5769, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 90.00, 0.10, 0.10, 0.50, 0.25, 2.7026, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 100.00, 0.10, 0.10, 0.50, 0.25, 6.6997, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 110.00, 0.10, 0.10, 0.50, 0.25, 12.7857, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 90.00, 0.10, 0.10, 0.50, 0.35, 4.9329, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 100.00, 0.10, 0.10, 0.50, 0.35, 9.3679, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 110.00, 0.10, 0.10, 0.50, 0.35, 15.3086, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 90.00, 0.10, 0.10, 0.10, 0.15, 9.9210, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 100.00, 0.10, 0.10, 0.10, 0.15, 1.8734, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 110.00, 0.10, 0.10, 0.10, 0.15, 0.0408, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 90.00, 0.10, 0.10, 0.10, 0.25, 10.2155, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 100.00, 0.10, 0.10, 0.10, 0.25, 3.1217, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 110.00, 0.10, 0.10, 0.10, 0.25, 0.4551, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 90.00, 0.10, 0.10, 0.10, 0.35, 10.8479, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 100.00, 0.10, 0.10, 0.10, 0.35, 4.3693, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 110.00, 0.10, 0.10, 0.10, 0.35, 1.2376, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 90.00, 0.10, 0.10, 0.50, 0.15, 10.3192, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 100.00, 0.10, 0.10, 0.50, 0.15, 4.0232, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 110.00, 0.10, 0.10, 0.50, 0.15, 1.0646, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 90.00, 0.10, 0.10, 0.50, 0.25, 12.2149, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 100.00, 0.10, 0.10, 0.50, 0.25, 6.6997, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 110.00, 0.10, 0.10, 0.50, 0.25, 3.2734, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 90.00, 0.10, 0.10, 0.50, 0.35, 14.4452, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 100.00, 0.10, 0.10, 0.50, 0.35, 9.3679, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 110.00, 0.10, 0.10, 0.50, 0.35, 5.7963, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 40.00, 42.00, 0.08, 0.04, 0.75, 0.35, 5.0975, 1.0e-4),
        ];
        const dc = new Actual360();
        const today = DateExt.UTC();
        const spot = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.0);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.0);
        const rTS = flatRate1(today, rRate, dc);
        const vol = new SimpleQuote(0.0);
        const volTS = flatVol1(today, vol, dc);
        for (let i = 0; i < values.length; i++) {
            const payoff = new PlainVanillaPayoff(values[i].type, values[i].strike);
            const exDate = DateExt.add(today, timeToDays(values[i].t));
            const exercise = new EuropeanExercise(exDate);
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol.setValue(values[i].v);
            const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
            const engine = new AnalyticEuropeanEngine().init1(stochProcess);
            const option = new EuropeanOption(payoff, exercise);
            option.setPricingEngine(engine);
            const calculated = option.NPV();
            const error = Math.abs(calculated - values[i].result);
            const tolerance = values[i].tol;
            expect(error).toBeLessThan(tolerance);
        }
        backup.dispose();
    });

    it('Testing European option greek values...', () => {
        const backup = new SavedSettings();
        const values = [
            new EuropeanOptionData(Option.Type.Call, 100.00, 105.00, 0.10, 0.10, 0.500000, 0.36, 0.5946, 0),
            new EuropeanOptionData(Option.Type.Put, 100.00, 105.00, 0.10, 0.10, 0.500000, 0.36, -0.3566, 0),
            new EuropeanOptionData(Option.Type.Put, 100.00, 105.00, 0.10, 0.10, 0.500000, 0.36, -4.8775, 0),
            new EuropeanOptionData(Option.Type.Call, 60.00, 55.00, 0.00, 0.10, 0.750000, 0.30, 0.0278, 0),
            new EuropeanOptionData(Option.Type.Put, 60.00, 55.00, 0.00, 0.10, 0.750000, 0.30, 0.0278, 0),
            new EuropeanOptionData(Option.Type.Call, 60.00, 55.00, 0.00, 0.10, 0.750000, 0.30, 18.9358, 0),
            new EuropeanOptionData(Option.Type.Put, 60.00, 55.00, 0.00, 0.10, 0.750000, 0.30, 18.9358, 0),
            new EuropeanOptionData(Option.Type.Put, 405.00, 430.00, 0.05, 0.07, 1.0 / 12.0, 0.20, -31.1924, 0),
            new EuropeanOptionData(Option.Type.Put, 405.00, 430.00, 0.05, 0.07, 1.0 / 12.0, 0.20, -0.0855, 0),
            new EuropeanOptionData(Option.Type.Call, 75.00, 72.00, 0.00, 0.09, 1.000000, 0.19, 38.7325, 0),
            new EuropeanOptionData(Option.Type.Put, 490.00, 500.00, 0.05, 0.08, 0.250000, 0.15, 42.2254, 0)
        ];
        const dc = new Actual360();
        const today = DateExt.UTC();
        const spot = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.0);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.0);
        const rTS = flatRate1(today, rRate, dc);
        const vol = new SimpleQuote(0.0);
        const volTS = flatVol1(today, vol, dc);
        const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
        const engine = new AnalyticEuropeanEngine().init1(stochProcess);
        let payoff;
        let exDate;
        let exercise;
        let option;
        let calculated;
        let i = -1;
        i++;
        payoff = new PlainVanillaPayoff(values[i].type, values[i].strike);
        exDate = DateExt.add(today, timeToDays(values[i].t));
        exercise = new EuropeanExercise(exDate);
        spot.setValue(values[i].s);
        qRate.setValue(values[i].q);
        rRate.setValue(values[i].r);
        vol.setValue(values[i].v);
        option = new EuropeanOption(payoff, exercise);
        option.setPricingEngine(engine);
        calculated = option.delta();
        let error = Math.abs(calculated - values[i].result);
        const tolerance = 1e-4;
        expect(error).toBeLessThan(tolerance);
        i++;
        payoff = new PlainVanillaPayoff(values[i].type, values[i].strike);
        exDate = DateExt.add(today, timeToDays(values[i].t));
        exercise = new EuropeanExercise(exDate);
        spot.setValue(values[i].s);
        qRate.setValue(values[i].q);
        rRate.setValue(values[i].r);
        vol.setValue(values[i].v);
        option = new EuropeanOption(payoff, exercise);
        option.setPricingEngine(engine);
        calculated = option.delta();
        error = Math.abs(calculated - values[i].result);
        expect(error).toBeLessThan(tolerance);
        i++;
        payoff = new PlainVanillaPayoff(values[i].type, values[i].strike);
        exDate = DateExt.add(today, timeToDays(values[i].t));
        exercise = new EuropeanExercise(exDate);
        spot.setValue(values[i].s);
        qRate.setValue(values[i].q);
        rRate.setValue(values[i].r);
        vol.setValue(values[i].v);
        option = new EuropeanOption(payoff, exercise);
        option.setPricingEngine(engine);
        calculated = option.elasticity();
        error = Math.abs(calculated - values[i].result);
        expect(error).toBeLessThan(tolerance);
        i++;
        payoff = new PlainVanillaPayoff(values[i].type, values[i].strike);
        exDate = DateExt.add(today, timeToDays(values[i].t));
        exercise = new EuropeanExercise(exDate);
        spot.setValue(values[i].s);
        qRate.setValue(values[i].q);
        rRate.setValue(values[i].r);
        vol.setValue(values[i].v);
        option = new EuropeanOption(payoff, exercise);
        option.setPricingEngine(engine);
        calculated = option.gamma();
        error = Math.abs(calculated - values[i].result);
        expect(error).toBeLessThan(tolerance);
        i++;
        payoff = new PlainVanillaPayoff(values[i].type, values[i].strike);
        exDate = DateExt.add(today, timeToDays(values[i].t));
        exercise = new EuropeanExercise(exDate);
        spot.setValue(values[i].s);
        qRate.setValue(values[i].q);
        rRate.setValue(values[i].r);
        vol.setValue(values[i].v);
        option = new EuropeanOption(payoff, exercise);
        option.setPricingEngine(engine);
        calculated = option.gamma();
        error = Math.abs(calculated - values[i].result);
        expect(error).toBeLessThan(tolerance);
        i++;
        payoff = new PlainVanillaPayoff(values[i].type, values[i].strike);
        exDate = DateExt.add(today, timeToDays(values[i].t));
        exercise = new EuropeanExercise(exDate);
        spot.setValue(values[i].s);
        qRate.setValue(values[i].q);
        rRate.setValue(values[i].r);
        vol.setValue(values[i].v);
        option = new EuropeanOption(payoff, exercise);
        option.setPricingEngine(engine);
        calculated = option.vega();
        error = Math.abs(calculated - values[i].result);
        expect(error).toBeLessThan(tolerance);
        i++;
        payoff = new PlainVanillaPayoff(values[i].type, values[i].strike);
        exDate = DateExt.add(today, timeToDays(values[i].t));
        exercise = new EuropeanExercise(exDate);
        spot.setValue(values[i].s);
        qRate.setValue(values[i].q);
        rRate.setValue(values[i].r);
        vol.setValue(values[i].v);
        option = new EuropeanOption(payoff, exercise);
        option.setPricingEngine(engine);
        calculated = option.vega();
        error = Math.abs(calculated - values[i].result);
        expect(error).toBeLessThan(tolerance);
        i++;
        payoff = new PlainVanillaPayoff(values[i].type, values[i].strike);
        exDate = DateExt.add(today, timeToDays(values[i].t));
        exercise = new EuropeanExercise(exDate);
        spot.setValue(values[i].s);
        qRate.setValue(values[i].q);
        rRate.setValue(values[i].r);
        vol.setValue(values[i].v);
        option = new EuropeanOption(payoff, exercise);
        option.setPricingEngine(engine);
        calculated = option.theta();
        error = Math.abs(calculated - values[i].result);
        expect(error).toBeLessThan(tolerance);
        i++;
        payoff = new PlainVanillaPayoff(values[i].type, values[i].strike);
        exDate = DateExt.add(today, timeToDays(values[i].t));
        exercise = new EuropeanExercise(exDate);
        spot.setValue(values[i].s);
        qRate.setValue(values[i].q);
        rRate.setValue(values[i].r);
        vol.setValue(values[i].v);
        option = new EuropeanOption(payoff, exercise);
        option.setPricingEngine(engine);
        calculated = option.thetaPerDay();
        error = Math.abs(calculated - values[i].result);
        expect(error).toBeLessThan(tolerance);
        i++;
        payoff = new PlainVanillaPayoff(values[i].type, values[i].strike);
        exDate = DateExt.add(today, timeToDays(values[i].t));
        exercise = new EuropeanExercise(exDate);
        spot.setValue(values[i].s);
        qRate.setValue(values[i].q);
        rRate.setValue(values[i].r);
        vol.setValue(values[i].v);
        option = new EuropeanOption(payoff, exercise);
        option.setPricingEngine(engine);
        calculated = option.rho();
        error = Math.abs(calculated - values[i].result);
        expect(error).toBeLessThan(tolerance);
        i++;
        payoff = new PlainVanillaPayoff(values[i].type, values[i].strike);
        exDate = DateExt.add(today, timeToDays(values[i].t));
        exercise = new EuropeanExercise(exDate);
        spot.setValue(values[i].s);
        qRate.setValue(values[i].q);
        rRate.setValue(values[i].r);
        vol.setValue(values[i].v);
        option = new EuropeanOption(payoff, exercise);
        option.setPricingEngine(engine);
        calculated = option.dividendRho();
        error = Math.abs(calculated - values[i].result);
        expect(error).toBeLessThan(tolerance);
        backup.dispose();
    });

    it('Testing analytic European option greeks...', () => {
        const backup = new SavedSettings();
        const calculated = new Map(), expected = new Map(), tolerance = new Map();
        tolerance.set('delta', 1.0e-5);
        tolerance.set('gamma', 1.0e-5);
        tolerance.set('theta', 1.0e-5);
        tolerance.set('rho', 1.0e-5);
        tolerance.set('divRho', 1.0e-5);
        tolerance.set('vega', 1.0e-5);
        const types = [Option.Type.Call, Option.Type.Put];
        const strikes = [50.0, 99.5, 100.0, 100.5, 150.0];
        const underlyings = [100.0];
        const qRates = [0.04, 0.05, 0.06];
        const rRates = [0.01, 0.05, 0.15];
        const residualTimes = [1.0, 2.0];
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
        let payoff;
        for (let i = 0; i < types.length; i++) {
            for (let j = 0; j < strikes.length; j++) {
                for (let k = 0; k < residualTimes.length; k++) {
                    const exDate = DateExt.add(today, timeToDays(residualTimes[k]));
                    const exercise = new EuropeanExercise(exDate);
                    for (let kk = 0; kk < 4; kk++) {
                        if (kk === 0) {
                            payoff = new PlainVanillaPayoff(types[i], strikes[j]);
                        }
                        else if (kk === 1) {
                            payoff = new CashOrNothingPayoff(types[i], strikes[j], 100.0);
                        }
                        else if (kk === 2) {
                            payoff = new AssetOrNothingPayoff(types[i], strikes[j]);
                        }
                        else if (kk === 3) {
                            payoff = new GapPayoff(types[i], strikes[j], 100.0);
                        }
                        const stochProcess = new BlackScholesMertonProcess(new Handle(spot), qTS, rTS, volTS);
                        const engine = new AnalyticEuropeanEngine().init1(stochProcess);
                        const option = new EuropeanOption(payoff, exercise);
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
        backup.dispose();
    });

    it('Testing European option implied volatility...', () => {
        const backup = new SavedSettings();
        const maxEvaluations = 100;
        const tolerance = 1.0e-6;
        const types = [Option.Type.Call, Option.Type.Put];
        const strikes = [90.0, 99.5, 100.0, 100.5, 110.0];
        const lengths = [36, 180, 360, 1080];
        const underlyings = [90.0, 95.0, 99.9, 100.0, 100.1, 105.0, 110.0];
        const qRates = [0.01, 0.05, 0.10];
        const rRates = [0.01, 0.05, 0.10];
        const vols = [0.01, 0.20, 0.30, 0.70, 0.90];
        const dc = new Actual360();
        const today = DateExt.UTC();
        const spot = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.0);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.0);
        const rTS = flatRate1(today, rRate, dc);
        const vol = new SimpleQuote(0.0);
        const volTS = flatVol1(today, vol, dc);
        for (let i = 0; i < types.length; i++) {
            for (let j = 0; j < strikes.length; j++) {
                for (let k = 0; k < lengths.length; k++) {
                    const exDate = DateExt.add(today, lengths[k]);
                    const exercise = new EuropeanExercise(exDate);
                    const payoff = new PlainVanillaPayoff(types[i], strikes[i]);
                    const option = makeOption(payoff, exercise, spot, qTS, rTS, volTS, EngineType.Analytic, QL_NULL_INTEGER, QL_NULL_INTEGER);
                    const process = makeProcess(spot, qTS, rTS, volTS);
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
                                    let implVol = 0.0;
                                    if (value !== 0.0) {
                                        vol.setValue(v * 0.5);
                                        if (Math.abs(value - option.NPV()) <= 1.0e-12) {
                                            continue;
                                        }
                                        try {
                                            implVol = option.impliedVolatility(value, process, tolerance, maxEvaluations);
                                        }
                                        catch (e) {
                                        }
                                        if (Math.abs(implVol - v) > tolerance) {
                                            vol.setValue(implVol);
                                            const value2 = option.NPV();
                                            const error = relativeError(value, value2, u);
                                            expect(error).toBeLessThan(tolerance);
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

    it('Testing self-containment of implied volatility calculation...', () => {
        const backup = new SavedSettings();
        const maxEvaluations = 100;
        const tolerance = 1.0e-6;
        const dc = new Actual360();
        const today = DateExt.UTC();
        const spot = new SimpleQuote(100.0);
        const underlying = new Handle(spot);
        const qRate = new SimpleQuote(0.05);
        const qTS = new Handle(flatRate1(today, qRate, dc));
        const rRate = new SimpleQuote(0.03);
        const rTS = new Handle(flatRate1(today, rRate, dc));
        const vol = new SimpleQuote(0.20);
        const volTS = new Handle(flatVol1(today, vol, dc));
        const exerciseDate = DateExt.advance(today, 1, TimeUnit.Years);
        const exercise = new EuropeanExercise(exerciseDate);
        const payoff = new PlainVanillaPayoff(Option.Type.Call, 100.0);
        const process = new BlackScholesMertonProcess(underlying, qTS, rTS, volTS);
        const engine = new AnalyticEuropeanEngine().init1(process);
        const option1 = new EuropeanOption(payoff, exercise);
        option1.setPricingEngine(engine);
        const option2 = new EuropeanOption(payoff, exercise);
        option2.setPricingEngine(engine);
        const refValue = option2.NPV();
        const f = new Flag();
        f.registerWith(option2);
        option1.impliedVolatility(refValue * 1.5, process, tolerance, maxEvaluations);
        expect(f.isUp()).toBeFalsy();
        option2.recalculate();
        expect(Math.abs(option2.NPV() - refValue)).toBeLessThan(1.0e-8);
        vol.setValue(vol.value() * 1.5);
        expect(f.isUp()).toBeTruthy();
        expect(Math.abs(option2.NPV() - refValue)).toBeGreaterThan(1.0e-8);
        backup.dispose();
    });

    it('Testing JR binomial European engines against analytic results...', () => {
        const backup = new SavedSettings();
        const engine = EngineType.JR;
        const steps = 251;
        const samples = QL_NULL_INTEGER;
        const relativeTol = new Map();
        relativeTol.set('value', 0.002);
        relativeTol.set('delta', 1.0e-3);
        relativeTol.set('gamma', 1.0e-4);
        relativeTol.set('theta', 0.03);
        testEngineConsistency(engine, steps, samples, relativeTol, true);
        backup.dispose();
    });

    it('Testing CRR binomial European engines against analytic results...', () => {
        const backup = new SavedSettings();
        const engine = EngineType.CRR;
        const steps = 501;
        const samples = QL_NULL_INTEGER;
        const relativeTol = new Map();
        relativeTol.set('value', 0.02);
        relativeTol.set('delta', 1.0e-3);
        relativeTol.set('gamma', 1.0e-4);
        relativeTol.set('theta', 0.03);
        testEngineConsistency(engine, steps, samples, relativeTol, true);
        backup.dispose();
    });

    it('Testing EQP binomial European engines against analytic results...', () => {
        const backup = new SavedSettings();
        const engine = EngineType.EQP;
        const steps = 501;
        const samples = QL_NULL_INTEGER;
        const relativeTol = new Map();
        relativeTol.set('value', 0.02);
        relativeTol.set('delta', 1.0e-3);
        relativeTol.set('gamma', 1.0e-4);
        relativeTol.set('theta', 0.03);
        testEngineConsistency(engine, steps, samples, relativeTol, true);
        backup.dispose();
    });

    it('Testing TGEO binomial European engines against analytic results...', () => {
        const backup = new SavedSettings();
        const engine = EngineType.TGEO;
        const steps = 251;
        const samples = QL_NULL_INTEGER;
        const relativeTol = new Map();
        relativeTol.set('value', 0.002);
        relativeTol.set('delta', 1.0e-3);
        relativeTol.set('gamma', 1.0e-4);
        relativeTol.set('theta', 0.03);
        testEngineConsistency(engine, steps, samples, relativeTol, true);
        backup.dispose();
    });

    it('Testing TIAN binomial European engines against analytic results...', () => {
        const backup = new SavedSettings();
        const engine = EngineType.TIAN;
        const steps = 251;
        const samples = QL_NULL_INTEGER;
        const relativeTol = new Map();
        relativeTol.set('value', 0.002);
        relativeTol.set('delta', 1.0e-3);
        relativeTol.set('gamma', 1.0e-4);
        relativeTol.set('theta', 0.03);
        testEngineConsistency(engine, steps, samples, relativeTol, true);
        backup.dispose();
    });

    it('Testing LR binomial European engines against analytic results...', () => {
        const backup = new SavedSettings();
        const engine = EngineType.LR;
        const steps = 251;
        const samples = QL_NULL_INTEGER;
        const relativeTol = new Map();
        relativeTol.set('value', 1.0e-6);
        relativeTol.set('delta', 1.0e-3);
        relativeTol.set('gamma', 1.0e-4);
        relativeTol.set('theta', 0.03);
        testEngineConsistency(engine, steps, samples, relativeTol, true);
        backup.dispose();
    });

    it('Testing Joshi binomial European engines against analytic results...', () => {
        const backup = new SavedSettings();
        const engine = EngineType.JOSHI;
        const steps = 251;
        const samples = QL_NULL_INTEGER;
        const relativeTol = new Map();
        relativeTol.set('value', 1.0e-7);
        relativeTol.set('delta', 1.0e-3);
        relativeTol.set('gamma', 1.0e-4);
        relativeTol.set('theta', 0.03);
        testEngineConsistency(engine, steps, samples, relativeTol, true);
        backup.dispose();
    });

    it('Testing finite-difference European engines ' +
        'against analytic results...', () => {
        const backup = new SavedSettings();
        const engine = EngineType.FiniteDifferences;
        const timeSteps = 300;
        const gridPoints = 300;
        const relativeTol = new Map();
        relativeTol.set('value', 1.0e-4);
        relativeTol.set('delta', 1.0e-6);
        relativeTol.set('gamma', 1.0e-6);
        relativeTol.set('theta', 1.0e-4);
        testEngineConsistency(engine, timeSteps, gridPoints, relativeTol, true);
        backup.dispose();
    });

    it('Testing integral European engines against analytic results...', () => {
        const backup = new SavedSettings();
        const engine = EngineType.Integral;
        const timeSteps = 300;
        const gridPoints = 300;
        const relativeTol = new Map();
        relativeTol.set('value', 0.0001);
        testEngineConsistency(engine, timeSteps, gridPoints, relativeTol);
        backup.dispose();
    });

    it('Testing Monte Carlo European engines against analytic results...', () => {
        const backup = new SavedSettings();
        const engine = EngineType.PseudoMonteCarlo;
        const timeSteps = QL_NULL_INTEGER;
        const gridPoints = 40000;
        const relativeTol = new Map();
        relativeTol.set('value', 0.01);
        testEngineConsistency(engine, timeSteps, gridPoints, relativeTol);
        backup.dispose();
    });

    it('Testing Quasi Monte Carlo European engines against analytic results...', () => {
        const backup = new SavedSettings();
        const engine = EngineType.QuasiMonteCarlo;
        const timeSteps = QL_NULL_INTEGER;
        const gridPoints = 4095;
        const relativeTol = new Map();
        relativeTol.set('value', 0.01);
        testEngineConsistency(engine, timeSteps, gridPoints, relativeTol);
        backup.dispose();
    });

    it('Testing European price curves...', () => {
        const backup = new SavedSettings();
        const values = [
            new EuropeanOptionData(Option.Type.Call, 65.00, 60.00, 0.00, 0.08, 0.25, 0.30, 2.1334, 0.0),
            new EuropeanOptionData(Option.Type.Put, 95.00, 100.00, 0.05, 0.10, 0.50, 0.20, 2.4648, 0.0)
        ];
        const dc = new Actual360();
        const today = DateExt.UTC();
        const timeSteps = 300;
        const gridPoints = 300;
        const spot = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.0);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.0);
        const rTS = flatRate1(today, rRate, dc);
        const vol = new SimpleQuote(0.0);
        const volTS = flatVol1(today, vol, dc);
        const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
        const engine = new FDEuropeanEngine(new CrankNicolson())
            .fdInit(stochProcess, timeSteps, gridPoints);
        for (let i = 0; i < values.length; i++) {
            const payoff = new PlainVanillaPayoff(values[i].type, values[i].strike);
            const exDate = DateExt.add(today, timeToDays(values[i].t));
            const exercise = new EuropeanExercise(exDate);
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol.setValue(values[i].v);
            const option = new EuropeanOption(payoff, exercise);
            option.setPricingEngine(engine);
            const price_curve = option.result('priceCurve');
            expect(price_curve.empty()).toBeFalsy();
            const start = price_curve.size() / 4;
            const end = price_curve.size() * 3 / 4;
            for (let i = start; i < end; i++) {
                spot.setValue(price_curve.gridValue(i));
                const engine1 = new FDEuropeanEngine(new CrankNicolson())
                    .fdInit(stochProcess, timeSteps, gridPoints);
                option.setPricingEngine(engine1);
                const calculated = option.NPV();
                const error = Math.abs(calculated - price_curve.value(i));
                const tolerance = 1e-3;
                expect(error).toBeLessThan(tolerance);
            }
        }
        backup.dispose();
    });

    it('Testing finite-differences with local volatility...', () => {
        const backup = new SavedSettings();
        const settlementDate = DateExt.UTC('5,July,2002');
        Settings.evaluationDate.set(settlementDate);
        const dayCounter = new Actual365Fixed();
        const calendar = new TARGET();
        const t = [13, 41, 75, 165, 256, 345, 524, 703];
        const r = [0.0357, 0.0349, 0.0341, 0.0355, 0.0359, 0.0368, 0.0386, 0.0401];
        const rates = [0.0357];
        const dates = [settlementDate];
        for (let i = 0; i < 8; ++i) {
            dates.push(DateExt.add(settlementDate, t[i]));
            rates.push(r[i]);
        }
        const rTS = new ZeroCurve().curveInit1(dates, rates, dayCounter);
        const qTS = flatRate2(settlementDate, 0.0, dayCounter);
        const s0 = new SimpleQuote(4500.00);
        const tmp = [
            100, 500, 2000, 3400, 3600, 3800, 4000, 4200, 4400, 4500,
            4600, 4800, 5000, 5200, 5400, 5600, 7500, 10000, 20000, 30000
        ];
        const strikes = Array.from(tmp);
        const v = [
            1.015873, 1.015873, 1.015873, 0.89729, 0.796493, 0.730914, 0.631335,
            0.568895, 0.711309, 0.711309, 0.711309, 0.641309, 0.635593, 0.583653,
            0.508045, 0.463182, 0.516034, 0.500534, 0.500534, 0.500534, 0.448706,
            0.416661, 0.375470, 0.353442, 0.516034, 0.482263, 0.447713, 0.387703,
            0.355064, 0.337438, 0.316966, 0.306859, 0.497587, 0.464373, 0.430764,
            0.374052, 0.344336, 0.328607, 0.310619, 0.301865, 0.479511, 0.446815,
            0.414194, 0.361010, 0.334204, 0.320301, 0.304664, 0.297180, 0.461866,
            0.429645, 0.398092, 0.348638, 0.324680, 0.312512, 0.299082, 0.292785,
            0.444801, 0.413014, 0.382634, 0.337026, 0.315788, 0.305239, 0.293855,
            0.288660, 0.428604, 0.397219, 0.368109, 0.326282, 0.307555, 0.298483,
            0.288972, 0.284791, 0.420971, 0.389782, 0.361317, 0.321274, 0.303697,
            0.295302, 0.286655, 0.282948, 0.413749, 0.382754, 0.354917, 0.316532,
            0.300016, 0.292251, 0.284420, 0.281164, 0.400889, 0.370272, 0.343525,
            0.307904, 0.293204, 0.286549, 0.280189, 0.277767, 0.390685, 0.360399,
            0.334344, 0.300507, 0.287149, 0.281380, 0.276271, 0.274588, 0.383477,
            0.353434, 0.327580, 0.294408, 0.281867, 0.276746, 0.272655, 0.271617,
            0.379106, 0.349214, 0.323160, 0.289618, 0.277362, 0.272641, 0.269332,
            0.268846, 0.377073, 0.347258, 0.320776, 0.286077, 0.273617, 0.269057,
            0.266293, 0.266265, 0.399925, 0.369232, 0.338895, 0.289042, 0.265509,
            0.255589, 0.249308, 0.249665, 0.423432, 0.406891, 0.373720, 0.314667,
            0.281009, 0.263281, 0.246451, 0.242166, 0.453704, 0.453704, 0.453704,
            0.381255, 0.334578, 0.305527, 0.268909, 0.251367, 0.517748, 0.517748,
            0.517748, 0.416577, 0.364770, 0.331595, 0.287423, 0.264285
        ];
        const blackVolMatrix = Array2D.newMatrix(strikes.length, dates.length - 1);
        for (let i = 0; i < strikes.length; ++i) {
            for (let j = 1; j < dates.length; ++j) {
                blackVolMatrix[i][j - 1] = v[i * (dates.length - 1) + j - 1];
            }
        }
        const volTS = new BlackVarianceSurface(settlementDate, calendar, dates.slice(1, dates.length), strikes, blackVolMatrix, dayCounter);
        volTS.setInterpolation(new Bicubic());
        const process = makeProcess(s0, qTS, rTS, volTS);
        for (let i = 2; i < dates.length; ++i) {
            for (let j = 3; j < strikes.length - 5; j += 5) {
                const exDate = dates[i];
                const payoff = new PlainVanillaPayoff(Option.Type.Call, strikes[j]);
                const exercise = new EuropeanExercise(exDate);
                const option = new EuropeanOption(payoff, exercise);
                option.setPricingEngine(new AnalyticEuropeanEngine().init1(process));
                const tol = 0.001;
                const expectedNPV = option.NPV();
                const expectedDelta = option.delta();
                const expectedGamma = option.gamma();
                option.setPricingEngine(new FdBlackScholesVanillaEngine(process, 200, 400));
                let calculatedNPV = option.NPV();
                const calculatedDelta = option.delta();
                const calculatedGamma = option.gamma();
                expect(Math.abs(expectedNPV - calculatedNPV))
                    .toBeLessThan(tol * expectedNPV);
                expect(Math.abs(expectedDelta - calculatedDelta))
                    .toBeLessThan(tol * expectedDelta);
                expect(Math.abs(expectedGamma - calculatedGamma))
                    .toBeLessThan(tol * expectedGamma);
                option.setPricingEngine(new FdBlackScholesVanillaEngine(process, 25, 400, 0, FdmSchemeDesc.Douglas(), true, 0.35));
                calculatedNPV = option.NPV();
                expect(Math.abs(expectedNPV - calculatedNPV))
                    .toBeLessThan(tol * expectedNPV);
            }
        }
        backup.dispose();
    });

    it('Testing separate discount curve for analytic European engine...', () => {
        const backup = new SavedSettings();
        const dc = new Actual360();
        const today = DateExt.UTC();
        const spot = new SimpleQuote(1000.0);
        const qRate = new SimpleQuote(0.01);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.015);
        const rTS = flatRate1(today, rRate, dc);
        const vol = new SimpleQuote(0.02);
        const volTS = flatVol1(today, vol, dc);
        const discRate = new SimpleQuote(0.015);
        const discTS = flatRate1(today, discRate, dc);
        const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
        const engineSingleCurve = new AnalyticEuropeanEngine().init1(stochProcess);
        const engineMultiCurve = new AnalyticEuropeanEngine().init2(stochProcess, new Handle(discTS));
        const payoff = new PlainVanillaPayoff(Option.Type.Call, 1025.0);
        const exDate = DateExt.advance(today, 1, TimeUnit.Years);
        const exercise = new EuropeanExercise(exDate);
        const option = new EuropeanOption(payoff, exercise);
        let npvSingleCurve, npvMultiCurve;
        option.setPricingEngine(engineSingleCurve);
        npvSingleCurve = option.NPV();
        option.setPricingEngine(engineMultiCurve);
        npvMultiCurve = option.NPV();
        expect(npvSingleCurve).toEqual(npvMultiCurve);
        discRate.setValue(0.023);
        npvMultiCurve = option.NPV();
        expect(npvSingleCurve).not.toEqual(npvMultiCurve);
        backup.dispose();
    });

    it('Testing different PDE schemes to solve Black-Scholes PDEs...', () => {
        const backup = new SavedSettings();
        const dc = new Actual365Fixed();
        const today = DateExt.UTC('18,February,2018');
        Settings.evaluationDate.set(today);
        const spot = new Handle(new SimpleQuote(100.0));
        const qTS = new Handle(flatRate2(today, 0.06, dc));
        const rTS = new Handle(flatRate2(today, 0.10, dc));
        const volTS = new Handle(flatVol2(today, 0.35, dc));
        const maturity = DateExt.advance(today, 6, TimeUnit.Months);
        const process = new BlackScholesMertonProcess(spot, qTS, rTS, volTS);
        const analytic = new AnalyticEuropeanEngine().init1(process);
        const crankNicolson = new FdBlackScholesVanillaEngine(process, 15, 100, 0, FdmSchemeDesc.Douglas());
        const implicitEuler = new FdBlackScholesVanillaEngine(process, 500, 100, 0, FdmSchemeDesc.ImplicitEuler());
        const explicitEuler = new FdBlackScholesVanillaEngine(process, 1000, 100, 0, FdmSchemeDesc.ExplicitEuler());
        const methodOfLines = new FdBlackScholesVanillaEngine(process, 1, 100, 0, FdmSchemeDesc.MethodOfLines());
        const hundsdorfer = new FdBlackScholesVanillaEngine(process, 10, 100, 0, FdmSchemeDesc.Hundsdorfer());
        const craigSneyd = new FdBlackScholesVanillaEngine(process, 10, 100, 0, FdmSchemeDesc.CraigSneyd());
        const modCraigSneyd = new FdBlackScholesVanillaEngine(process, 15, 100, 0, FdmSchemeDesc.ModifiedCraigSneyd());
        const trBDF2 = new FdBlackScholesVanillaEngine(process, 15, 100, 0, FdmSchemeDesc.TrBDF2());
        const engines = [
            [crankNicolson, 'Crank-Nicolson'], [implicitEuler, 'Implicit-Euler'],
            [explicitEuler, 'Explicit-Euler'], [methodOfLines, 'Method-of-Lines'],
            [hundsdorfer, 'Hundsdorfer'], [craigSneyd, 'Craig-Sneyd'],
            [modCraigSneyd, 'Modified Craig-Sneyd'], [trBDF2, 'TR-BDF2']
        ];
        const nEngines = engines.length;
        const payoff = new PlainVanillaPayoff(Option.Type.Put, spot.currentLink().value());
        const exercise = new EuropeanExercise(maturity);
        const option = new VanillaOption(payoff, exercise);
        option.setPricingEngine(analytic);
        const expected = option.NPV();
        const tol = 0.006;
        for (let i = 0; i < nEngines; ++i) {
            option.setPricingEngine(engines[i][first]);
            const calculated = option.NPV();
            const diff = Math.abs(expected - calculated);
            expect(diff).toBeLessThan(tol);
        }
        const dividendOption = new DividendVanillaOption(payoff, exercise, [DateExt.advance(today, 3, TimeUnit.Months)], [5.0]);
        const dividendPrices = new Array(nEngines);
        for (let i = 0; i < nEngines; ++i) {
            dividendOption.setPricingEngine(engines[i][first]);
            dividendPrices[i] = dividendOption.NPV();
        }
        const expectedDiv = dividendPrices.reduce((p, c) => p + c, 0.0) / nEngines;
        for (let i = 0; i < nEngines; ++i) {
            const calculated = dividendPrices[i];
            const diff = Math.abs(expectedDiv - calculated);
            expect(diff).toBeLessThan(tol);
        }
        backup.dispose();
    });

    it('Testing finite-difference European engine ' +
        'with non-constant parameters...', () => {
        const backup = new SavedSettings();
        const u = 190.0;
        const v = 0.20;
        const dc = new Actual360();
        const today = Settings.evaluationDate.f();
        const spot = new SimpleQuote(u);
        const volTS = flatVol2(today, v, dc);
        const dates = new Array(5);
        const rates = new Array(5);
        dates[0] = today;
        rates[0] = 0.0;
        dates[1] = DateExt.add(today, 90);
        rates[1] = 0.001;
        dates[2] = DateExt.add(today, 180);
        rates[2] = 0.002;
        dates[3] = DateExt.add(today, 270);
        rates[3] = 0.005;
        dates[4] = DateExt.add(today, 360);
        rates[4] = 0.01;
        const rTS = new ForwardCurve().curveInit1(dates, rates, dc);
        const process = new BlackScholesProcess(new Handle(spot), new Handle(rTS), new Handle(volTS));
        const exercise = new EuropeanExercise(DateExt.add(today, 360));
        const payoff = new PlainVanillaPayoff(Option.Type.Call, 190.0);
        const option = new EuropeanOption(payoff, exercise);
        option.setPricingEngine(new AnalyticEuropeanEngine().init1(process));
        const expected = option.NPV();
        const timeSteps = 200;
        const gridPoints = 201;
        const timeDependent = false;
        option.setPricingEngine(new FDEuropeanEngine(new CrankNicolson())
            .fdInit(process, timeSteps, gridPoints, timeDependent));
        const calculated = option.NPV();
        const tolerance = 0.01;
        const error = Math.abs(expected - calculated);
        expect(error).toBeLessThan(tolerance);
        backup.dispose();
    });
});

describe(`European option experimental tests ${version}`, () => {
    it('Testing FFT European engines against analytic results...', () => {
        const backup = new SavedSettings();
        const engine = EngineType.FFT;
        const steps = QL_NULL_INTEGER;
        const samples = QL_NULL_INTEGER;
        const relativeTol = new Map();
        relativeTol.set('value', 0.01);
        testEngineConsistency(engine, steps, samples, relativeTol);
        backup.dispose();
    });
});
