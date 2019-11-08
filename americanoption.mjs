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
import '/test-suite/quantlibtestsuite.mjs';
import { Actual360, AmericanExercise, BaroneAdesiWhaleyApproximationEngine, BjerksundStenslandApproximationEngine, BlackScholesMertonProcess, CrankNicolson, DateExt, FDAmericanEngine, FDShoutEngine, Handle, JuQuadraticApproximationEngine, Option, PlainVanillaPayoff, SavedSettings, Settings, SimpleQuote, TimeUnit, VanillaOption, first, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate1, flatVol1, relativeError } from '/test-suite/utilities.mjs';

class AmericanOptionData {
    constructor(type, strike, s, q, r, t, v, result) {
        this.type = type;
        this.strike = strike;
        this.s = s;
        this.q = q;
        this.r = r;
        this.t = t;
        this.v = v;
        this.result = result;
    }
}
const juValues = [
    new AmericanOptionData(Option.Type.Put, 35.00, 40.00, 0.0, 0.0488, 0.0833, 0.2, 0.006),
    new AmericanOptionData(Option.Type.Put, 35.00, 40.00, 0.0, 0.0488, 0.3333, 0.2, 0.201),
    new AmericanOptionData(Option.Type.Put, 35.00, 40.00, 0.0, 0.0488, 0.5833, 0.2, 0.433),
    new AmericanOptionData(Option.Type.Put, 40.00, 40.00, 0.0, 0.0488, 0.0833, 0.2, 0.851),
    new AmericanOptionData(Option.Type.Put, 40.00, 40.00, 0.0, 0.0488, 0.3333, 0.2, 1.576),
    new AmericanOptionData(Option.Type.Put, 40.00, 40.00, 0.0, 0.0488, 0.5833, 0.2, 1.984),
    new AmericanOptionData(Option.Type.Put, 45.00, 40.00, 0.0, 0.0488, 0.0833, 0.2, 5.000),
    new AmericanOptionData(Option.Type.Put, 45.00, 40.00, 0.0, 0.0488, 0.3333, 0.2, 5.084),
    new AmericanOptionData(Option.Type.Put, 45.00, 40.00, 0.0, 0.0488, 0.5833, 0.2, 5.260),
    new AmericanOptionData(Option.Type.Put, 35.00, 40.00, 0.0, 0.0488, 0.0833, 0.3, 0.078),
    new AmericanOptionData(Option.Type.Put, 35.00, 40.00, 0.0, 0.0488, 0.3333, 0.3, 0.697),
    new AmericanOptionData(Option.Type.Put, 35.00, 40.00, 0.0, 0.0488, 0.5833, 0.3, 1.218),
    new AmericanOptionData(Option.Type.Put, 40.00, 40.00, 0.0, 0.0488, 0.0833, 0.3, 1.309),
    new AmericanOptionData(Option.Type.Put, 40.00, 40.00, 0.0, 0.0488, 0.3333, 0.3, 2.477),
    new AmericanOptionData(Option.Type.Put, 40.00, 40.00, 0.0, 0.0488, 0.5833, 0.3, 3.161),
    new AmericanOptionData(Option.Type.Put, 45.00, 40.00, 0.0, 0.0488, 0.0833, 0.3, 5.059),
    new AmericanOptionData(Option.Type.Put, 45.00, 40.00, 0.0, 0.0488, 0.3333, 0.3, 5.699),
    new AmericanOptionData(Option.Type.Put, 45.00, 40.00, 0.0, 0.0488, 0.5833, 0.3, 6.231),
    new AmericanOptionData(Option.Type.Put, 35.00, 40.00, 0.0, 0.0488, 0.0833, 0.4, 0.247),
    new AmericanOptionData(Option.Type.Put, 35.00, 40.00, 0.0, 0.0488, 0.3333, 0.4, 1.344),
    new AmericanOptionData(Option.Type.Put, 35.00, 40.00, 0.0, 0.0488, 0.5833, 0.4, 2.150),
    new AmericanOptionData(Option.Type.Put, 40.00, 40.00, 0.0, 0.0488, 0.0833, 0.4, 1.767),
    new AmericanOptionData(Option.Type.Put, 40.00, 40.00, 0.0, 0.0488, 0.3333, 0.4, 3.381),
    new AmericanOptionData(Option.Type.Put, 40.00, 40.00, 0.0, 0.0488, 0.5833, 0.4, 4.342),
    new AmericanOptionData(Option.Type.Put, 45.00, 40.00, 0.0, 0.0488, 0.0833, 0.4, 5.288),
    new AmericanOptionData(Option.Type.Put, 45.00, 40.00, 0.0, 0.0488, 0.3333, 0.4, 6.501),
    new AmericanOptionData(Option.Type.Put, 45.00, 40.00, 0.0, 0.0488, 0.5833, 0.4, 7.367),
    new AmericanOptionData(Option.Type.Call, 100.00, 80.00, 0.07, 0.03, 3.0, 0.2, 2.605),
    new AmericanOptionData(Option.Type.Call, 100.00, 90.00, 0.07, 0.03, 3.0, 0.2, 5.182),
    new AmericanOptionData(Option.Type.Call, 100.00, 100.00, 0.07, 0.03, 3.0, 0.2, 9.065),
    new AmericanOptionData(Option.Type.Call, 100.00, 110.00, 0.07, 0.03, 3.0, 0.2, 14.430),
    new AmericanOptionData(Option.Type.Call, 100.00, 120.00, 0.07, 0.03, 3.0, 0.2, 21.398),
    new AmericanOptionData(Option.Type.Call, 100.00, 80.00, 0.07, 0.03, 3.0, 0.4, 11.336),
    new AmericanOptionData(Option.Type.Call, 100.00, 90.00, 0.07, 0.03, 3.0, 0.4, 15.711),
    new AmericanOptionData(Option.Type.Call, 100.00, 100.00, 0.07, 0.03, 3.0, 0.4, 20.760),
    new AmericanOptionData(Option.Type.Call, 100.00, 110.00, 0.07, 0.03, 3.0, 0.4, 26.440),
    new AmericanOptionData(Option.Type.Call, 100.00, 120.00, 0.07, 0.03, 3.0, 0.4, 32.709),
    new AmericanOptionData(Option.Type.Call, 100.00, 80.00, 0.07, 0.00001, 3.0, 0.3, 5.552),
    new AmericanOptionData(Option.Type.Call, 100.00, 90.00, 0.07, 0.00001, 3.0, 0.3, 8.868),
    new AmericanOptionData(Option.Type.Call, 100.00, 100.00, 0.07, 0.00001, 3.0, 0.3, 13.158),
    new AmericanOptionData(Option.Type.Call, 100.00, 110.00, 0.07, 0.00001, 3.0, 0.3, 18.458),
    new AmericanOptionData(Option.Type.Call, 100.00, 120.00, 0.07, 0.00001, 3.0, 0.3, 24.786),
    new AmericanOptionData(Option.Type.Call, 100.00, 80.00, 0.03, 0.07, 3.0, 0.3, 12.177),
    new AmericanOptionData(Option.Type.Call, 100.00, 90.00, 0.03, 0.07, 3.0, 0.3, 17.411),
    new AmericanOptionData(Option.Type.Call, 100.00, 100.00, 0.03, 0.07, 3.0, 0.3, 23.402),
    new AmericanOptionData(Option.Type.Call, 100.00, 110.00, 0.03, 0.07, 3.0, 0.3, 30.028),
    new AmericanOptionData(Option.Type.Call, 100.00, 120.00, 0.03, 0.07, 3.0, 0.3, 37.177),
];

function testFdGreeks(Engine) {
    const backup = new SavedSettings();
    const calculated = new Map(), expected = new Map(), tolerance = new Map();
    tolerance.set('delta', 7.0e-4);
    tolerance.set('gamma', 2.0e-4);
    const types = [Option.Type.Call, Option.Type.Put];
    const strikes = [50.0, 99.5, 100.0, 100.5, 150.0];
    const underlyings = [100.0];
    const qRates = [0.04, 0.05, 0.06];
    const rRates = [0.01, 0.05, 0.15];
    const years = [1, 2];
    const vols = [0.11, 0.50, 1.20];
    const dc = new Actual360();
    const today = DateExt.UTC();
    Settings.evaluationDate.set(today);
    const spot = new SimpleQuote(0.0);
    const qRate = new SimpleQuote(0.0);
    const qTS = new Handle(flatRate1(today, qRate, dc));
    const rRate = new SimpleQuote(0.0);
    const rTS = new Handle(flatRate1(today, rRate, dc));
    const vol = new SimpleQuote(0.0);
    const volTS = new Handle(flatVol1(today, vol, dc));
    let payoff;
    for (let i = 0; i < types.length; i++) {
        for (let j = 0; j < strikes.length; j++) {
            for (let k = 0; k < years.length; k++) {
                const exDate = DateExt.advance(today, years[k], TimeUnit.Years);
                const exercise = new AmericanExercise().init1(today, exDate);
                payoff = new PlainVanillaPayoff(types[i], strikes[j]);
                const stochProcess = new BlackScholesMertonProcess(new Handle(spot), qTS, rTS, volTS);
                let engine = Engine.fdInit(stochProcess);
                const option = new VanillaOption(payoff, exercise);
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
                                    const calcs = Array.from(calculated.entries());
                                    for (it = 0; it !== calcs.length; ++it) {
                                        const greek = calcs[it][first];
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
}

describe(`American option tests ${version}`, () => {
    it('Testing Barone-Adesi and Whaley approximation for American options...', () => {
        const values = [
            new AmericanOptionData(Option.Type.Call, 100.00, 90.00, 0.10, 0.10, 0.10, 0.15, 0.0206),
            new AmericanOptionData(Option.Type.Call, 100.00, 100.00, 0.10, 0.10, 0.10, 0.15, 1.8771),
            new AmericanOptionData(Option.Type.Call, 100.00, 110.00, 0.10, 0.10, 0.10, 0.15, 10.0089),
            new AmericanOptionData(Option.Type.Call, 100.00, 90.00, 0.10, 0.10, 0.10, 0.25, 0.3159),
            new AmericanOptionData(Option.Type.Call, 100.00, 100.00, 0.10, 0.10, 0.10, 0.25, 3.1280),
            new AmericanOptionData(Option.Type.Call, 100.00, 110.00, 0.10, 0.10, 0.10, 0.25, 10.3919),
            new AmericanOptionData(Option.Type.Call, 100.00, 90.00, 0.10, 0.10, 0.10, 0.35, 0.9495),
            new AmericanOptionData(Option.Type.Call, 100.00, 100.00, 0.10, 0.10, 0.10, 0.35, 4.3777),
            new AmericanOptionData(Option.Type.Call, 100.00, 110.00, 0.10, 0.10, 0.10, 0.35, 11.1679),
            new AmericanOptionData(Option.Type.Call, 100.00, 90.00, 0.10, 0.10, 0.50, 0.15, 0.8208),
            new AmericanOptionData(Option.Type.Call, 100.00, 100.00, 0.10, 0.10, 0.50, 0.15, 4.0842),
            new AmericanOptionData(Option.Type.Call, 100.00, 110.00, 0.10, 0.10, 0.50, 0.15, 10.8087),
            new AmericanOptionData(Option.Type.Call, 100.00, 90.00, 0.10, 0.10, 0.50, 0.25, 2.7437),
            new AmericanOptionData(Option.Type.Call, 100.00, 100.00, 0.10, 0.10, 0.50, 0.25, 6.8015),
            new AmericanOptionData(Option.Type.Call, 100.00, 110.00, 0.10, 0.10, 0.50, 0.25, 13.0170),
            new AmericanOptionData(Option.Type.Call, 100.00, 90.00, 0.10, 0.10, 0.50, 0.35, 5.0063),
            new AmericanOptionData(Option.Type.Call, 100.00, 100.00, 0.10, 0.10, 0.50, 0.35, 9.5106),
            new AmericanOptionData(Option.Type.Call, 100.00, 110.00, 0.10, 0.10, 0.50, 0.35, 15.5689),
            new AmericanOptionData(Option.Type.Put, 100.00, 90.00, 0.10, 0.10, 0.10, 0.15, 10.0000),
            new AmericanOptionData(Option.Type.Put, 100.00, 100.00, 0.10, 0.10, 0.10, 0.15, 1.8770),
            new AmericanOptionData(Option.Type.Put, 100.00, 110.00, 0.10, 0.10, 0.10, 0.15, 0.0410),
            new AmericanOptionData(Option.Type.Put, 100.00, 90.00, 0.10, 0.10, 0.10, 0.25, 10.2533),
            new AmericanOptionData(Option.Type.Put, 100.00, 100.00, 0.10, 0.10, 0.10, 0.25, 3.1277),
            new AmericanOptionData(Option.Type.Put, 100.00, 110.00, 0.10, 0.10, 0.10, 0.25, 0.4562),
            new AmericanOptionData(Option.Type.Put, 100.00, 90.00, 0.10, 0.10, 0.10, 0.35, 10.8787),
            new AmericanOptionData(Option.Type.Put, 100.00, 100.00, 0.10, 0.10, 0.10, 0.35, 4.3777),
            new AmericanOptionData(Option.Type.Put, 100.00, 110.00, 0.10, 0.10, 0.10, 0.35, 1.2402),
            new AmericanOptionData(Option.Type.Put, 100.00, 90.00, 0.10, 0.10, 0.50, 0.15, 10.5595),
            new AmericanOptionData(Option.Type.Put, 100.00, 100.00, 0.10, 0.10, 0.50, 0.15, 4.0842),
            new AmericanOptionData(Option.Type.Put, 100.00, 110.00, 0.10, 0.10, 0.50, 0.15, 1.0822),
            new AmericanOptionData(Option.Type.Put, 100.00, 90.00, 0.10, 0.10, 0.50, 0.25, 12.4419),
            new AmericanOptionData(Option.Type.Put, 100.00, 100.00, 0.10, 0.10, 0.50, 0.25, 6.8014),
            new AmericanOptionData(Option.Type.Put, 100.00, 110.00, 0.10, 0.10, 0.50, 0.25, 3.3226),
            new AmericanOptionData(Option.Type.Put, 100.00, 90.00, 0.10, 0.10, 0.50, 0.35, 14.6945),
            new AmericanOptionData(Option.Type.Put, 100.00, 100.00, 0.10, 0.10, 0.50, 0.35, 9.5104),
            new AmericanOptionData(Option.Type.Put, 100.00, 110.00, 0.10, 0.10, 0.50, 0.35, 5.8823),
            new AmericanOptionData(Option.Type.Put, 100.00, 100.00, 0.00, 0.00, 0.50, 0.15, 4.2294)
        ];
        const today = DateExt.UTC();
        const dc = new Actual360();
        const spot = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.0);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.0);
        const rTS = flatRate1(today, rRate, dc);
        const vol = new SimpleQuote(0.0);
        const volTS = flatVol1(today, vol, dc);
        const tolerance = 3.0e-3;
        for (let i = 0; i < values.length; i++) {
            const payoff = new PlainVanillaPayoff(values[i].type, values[i].strike);
            const exDate = DateExt.add(today, Math.floor(values[i].t * 360 + 0.5));
            const exercise = new AmericanExercise().init1(today, exDate);
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol.setValue(values[i].v);
            const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
            const engine = new BaroneAdesiWhaleyApproximationEngine(stochProcess);
            const option = new VanillaOption(payoff, exercise);
            option.setPricingEngine(engine);
            const calculated = option.NPV();
            const error = Math.abs(calculated - values[i].result);
            expect(error).toBeLessThan(tolerance);
        }
    });

    it('Testing Bjerksund and Stensland approximation for American options...', () => {
        const values = [
            new AmericanOptionData(Option.Type.Call, 40.00, 42.00, 0.08, 0.04, 0.75, 0.35, 5.2704),
            new AmericanOptionData(Option.Type.Put, 40.00, 36.00, 0.00, 0.06, 1.00, 0.20, 4.4531),
            new AmericanOptionData(Option.Type.Call, 100, 100, 0.05, 0.05, 1.00, 0.0021, 0.08032314),
            new AmericanOptionData(Option.Type.Call, 100, 100, 0.05, 0.05, 1.00, 0.0001, 0.003860656),
            new AmericanOptionData(Option.Type.Call, 100, 99.99, 0.05, 0.05, 1.00, 0.0001, 0.00081),
            new AmericanOptionData(Option.Type.Call, 100, 110, 0.05, 0.05, 1.00, 0.0001, 10.0),
            new AmericanOptionData(Option.Type.Put, 110, 100, 0.05, 0.05, 1.00, 0.0001, 10.0),
            new AmericanOptionData(Option.Type.Put, 100, 110, 0.05, 0.05, 1.00, 10, 94.89543)
        ];
        const today = DateExt.UTC();
        const dc = new Actual360();
        const spot = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.0);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.0);
        const rTS = flatRate1(today, rRate, dc);
        const vol = new SimpleQuote(0.0);
        const volTS = flatVol1(today, vol, dc);
        const tolerance = 5.0e-5;
        for (let i = 0; i < values.length; i++) {
            const payoff = new PlainVanillaPayoff(values[i].type, values[i].strike);
            const exDate = DateExt.add(today, Math.floor(values[i].t * 360 + 0.5));
            const exercise = new AmericanExercise().init1(today, exDate);
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol.setValue(values[i].v);
            const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
            const engine = new BjerksundStenslandApproximationEngine(stochProcess);
            const option = new VanillaOption(payoff, exercise);
            option.setPricingEngine(engine);
            const calculated = option.NPV();
            const error = Math.abs(calculated - values[i].result);
            expect(error).toBeLessThan(tolerance);
        }
    });

    it('Testing Ju approximation for American options...', () => {
        const today = DateExt.UTC();
        const dc = new Actual360();
        const spot = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.0);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.0);
        const rTS = flatRate1(today, rRate, dc);
        const vol = new SimpleQuote(0.0);
        const volTS = flatVol1(today, vol, dc);
        const tolerance = 1.0e-3;
        for (let i = 0; i < juValues.length; i++) {
            const payoff = new PlainVanillaPayoff(juValues[i].type, juValues[i].strike);
            const exDate = DateExt.add(today, Math.floor(juValues[i].t * 360 + 0.5));
            const exercise = new AmericanExercise().init1(today, exDate);
            spot.setValue(juValues[i].s);
            qRate.setValue(juValues[i].q);
            rRate.setValue(juValues[i].r);
            vol.setValue(juValues[i].v);
            const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
            const engine = new JuQuadraticApproximationEngine(stochProcess);
            const option = new VanillaOption(payoff, exercise);
            option.setPricingEngine(engine);
            const calculated = option.NPV();
            const error = Math.abs(calculated - juValues[i].result);
            expect(error).toBeLessThan(tolerance);
        }
    });

    it('Testing finite-difference engine for American options...', () => {
        const today = DateExt.UTC();
        const dc = new Actual360();
        const spot = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.0);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.0);
        const rTS = flatRate1(today, rRate, dc);
        const vol = new SimpleQuote(0.0);
        const volTS = flatVol1(today, vol, dc);
        const tolerance = 8.0e-2;
        for (let i = 0; i < juValues.length; i++) {
            const payoff = new PlainVanillaPayoff(juValues[i].type, juValues[i].strike);
            const exDate = DateExt.add(today, Math.floor(juValues[i].t * 360 + 0.5));
            const exercise = new AmericanExercise().init1(today, exDate);
            spot.setValue(juValues[i].s);
            qRate.setValue(juValues[i].q);
            rRate.setValue(juValues[i].r);
            vol.setValue(juValues[i].v);
            const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
            const engine = new FDAmericanEngine(new CrankNicolson()).fdInit(stochProcess, 100, 100);
            const option = new VanillaOption(payoff, exercise);
            option.setPricingEngine(engine);
            const calculated = option.NPV();
            const error = Math.abs(calculated - juValues[i].result);
            expect(error).toBeLessThan(tolerance);
        }
    });

    it('Testing finite-differences American option greeks...', () => {
        testFdGreeks(new FDAmericanEngine(new CrankNicolson()));
    });

    it('Testing finite-differences shout option greeks...', () => {
        testFdGreeks(new FDShoutEngine(new CrankNicolson()));
    });
});