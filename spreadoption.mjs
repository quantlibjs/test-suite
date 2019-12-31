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
import { Actual360, BlackProcess, DateExt, EuropeanExercise, Handle, KirkSpreadOptionEngine, Option, PlainVanillaPayoff, SimpleQuote, SpreadOption, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate2, flatVol2 } from '/test-suite/utilities.mjs';

class Case {
    constructor(F1, F2, X, r, sigma1, sigma2, rho, length, value, theta) {
        this.F1 = F1;
        this.F2 = F2;
        this.X = X;
        this.r = r;
        this.sigma1 = sigma1;
        this.sigma2 = sigma2;
        this.rho = rho;
        this.length = length;
        this.value = value;
        this.theta = theta;
    }
}

describe(`Spread option tests ${version}`, () => {
    it('Testing Kirk approximation for spread options...', () => {
        const cases = [
            new Case(28.0, 20.0, 7.0, 0.05, 0.29, 0.36, 0.42, 90, 2.1670, 3.0431),
            new Case(122.0, 120.0, 3.0, 0.10, 0.20, 0.20, -0.5, 36, 4.7530, 25.5905),
            new Case(122.0, 120.0, 3.0, 0.10, 0.20, 0.20, 0.0, 36, 3.7970, 20.8841),
            new Case(122.0, 120.0, 3.0, 0.10, 0.20, 0.20, 0.5, 36, 2.5537, 14.7260),
            new Case(122.0, 120.0, 3.0, 0.10, 0.20, 0.20, -0.5, 180, 10.7517, 10.0847),
            new Case(122.0, 120.0, 3.0, 0.10, 0.20, 0.20, 0.0, 180, 8.7020, 8.2619),
            new Case(122.0, 120.0, 3.0, 0.10, 0.20, 0.20, 0.5, 180, 6.0257, 5.8661),
            new Case(122.0, 120.0, 3.0, 0.10, 0.25, 0.20, -0.5, 36, 5.4275, 28.9013),
            new Case(122.0, 120.0, 3.0, 0.10, 0.25, 0.20, 0.0, 36, 4.3712, 23.7133),
            new Case(122.0, 120.0, 3.0, 0.10, 0.25, 0.20, 0.5, 36, 3.0086, 16.9864),
            new Case(122.0, 120.0, 3.0, 0.10, 0.25, 0.20, -0.5, 180, 12.1941, 11.3603),
            new Case(122.0, 120.0, 3.0, 0.10, 0.25, 0.20, 0.0, 180, 9.9340, 9.3589),
            new Case(122.0, 120.0, 3.0, 0.10, 0.25, 0.20, 0.5, 180, 7.0067, 6.7463),
            new Case(122.0, 120.0, 3.0, 0.10, 0.20, 0.25, -0.5, 36, 5.4061, 28.7963),
            new Case(122.0, 120.0, 3.0, 0.10, 0.20, 0.25, 0.0, 36, 4.3451, 23.5848),
            new Case(122.0, 120.0, 3.0, 0.10, 0.20, 0.25, 0.5, 36, 2.9723, 16.8060),
            new Case(122.0, 120.0, 3.0, 0.10, 0.20, 0.25, -0.5, 180, 12.1483, 11.3200),
            new Case(122.0, 120.0, 3.0, 0.10, 0.20, 0.25, 0.0, 180, 9.8780, 9.3091),
            new Case(122.0, 120.0, 3.0, 0.10, 0.20, 0.25, 0.5, 180, 6.9284, 6.6761)
        ];
        for (let i = 0; i < cases.length; ++i) {
            const dc = new Actual360();
            const today = DateExt.UTC();
            const exerciseDate = DateExt.add(today, cases[i].length);
            const F1 = new SimpleQuote(cases[i].F1);
            const F2 = new SimpleQuote(cases[i].F2);
            const riskFreeRate = cases[i].r;
            const forwardRate = flatRate2(today, riskFreeRate, dc);
            const rho = new SimpleQuote(cases[i].rho);
            const vol1 = cases[i].sigma1;
            const vol2 = cases[i].sigma2;
            const volTS1 = flatVol2(today, vol1, dc);
            const volTS2 = flatVol2(today, vol2, dc);
            const stochProcess1 = new BlackProcess(new Handle(F1), new Handle(forwardRate), new Handle(volTS1));
            const stochProcess2 = new BlackProcess(new Handle(F2), new Handle(forwardRate), new Handle(volTS2));
            const engine = new KirkSpreadOptionEngine(stochProcess1, stochProcess2, new Handle(rho));
            const type = Option.Type.Call;
            const strike = cases[i].X;
            const payoff = new PlainVanillaPayoff(type, strike);
            const exercise = new EuropeanExercise(exerciseDate);
            const option = new SpreadOption(payoff, exercise);
            option.setPricingEngine(engine);
            const value = option.NPV();
            const theta = option.theta();
            const tolerance = 1e-4;
            expect(Math.abs(value - cases[i].value)).toBeLessThan(tolerance);
            expect(Math.abs(theta - cases[i].theta)).toBeLessThan(tolerance);
        }
    });
});
