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
import { Actual360, DateExt, Handle, HestonProcess, IntegralHestonVarianceOptionEngine, Option, PlainVanillaPayoff, Settings, SimpleQuote, VarianceOption, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate1 } from '/test-suite/utilities.mjs';

describe(`Variance option tests ${version}`, () => {
    it('Testing variance option with integral Heston engine...', () => {
        const dc = new Actual360();
        const today = Settings.evaluationDate.f();
        const s0 = new Handle(new SimpleQuote(1.0));
        const qTS = new Handle();
        const rRate = new SimpleQuote(0.0);
        const rTS = new Handle(flatRate1(today, rRate, dc));
        let v0 = 2.0;
        let kappa = 2.0;
        let theta = 0.01;
        let sigma = 0.1;
        let rho = -0.5;
        let process = new HestonProcess(rTS, qTS, s0, v0, kappa, theta, sigma, rho);
        let engine = new IntegralHestonVarianceOptionEngine(process);
        let strike = 0.05;
        let nominal = 1.0;
        let T = 1.5;
        let exDate = DateExt.add(today, Math.floor(360 * T));
        let payoff = new PlainVanillaPayoff(Option.Type.Call, strike);
        const varianceOption1 = new VarianceOption(payoff, nominal, today, exDate);
        varianceOption1.setPricingEngine(engine);
        let calculated = varianceOption1.NPV();
        let expected = 0.9104619;
        let error = Math.abs(calculated - expected);
        expect(error).toBeLessThan(1.0e-7);
        v0 = 1.5;
        kappa = 2.0;
        theta = 0.01;
        sigma = 0.1;
        rho = -0.5;
        process = new HestonProcess(rTS, qTS, s0, v0, kappa, theta, sigma, rho);
        engine = new IntegralHestonVarianceOptionEngine(process);
        strike = 0.7;
        nominal = 1.0;
        T = 1.0;
        exDate = DateExt.add(today, Math.floor(360 * T));
        payoff = new PlainVanillaPayoff(Option.Type.Put, strike);
        const varianceOption2 = new VarianceOption(payoff, nominal, today, exDate);
        varianceOption2.setPricingEngine(engine);
        calculated = varianceOption2.NPV();
        expected = 0.0466796;
        error = Math.abs(calculated - expected);
        expect(error).toBeLessThan(1.0e-7);
    });
});
