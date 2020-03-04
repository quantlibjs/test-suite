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
import { Actual360, BlackScholesMertonProcess, DateExt, GeometricBrownianMotionProcess, Handle, MultiPathGenerator, OrnsteinUhlenbeckProcess, PathGenerator, PseudoRandom, SavedSettings, Settings, SimpleQuote, SquareRootProcess, StochasticProcessArray, TimeGrid, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate4, flatVol4 } from '/test-suite/utilities.mjs';

function testSingle(process, tag, brownianBridge, expected, antithetic) {
    const seed = 42;
    const length = 10;
    const timeSteps = 12;
    const rsg = new PseudoRandom().make_sequence_generator(timeSteps, seed);
    const generator = new PathGenerator().init1(process, length, timeSteps, rsg, brownianBridge);
    let i;
    for (i = 0; i < 100; i++) {
        generator.next();
    }
    let sample = generator.next();
    let calculated = sample.value.back;
    let error = Math.abs(calculated - expected);
    let tolerance = 2.0e-8;
    expect(error).toBeLessThanOrEqual(tolerance);
    sample = generator.antithetic();
    calculated = sample.value.back;
    error = Math.abs(calculated - antithetic);
    tolerance = 2.0e-7;
    expect(error).toBeLessThanOrEqual(tolerance);
}

function testMultiple(process, tag, expected, antithetic) {
    const seed = 42;
    const length = 10;
    const timeSteps = 12;
    const assets = process.size();
    const rsg = new PseudoRandom().make_sequence_generator(timeSteps * assets, seed);
    const generator = new MultiPathGenerator().init2(process, new TimeGrid().init1(length, timeSteps), rsg, false);
    let i, j;
    for (i = 0; i < 100; i++) {
        generator.next();
    }
    let sample = generator.next();
    const calculated = new Array(assets);
    let error;
    const tolerance = 2.0e-7;
    for (j = 0; j < assets; j++) {
        calculated[j] = sample.value.at(j).back;
    }
    for (j = 0; j < assets; j++) {
        error = Math.abs(calculated[j] - expected[j]);
        expect(error).toBeLessThanOrEqual(tolerance);
    }
    sample = generator.antithetic();
    for (j = 0; j < assets; j++) {
        calculated[j] = sample.value.at(j).back;
    }
    for (j = 0; j < assets; j++) {
        error = Math.abs(calculated[j] - antithetic[j]);
        expect(error).toBeLessThanOrEqual(tolerance);
    }
}

describe(`Path generation tests ${version}`, () => {
    it('Testing 1-D path generation against cached values...', () => {
        const backup = new SavedSettings();
        Settings.evaluationDate.set(DateExt.UTC('26,April,2005'));
        const x0 = new Handle(new SimpleQuote(100.0));
        const r = new Handle(flatRate4(0.05, new Actual360()));
        const q = new Handle(flatRate4(0.02, new Actual360()));
        const sigma = new Handle(flatVol4(0.2, new Actual360()));
        testSingle(new BlackScholesMertonProcess(x0, q, r, sigma), 'Black-Scholes', false, 26.13784357783, 467.2928561411);
        testSingle(new BlackScholesMertonProcess(x0, q, r, sigma), 'Black-Scholes', true, 60.28215549393, 202.6143139999);
        testSingle(new GeometricBrownianMotionProcess(100.0, 0.03, 0.20), 'geometric Brownian', false, 27.62223714065, 483.6026514084);
        testSingle(new OrnsteinUhlenbeckProcess(0.1, 0.20), 'Ornstein-Uhlenbeck', false, -0.8372003433557, 0.8372003433557);
        testSingle(new SquareRootProcess(0.1, 0.1, 0.20, 10.0), 'Ornstein-Uhlenbeck', false, 1.70608664108, 6.024200546031);
        backup.dispose();
    });

    it('Testing n-D path generation against cached values...', () => {
        const backup = new SavedSettings();
        Settings.evaluationDate.set(DateExt.UTC('26,April,2005'));
        const x0 = new Handle(new SimpleQuote(100.0));
        const r = new Handle(flatRate4(0.05, new Actual360()));
        const q = new Handle(flatRate4(0.02, new Actual360()));
        const sigma = new Handle(flatVol4(0.2, new Actual360()));
        const correlation = [[1.0, 0.9, 0.7], [0.9, 1.0, 0.4], [0.7, 0.4, 1.0]];
        const processes = new Array(3);
        let process;
        processes[0] = new BlackScholesMertonProcess(x0, q, r, sigma);
        processes[1] = new BlackScholesMertonProcess(x0, q, r, sigma);
        processes[2] = new BlackScholesMertonProcess(x0, q, r, sigma);
        process = new StochasticProcessArray(processes, correlation);
        const result1 = [188.2235868185, 270.6713069569, 113.0431145652];
        const result1a = [64.89105742957, 45.12494404804, 108.0475146914];
        testMultiple(process, 'Black-Scholes', result1, result1a);
        processes[0] = new SquareRootProcess(0.1, 0.1, 0.20, 10.0);
        processes[1] = new SquareRootProcess(0.1, 0.1, 0.20, 10.0);
        processes[2] = new SquareRootProcess(0.1, 0.1, 0.20, 10.0);
        process = new StochasticProcessArray(processes, correlation);
        const result4 = [4.279510844897, 4.943783503533, 3.590930385958];
        const result4a = [2.763967737724, 2.226487196647, 3.503859264341];
        testMultiple(process, 'Black-Scholes', result4, result4a);
        backup.dispose();
    });
});
