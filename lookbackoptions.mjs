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
import { Actual360, AnalyticContinuousFixedLookbackEngine, AnalyticContinuousFloatingLookbackEngine, AnalyticContinuousPartialFixedLookbackEngine, AnalyticContinuousPartialFloatingLookbackEngine, BlackScholesMertonProcess, ContinuousFixedLookbackOption, ContinuousFloatingLookbackOption, ContinuousPartialFixedLookbackOption, ContinuousPartialFloatingLookbackOption, DateExt, EuropeanExercise, FloatingTypePayoff, Handle, Option, PlainVanillaPayoff, SimpleQuote, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
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

describe(`Lookback option tests ${version}`, () => {
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
        const today = DateExt.UTC();
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
        const values = [
            new LookbackOptionData(Option.Type.Call, 95, 100, 100.0, 0.00, 0.10, 0.50, 0.10, 0, 0, 13.2687, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 95, 100, 100.0, 0.00, 0.10, 0.50, 0.20, 0, 0, 18.9263, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 95, 100, 100.0, 0.00, 0.10, 0.50, 0.30, 0, 0, 24.9857, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 100, 100, 100.0, 0.00, 0.10, 0.50, 0.10, 0, 0, 8.5126, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 100, 100, 100.0, 0.00, 0.10, 0.50, 0.20, 0, 0, 14.1702, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 100, 100, 100.0, 0.00, 0.10, 0.50, 0.30, 0, 0, 20.2296, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 105, 100, 100.0, 0.00, 0.10, 0.50, 0.10, 0, 0, 4.3908, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 105, 100, 100.0, 0.00, 0.10, 0.50, 0.20, 0, 0, 9.8905, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 105, 100, 100.0, 0.00, 0.10, 0.50, 0.30, 0, 0, 15.8512, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 95, 100, 100.0, 0.00, 0.10, 1.00, 0.10, 0, 0, 18.3241, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 95, 100, 100.0, 0.00, 0.10, 1.00, 0.20, 0, 0, 26.0731, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 95, 100, 100.0, 0.00, 0.10, 1.00, 0.30, 0, 0, 34.7116, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 100, 100, 100.0, 0.00, 0.10, 1.00, 0.10, 0, 0, 13.8000, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 100, 100, 100.0, 0.00, 0.10, 1.00, 0.20, 0, 0, 21.5489, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 100, 100, 100.0, 0.00, 0.10, 1.00, 0.30, 0, 0, 30.1874, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 105, 100, 100.0, 0.00, 0.10, 1.00, 0.10, 0, 0, 9.5445, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 105, 100, 100.0, 0.00, 0.10, 1.00, 0.20, 0, 0, 17.2965, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 105, 100, 100.0, 0.00, 0.10, 1.00, 0.30, 0, 0, 25.9002, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 95, 100, 100.0, 0.00, 0.10, 0.50, 0.10, 0, 0, 0.6899, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 95, 100, 100.0, 0.00, 0.10, 0.50, 0.20, 0, 0, 4.4448, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 95, 100, 100.0, 0.00, 0.10, 0.50, 0.30, 0, 0, 8.9213, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 100, 100, 100.0, 0.00, 0.10, 0.50, 0.10, 0, 0, 3.3917, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 100, 100, 100.0, 0.00, 0.10, 0.50, 0.20, 0, 0, 8.3177, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 100, 100, 100.0, 0.00, 0.10, 0.50, 0.30, 0, 0, 13.1579, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 105, 100, 100.0, 0.00, 0.10, 0.50, 0.10, 0, 0, 8.1478, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 105, 100, 100.0, 0.00, 0.10, 0.50, 0.20, 0, 0, 13.0739, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 105, 100, 100.0, 0.00, 0.10, 0.50, 0.30, 0, 0, 17.9140, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 95, 100, 100.0, 0.00, 0.10, 1.00, 0.10, 0, 0, 1.0534, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 95, 100, 100.0, 0.00, 0.10, 1.00, 0.20, 0, 0, 6.2813, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 95, 100, 100.0, 0.00, 0.10, 1.00, 0.30, 0, 0, 12.2376, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 100, 100, 100.0, 0.00, 0.10, 1.00, 0.10, 0, 0, 3.8079, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 100, 100, 100.0, 0.00, 0.10, 1.00, 0.20, 0, 0, 10.1294, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 100, 100, 100.0, 0.00, 0.10, 1.00, 0.30, 0, 0, 16.3889, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 105, 100, 100.0, 0.00, 0.10, 1.00, 0.10, 0, 0, 8.3321, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 105, 100, 100.0, 0.00, 0.10, 1.00, 0.20, 0, 0, 14.6536, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 105, 100, 100.0, 0.00, 0.10, 1.00, 0.30, 0, 0, 20.9130, 1.0e-4)
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
            const exDate = DateExt.add(today, Math.floor(values[i].t * 360 + 0.5));
            const exercise = new EuropeanExercise(exDate);
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol.setValue(values[i].v);
            const payoff = new PlainVanillaPayoff(values[i].type, values[i].strike);
            const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
            const engine = new AnalyticContinuousFixedLookbackEngine(stochProcess);
            const option = new ContinuousFixedLookbackOption(values[i].minmax, payoff, exercise);
            option.setPricingEngine(engine);
            const calculated = option.NPV();
            const expected = values[i].result;
            const error = Math.abs(calculated - expected);
            expect(error).toBeLessThan(values[i].tol);
        }
    });

    it('Testing analytic continuous partial floating-strike lookback options...', () => {
        const values = [
            new LookbackOptionData(Option.Type.Call, 0, 90, 90, 0, 0.06, 1, 0.1, 1, 0.25, 8.6524, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 0, 90, 90, 0, 0.06, 1, 0.1, 1, 0.5, 9.2128, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 0, 90, 90, 0, 0.06, 1, 0.1, 1, 0.75, 9.5567, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 0, 110, 110, 0, 0.06, 1, 0.1, 1, 0.25, 10.5751, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 0, 110, 110, 0, 0.06, 1, 0.1, 1, 0.5, 11.2601, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 0, 110, 110, 0, 0.06, 1, 0.1, 1, 0.75, 11.6804, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 0, 90, 90, 0, 0.06, 1, 0.2, 1, 0.25, 13.3402, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 0, 90, 90, 0, 0.06, 1, 0.2, 1, 0.5, 14.5121, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 0, 90, 90, 0, 0.06, 1, 0.2, 1, 0.75, 15.314, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 0, 110, 110, 0, 0.06, 1, 0.2, 1, 0.25, 16.3047, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 0, 110, 110, 0, 0.06, 1, 0.2, 1, 0.5, 17.737, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 0, 110, 110, 0, 0.06, 1, 0.2, 1, 0.75, 18.7171, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 0, 90, 90, 0, 0.06, 1, 0.3, 1, 0.25, 17.9831, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 0, 90, 90, 0, 0.06, 1, 0.3, 1, 0.5, 19.6618, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 0, 90, 90, 0, 0.06, 1, 0.3, 1, 0.75, 20.8493, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 0, 110, 110, 0, 0.06, 1, 0.3, 1, 0.25, 21.9793, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 0, 110, 110, 0, 0.06, 1, 0.3, 1, 0.5, 24.0311, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 0, 110, 110, 0, 0.06, 1, 0.3, 1, 0.75, 25.4825, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 0, 90, 90, 0, 0.06, 1, 0.1, 1, 0.25, 2.7189, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 0, 90, 90, 0, 0.06, 1, 0.1, 1, 0.5, 3.4639, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 0, 90, 90, 0, 0.06, 1, 0.1, 1, 0.75, 4.1912, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 0, 110, 110, 0, 0.06, 1, 0.1, 1, 0.25, 3.3231, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 0, 110, 110, 0, 0.06, 1, 0.1, 1, 0.5, 4.2336, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 0, 110, 110, 0, 0.06, 1, 0.1, 1, 0.75, 5.1226, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 0, 90, 90, 0, 0.06, 1, 0.2, 1, 0.25, 7.9153, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 0, 90, 90, 0, 0.06, 1, 0.2, 1, 0.5, 9.5825, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 0, 90, 90, 0, 0.06, 1, 0.2, 1, 0.75, 11.0362, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 0, 110, 110, 0, 0.06, 1, 0.2, 1, 0.25, 9.6743, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 0, 110, 110, 0, 0.06, 1, 0.2, 1, 0.5, 11.7119, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 0, 110, 110, 0, 0.06, 1, 0.2, 1, 0.75, 13.4887, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 0, 90, 90, 0, 0.06, 1, 0.3, 1, 0.25, 13.4719, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 0, 90, 90, 0, 0.06, 1, 0.3, 1, 0.5, 16.1495, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 0, 90, 90, 0, 0.06, 1, 0.3, 1, 0.75, 18.4071, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 0, 110, 110, 0, 0.06, 1, 0.3, 1, 0.25, 16.4657, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 0, 110, 110, 0, 0.06, 1, 0.3, 1, 0.5, 19.7383, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 0, 110, 110, 0, 0.06, 1, 0.3, 1, 0.75, 22.4976, 1.0e-4)
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
            const exDate = DateExt.add(today, Math.floor(values[i].t * 360 + 0.5));
            const exercise = new EuropeanExercise(exDate);
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol.setValue(values[i].v);
            const payoff = new FloatingTypePayoff(values[i].type);
            const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
            const engine = new AnalyticContinuousPartialFloatingLookbackEngine(stochProcess);
            const lookbackEnd = DateExt.add(today, Math.floor(values[i].t1 * 360 + 0.5));
            const option = new ContinuousPartialFloatingLookbackOption(values[i].minmax, values[i].l, lookbackEnd, payoff, exercise);
            option.setPricingEngine(engine);
            const calculated = option.NPV();
            const expected = values[i].result;
            const error = Math.abs(calculated - expected);
            expect(error).toBeLessThan(values[i].tol);
        }
    });

    it('Testing analytic continuous fixed-strike lookback options...', () => {
        const values = [
            new LookbackOptionData(Option.Type.Call, 90, 0, 100, 0, 0.06, 1, 0.1, 0, 0.25, 20.2845, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 90, 0, 100, 0, 0.06, 1, 0.1, 0, 0.5, 19.6239, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 90, 0, 100, 0, 0.06, 1, 0.1, 0, 0.75, 18.6244, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 110, 0, 100, 0, 0.06, 1, 0.1, 0, 0.25, 4.0432, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 110, 0, 100, 0, 0.06, 1, 0.1, 0, 0.5, 3.958, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 110, 0, 100, 0, 0.06, 1, 0.1, 0, 0.75, 3.7015, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 90, 0, 100, 0, 0.06, 1, 0.2, 0, 0.25, 27.5385, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 90, 0, 100, 0, 0.06, 1, 0.2, 0, 0.5, 25.8126, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 90, 0, 100, 0, 0.06, 1, 0.2, 0, 0.75, 23.4957, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 110, 0, 100, 0, 0.06, 1, 0.2, 0, 0.25, 11.4895, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 110, 0, 100, 0, 0.06, 1, 0.2, 0, 0.5, 10.8995, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 110, 0, 100, 0, 0.06, 1, 0.2, 0, 0.75, 9.8244, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 90, 0, 100, 0, 0.06, 1, 0.3, 0, 0.25, 35.4578, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 90, 0, 100, 0, 0.06, 1, 0.3, 0, 0.5, 32.7172, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 90, 0, 100, 0, 0.06, 1, 0.3, 0, 0.75, 29.1473, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 110, 0, 100, 0, 0.06, 1, 0.3, 0, 0.25, 19.725, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 110, 0, 100, 0, 0.06, 1, 0.3, 0, 0.5, 18.4025, 1.0e-4),
            new LookbackOptionData(Option.Type.Call, 110, 0, 100, 0, 0.06, 1, 0.3, 0, 0.75, 16.2976, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 90, 0, 100, 0, 0.06, 1, 0.1, 0, 0.25, 0.4973, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 90, 0, 100, 0, 0.06, 1, 0.1, 0, 0.5, 0.4632, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 90, 0, 100, 0, 0.06, 1, 0.1, 0, 0.75, 0.3863, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 110, 0, 100, 0, 0.06, 1, 0.1, 0, 0.25, 12.6978, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 110, 0, 100, 0, 0.06, 1, 0.1, 0, 0.5, 10.9492, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 110, 0, 100, 0, 0.06, 1, 0.1, 0, 0.75, 9.1555, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 90, 0, 100, 0, 0.06, 1, 0.2, 0, 0.25, 4.5863, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 90, 0, 100, 0, 0.06, 1, 0.2, 0, 0.5, 4.1925, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 90, 0, 100, 0, 0.06, 1, 0.2, 0, 0.75, 3.5831, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 110, 0, 100, 0, 0.06, 1, 0.2, 0, 0.25, 19.0255, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 110, 0, 100, 0, 0.06, 1, 0.2, 0, 0.5, 16.9433, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 110, 0, 100, 0, 0.06, 1, 0.2, 0, 0.75, 14.6505, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 90, 0, 100, 0, 0.06, 1, 0.3, 0, 0.25, 9.9348, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 90, 0, 100, 0, 0.06, 1, 0.3, 0, 0.5, 9.1111, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 90, 0, 100, 0, 0.06, 1, 0.3, 0, 0.75, 7.9267, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 110, 0, 100, 0, 0.06, 1, 0.3, 0, 0.25, 25.2112, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 110, 0, 100, 0, 0.06, 1, 0.3, 0, 0.5, 22.8217, 1.0e-4),
            new LookbackOptionData(Option.Type.Put, 110, 0, 100, 0, 0.06, 1, 0.3, 0, 0.75, 20.0566, 1.0e-4)
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
            const exDate = DateExt.add(today, Math.floor(values[i].t * 360 + 0.5));
            const exercise = new EuropeanExercise(exDate);
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol.setValue(values[i].v);
            const payoff = new PlainVanillaPayoff(values[i].type, values[i].strike);
            const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
            const engine = new AnalyticContinuousPartialFixedLookbackEngine(stochProcess);
            const lookbackStart = DateExt.add(today, Math.floor(values[i].t1 * 360 + 0.5));
            const option = new ContinuousPartialFixedLookbackOption(lookbackStart, payoff, exercise);
            option.setPricingEngine(engine);
            const calculated = option.NPV();
            const expected = values[i].result;
            const error = Math.abs(calculated - expected);
            expect(error).toBeLessThan(values[i].tol);
        }
    });
});
