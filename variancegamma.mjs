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
import { Actual360, DateExt, EuropeanExercise, EuropeanOption, FFTVarianceGammaEngine, FlatForward, Handle, Option, PlainVanillaPayoff, SavedSettings, Settings, SimpleQuote, Thirty360, VanillaOption, VarianceGammaEngine, VarianceGammaProcess, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate1 } from '/test-suite/utilities.mjs';

class VarianceGammaProcessData {
    constructor(s, q, r, sigma, nu, theta) {
        this.s = s;
        this.q = q;
        this.r = r;
        this.sigma = sigma;
        this.nu = nu;
        this.theta = theta;
    }
}

class VarianceGammaOptionData {
    constructor(type, strike, t) {
        this.type = type;
        this.strike = strike;
        this.t = t;
    }
}

describe(`Variance Gamma tests ${version}`, () => {
    it('Testing variance-gamma model for European options...', () => {
        const backup = new SavedSettings();
        const processes = [
            new VarianceGammaProcessData(6000, 0.00, 0.05, 0.20, 0.05, -0.50),
            new VarianceGammaProcessData(6000, 0.02, 0.05, 0.15, 0.01, -0.50)
        ];
        const options = [
            new VarianceGammaOptionData(Option.Type.Call, 5550, 1.0),
            new VarianceGammaOptionData(Option.Type.Call, 5600, 1.0),
            new VarianceGammaOptionData(Option.Type.Call, 5650, 1.0),
            new VarianceGammaOptionData(Option.Type.Call, 5700, 1.0),
            new VarianceGammaOptionData(Option.Type.Call, 5750, 1.0),
            new VarianceGammaOptionData(Option.Type.Call, 5800, 1.0),
            new VarianceGammaOptionData(Option.Type.Call, 5850, 1.0),
            new VarianceGammaOptionData(Option.Type.Call, 5900, 1.0),
            new VarianceGammaOptionData(Option.Type.Call, 5950, 1.0),
            new VarianceGammaOptionData(Option.Type.Call, 6000, 1.0),
            new VarianceGammaOptionData(Option.Type.Call, 6050, 1.0),
            new VarianceGammaOptionData(Option.Type.Call, 6100, 1.0),
            new VarianceGammaOptionData(Option.Type.Call, 6150, 1.0),
            new VarianceGammaOptionData(Option.Type.Call, 6200, 1.0),
            new VarianceGammaOptionData(Option.Type.Call, 6250, 1.0),
            new VarianceGammaOptionData(Option.Type.Call, 6300, 1.0),
            new VarianceGammaOptionData(Option.Type.Call, 6350, 1.0),
            new VarianceGammaOptionData(Option.Type.Call, 6400, 1.0),
            new VarianceGammaOptionData(Option.Type.Call, 6450, 1.0),
            new VarianceGammaOptionData(Option.Type.Call, 6500, 1.0),
            new VarianceGammaOptionData(Option.Type.Call, 6550, 1.0),
            new VarianceGammaOptionData(Option.Type.Put, 5550, 1.0)
        ];
        const results = [
            [
                955.1637, 922.7529, 890.9872, 859.8739, 829.4197, 799.6303,
                770.5104, 742.0640, 714.2943, 687.2032, 660.7921, 635.0613,
                610.0103, 585.6379, 561.9416, 538.9186, 516.5649, 494.8760,
                473.8464, 453.4700, 433.7400, 234.4870
            ],
            [
                732.8705, 698.5542, 665.1404, 632.6498, 601.1002, 570.5068,
                540.8824, 512.2367, 484.5766, 457.9064, 432.2273, 407.5381,
                383.8346, 361.1102, 339.3559, 318.5599, 298.7087, 279.7864,
                261.7751, 244.6552, 228.4057, 130.9974
            ]
        ];
        const tol = 0.01;
        const dc = new Actual360();
        const today = DateExt.UTC();
        for (let i = 0; i < processes.length; i++) {
            const spot = new SimpleQuote(processes[i].s);
            const qRate = new SimpleQuote(processes[i].q);
            const qTS = flatRate1(today, qRate, dc);
            const rRate = new SimpleQuote(processes[i].r);
            const rTS = flatRate1(today, rRate, dc);
            const stochProcess = new VarianceGammaProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), processes[i].sigma, processes[i].nu, processes[i].theta);
            const analyticEngine = new VarianceGammaEngine(stochProcess);
            const fftEngine = new FFTVarianceGammaEngine(stochProcess);
            const optionList = [];
            const payoffs = [];
            for (let j = 0; j < options.length; j++) {
                const exDate = DateExt.add(today, Math.floor(options[j].t * 360 + 0.5));
                const exercise = new EuropeanExercise(exDate);
                const payoff = new PlainVanillaPayoff(options[j].type, options[j].strike);
                payoffs.push(payoff);
                const option = new EuropeanOption(payoff, exercise);
                option.setPricingEngine(analyticEngine);
                const calculated = option.NPV();
                const expected = results[i][j];
                const error = Math.abs(calculated - expected);
                expect(error).toBeLessThan(tol);
                optionList.push(option);
            }
            fftEngine.precalculate(optionList);
            for (let j = 0; j < options.length; j++) {
                const option = optionList[j];
                option.setPricingEngine(fftEngine);
                const calculated = option.NPV();
                const expected = results[i][j];
                const error = Math.abs(calculated - expected);
                expect(error).toBeLessThan(tol);
            }
        }
        backup.dispose();
    });

    it('Testing variance-gamma model integration around zero...', () => {
        const backup = new SavedSettings();
        const stock = 100;
        const strike = 98;
        const sigma = 0.12;
        const mu = -0.14;
        const kappa = 0.2;
        const valuation = DateExt.UTC('1,Jan,2017');
        const maturity = DateExt.UTC('10,Jan,2017');
        const discountCounter = new Thirty360();
        Settings.evaluationDate.set(valuation);
        const exercise = new EuropeanExercise(maturity);
        const payoff = new PlainVanillaPayoff(Option.Type.Call, strike);
        const option = new VanillaOption(payoff, exercise);
        const dividend = new Handle(new FlatForward().ffInit2(valuation, 0.0, discountCounter));
        const disc = new Handle(new FlatForward().ffInit2(valuation, 0.05, discountCounter));
        const S0 = new Handle(new SimpleQuote(stock));
        const process = new VarianceGammaProcess(S0, dividend, disc, sigma, kappa, mu);
        option.setPricingEngine(new VarianceGammaEngine(process));
        option.NPV();
        expect(() => { }).not.toThrow();
        backup.dispose();
    });
});
