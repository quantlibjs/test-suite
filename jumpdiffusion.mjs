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
import { Actual360, DateExt, EuropeanExercise, EuropeanOption, Handle, JumpDiffusionEngine, Merton76Process, Option, PlainVanillaPayoff, SimpleQuote, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate1, flatVol1 } from '/test-suite/utilities.mjs';

class HaugMertonData {
    constructor(type, strike, s, q, r, t, v, jumpIntensity, gamma, result, tol) {
        this.type = type;
        this.strike = strike;
        this.s = s;
        this.q = q;
        this.r = r;
        this.t = t;
        this.v = v;
        this.jumpIntensity = jumpIntensity;
        this.gamma = gamma;
        this.result = result;
        this.tol = tol;
    }
}

describe(`Jump-diffusion tests ${version}`, () => {
    it('Testing Merton 76 jump-diffusion model for European options...', () => {
        const values = [
            new HaugMertonData(Option.Type.Call, 80.00, 100.00, 0.00, 0.08, 0.10, 0.25, 1.0, 0.25, 20.67, 1e-2),
            new HaugMertonData(Option.Type.Call, 80.00, 100.00, 0.00, 0.08, 0.25, 0.25, 1.0, 0.25, 21.74, 1e-2),
            new HaugMertonData(Option.Type.Call, 80.00, 100.00, 0.00, 0.08, 0.50, 0.25, 1.0, 0.25, 23.63, 1e-2),
            new HaugMertonData(Option.Type.Call, 80.00, 100.00, 0.00, 0.08, 0.10, 0.25, 5.0, 0.25, 20.65, 1e-2),
            new HaugMertonData(Option.Type.Call, 80.00, 100.00, 0.00, 0.08, 0.25, 0.25, 5.0, 0.25, 21.70, 1e-2),
            new HaugMertonData(Option.Type.Call, 80.00, 100.00, 0.00, 0.08, 0.50, 0.25, 5.0, 0.25, 23.61, 1e-2),
            new HaugMertonData(Option.Type.Call, 80.00, 100.00, 0.00, 0.08, 0.10, 0.25, 10.0, 0.25, 20.64, 1e-2),
            new HaugMertonData(Option.Type.Call, 80.00, 100.00, 0.00, 0.08, 0.25, 0.25, 10.0, 0.25, 21.70, 1e-2),
            new HaugMertonData(Option.Type.Call, 80.00, 100.00, 0.00, 0.08, 0.50, 0.25, 10.0, 0.25, 23.61, 1e-2),
            new HaugMertonData(Option.Type.Call, 90.00, 100.00, 0.00, 0.08, 0.10, 0.25, 1.0, 0.25, 11.00, 1e-2),
            new HaugMertonData(Option.Type.Call, 90.00, 100.00, 0.00, 0.08, 0.25, 0.25, 1.0, 0.25, 12.74, 1e-2),
            new HaugMertonData(Option.Type.Call, 90.00, 100.00, 0.00, 0.08, 0.50, 0.25, 1.0, 0.25, 15.40, 1e-2),
            new HaugMertonData(Option.Type.Call, 90.00, 100.00, 0.00, 0.08, 0.10, 0.25, 5.0, 0.25, 10.98, 1e-2),
            new HaugMertonData(Option.Type.Call, 90.00, 100.00, 0.00, 0.08, 0.25, 0.25, 5.0, 0.25, 12.75, 1e-2),
            new HaugMertonData(Option.Type.Call, 90.00, 100.00, 0.00, 0.08, 0.50, 0.25, 5.0, 0.25, 15.42, 1e-2),
            new HaugMertonData(Option.Type.Call, 90.00, 100.00, 0.00, 0.08, 0.10, 0.25, 10.0, 0.25, 10.98, 1e-2),
            new HaugMertonData(Option.Type.Call, 90.00, 100.00, 0.00, 0.08, 0.25, 0.25, 10.0, 0.25, 12.75, 1e-2),
            new HaugMertonData(Option.Type.Call, 90.00, 100.00, 0.00, 0.08, 0.50, 0.25, 10.0, 0.25, 15.42, 1e-2),
            new HaugMertonData(Option.Type.Call, 100.00, 100.00, 0.00, 0.08, 0.10, 0.25, 1.0, 0.25, 3.42, 1e-2),
            new HaugMertonData(Option.Type.Call, 100.00, 100.00, 0.00, 0.08, 0.25, 0.25, 1.0, 0.25, 5.88, 1e-2),
            new HaugMertonData(Option.Type.Call, 100.00, 100.00, 0.00, 0.08, 0.50, 0.25, 1.0, 0.25, 8.95, 1e-2),
            new HaugMertonData(Option.Type.Call, 100.00, 100.00, 0.00, 0.08, 0.10, 0.25, 5.0, 0.25, 3.51, 1e-2),
            new HaugMertonData(Option.Type.Call, 100.00, 100.00, 0.00, 0.08, 0.25, 0.25, 5.0, 0.25, 5.96, 1e-2),
            new HaugMertonData(Option.Type.Call, 100.00, 100.00, 0.00, 0.08, 0.50, 0.25, 5.0, 0.25, 9.02, 1e-2),
            new HaugMertonData(Option.Type.Call, 100.00, 100.00, 0.00, 0.08, 0.10, 0.25, 10.0, 0.25, 3.53, 1e-2),
            new HaugMertonData(Option.Type.Call, 100.00, 100.00, 0.00, 0.08, 0.25, 0.25, 10.0, 0.25, 5.97, 1e-2),
            new HaugMertonData(Option.Type.Call, 100.00, 100.00, 0.00, 0.08, 0.50, 0.25, 10.0, 0.25, 9.03, 1e-2),
            new HaugMertonData(Option.Type.Call, 110.00, 100.00, 0.00, 0.08, 0.10, 0.25, 1.0, 0.25, 0.55, 1e-2),
            new HaugMertonData(Option.Type.Call, 110.00, 100.00, 0.00, 0.08, 0.25, 0.25, 1.0, 0.25, 2.11, 1e-2),
            new HaugMertonData(Option.Type.Call, 110.00, 100.00, 0.00, 0.08, 0.50, 0.25, 1.0, 0.25, 4.67, 1e-2),
            new HaugMertonData(Option.Type.Call, 110.00, 100.00, 0.00, 0.08, 0.10, 0.25, 5.0, 0.25, 0.56, 1e-2),
            new HaugMertonData(Option.Type.Call, 110.00, 100.00, 0.00, 0.08, 0.25, 0.25, 5.0, 0.25, 2.16, 1e-2),
            new HaugMertonData(Option.Type.Call, 110.00, 100.00, 0.00, 0.08, 0.50, 0.25, 5.0, 0.25, 4.73, 1e-2),
            new HaugMertonData(Option.Type.Call, 110.00, 100.00, 0.00, 0.08, 0.10, 0.25, 10.0, 0.25, 0.56, 1e-2),
            new HaugMertonData(Option.Type.Call, 110.00, 100.00, 0.00, 0.08, 0.25, 0.25, 10.0, 0.25, 2.17, 1e-2),
            new HaugMertonData(Option.Type.Call, 110.00, 100.00, 0.00, 0.08, 0.50, 0.25, 10.0, 0.25, 4.74, 1e-2),
            new HaugMertonData(Option.Type.Call, 120.00, 100.00, 0.00, 0.08, 0.10, 0.25, 1.0, 0.25, 0.10, 1e-2),
            new HaugMertonData(Option.Type.Call, 120.00, 100.00, 0.00, 0.08, 0.25, 0.25, 1.0, 0.25, 0.64, 1e-2),
            new HaugMertonData(Option.Type.Call, 120.00, 100.00, 0.00, 0.08, 0.50, 0.25, 1.0, 0.25, 2.23, 1e-2),
            new HaugMertonData(Option.Type.Call, 120.00, 100.00, 0.00, 0.08, 0.10, 0.25, 5.0, 0.25, 0.06, 1e-2),
            new HaugMertonData(Option.Type.Call, 120.00, 100.00, 0.00, 0.08, 0.25, 0.25, 5.0, 0.25, 0.63, 1e-2),
            new HaugMertonData(Option.Type.Call, 120.00, 100.00, 0.00, 0.08, 0.50, 0.25, 5.0, 0.25, 2.25, 1e-2),
            new HaugMertonData(Option.Type.Call, 120.00, 100.00, 0.00, 0.08, 0.10, 0.25, 10.0, 0.25, 0.05, 1e-2),
            new HaugMertonData(Option.Type.Call, 120.00, 100.00, 0.00, 0.08, 0.25, 0.25, 10.0, 0.25, 0.62, 1e-2),
            new HaugMertonData(Option.Type.Call, 120.00, 100.00, 0.00, 0.08, 0.50, 0.25, 10.0, 0.25, 2.25, 1e-2),
            new HaugMertonData(Option.Type.Call, 80.00, 100.00, 0.00, 0.08, 0.10, 0.25, 1.0, 0.50, 20.72, 1e-2),
            new HaugMertonData(Option.Type.Call, 80.00, 100.00, 0.00, 0.08, 0.25, 0.25, 1.0, 0.50, 21.83, 1e-2),
            new HaugMertonData(Option.Type.Call, 80.00, 100.00, 0.00, 0.08, 0.50, 0.25, 1.0, 0.50, 23.71, 1e-2),
            new HaugMertonData(Option.Type.Call, 80.00, 100.00, 0.00, 0.08, 0.10, 0.25, 5.0, 0.50, 20.66, 1e-2),
            new HaugMertonData(Option.Type.Call, 80.00, 100.00, 0.00, 0.08, 0.25, 0.25, 5.0, 0.50, 21.73, 1e-2),
            new HaugMertonData(Option.Type.Call, 80.00, 100.00, 0.00, 0.08, 0.50, 0.25, 5.0, 0.50, 23.63, 1e-2),
            new HaugMertonData(Option.Type.Call, 80.00, 100.00, 0.00, 0.08, 0.10, 0.25, 10.0, 0.50, 20.65, 1e-2),
            new HaugMertonData(Option.Type.Call, 80.00, 100.00, 0.00, 0.08, 0.25, 0.25, 10.0, 0.50, 21.71, 1e-2),
            new HaugMertonData(Option.Type.Call, 80.00, 100.00, 0.00, 0.08, 0.50, 0.25, 10.0, 0.50, 23.61, 1e-2),
            new HaugMertonData(Option.Type.Call, 90.00, 100.00, 0.00, 0.08, 0.10, 0.25, 1.0, 0.50, 11.04, 1e-2),
            new HaugMertonData(Option.Type.Call, 90.00, 100.00, 0.00, 0.08, 0.25, 0.25, 1.0, 0.50, 12.72, 1e-2),
            new HaugMertonData(Option.Type.Call, 90.00, 100.00, 0.00, 0.08, 0.50, 0.25, 1.0, 0.50, 15.34, 1e-2),
            new HaugMertonData(Option.Type.Call, 90.00, 100.00, 0.00, 0.08, 0.10, 0.25, 5.0, 0.50, 11.02, 1e-2),
            new HaugMertonData(Option.Type.Call, 90.00, 100.00, 0.00, 0.08, 0.25, 0.25, 5.0, 0.50, 12.76, 1e-2),
            new HaugMertonData(Option.Type.Call, 90.00, 100.00, 0.00, 0.08, 0.50, 0.25, 5.0, 0.50, 15.41, 1e-2),
            new HaugMertonData(Option.Type.Call, 90.00, 100.00, 0.00, 0.08, 0.10, 0.25, 10.0, 0.50, 11.00, 1e-2),
            new HaugMertonData(Option.Type.Call, 90.00, 100.00, 0.00, 0.08, 0.25, 0.25, 10.0, 0.50, 12.75, 1e-2),
            new HaugMertonData(Option.Type.Call, 90.00, 100.00, 0.00, 0.08, 0.50, 0.25, 10.0, 0.50, 15.41, 1e-2),
            new HaugMertonData(Option.Type.Call, 100.00, 100.00, 0.00, 0.08, 0.10, 0.25, 1.0, 0.50, 3.14, 1e-2),
            new HaugMertonData(Option.Type.Call, 100.00, 100.00, 0.00, 0.08, 0.25, 0.25, 1.0, 0.50, 5.58, 1e-2),
            new HaugMertonData(Option.Type.Call, 100.00, 100.00, 0.00, 0.08, 0.50, 0.25, 1.0, 0.50, 8.71, 1e-2),
            new HaugMertonData(Option.Type.Call, 100.00, 100.00, 0.00, 0.08, 0.10, 0.25, 5.0, 0.50, 3.39, 1e-2),
            new HaugMertonData(Option.Type.Call, 100.00, 100.00, 0.00, 0.08, 0.25, 0.25, 5.0, 0.50, 5.87, 1e-2),
            new HaugMertonData(Option.Type.Call, 100.00, 100.00, 0.00, 0.08, 0.50, 0.25, 5.0, 0.50, 8.96, 1e-2),
            new HaugMertonData(Option.Type.Call, 100.00, 100.00, 0.00, 0.08, 0.10, 0.25, 10.0, 0.50, 3.46, 1e-2),
            new HaugMertonData(Option.Type.Call, 100.00, 100.00, 0.00, 0.08, 0.25, 0.25, 10.0, 0.50, 5.93, 1e-2),
            new HaugMertonData(Option.Type.Call, 100.00, 100.00, 0.00, 0.08, 0.50, 0.25, 10.0, 0.50, 9.00, 1e-2),
            new HaugMertonData(Option.Type.Call, 110.00, 100.00, 0.00, 0.08, 0.10, 0.25, 1.0, 0.50, 0.53, 1e-2),
            new HaugMertonData(Option.Type.Call, 110.00, 100.00, 0.00, 0.08, 0.25, 0.25, 1.0, 0.50, 1.93, 1e-2),
            new HaugMertonData(Option.Type.Call, 110.00, 100.00, 0.00, 0.08, 0.50, 0.25, 1.0, 0.50, 4.42, 1e-2),
            new HaugMertonData(Option.Type.Call, 110.00, 100.00, 0.00, 0.08, 0.10, 0.25, 5.0, 0.50, 0.58, 1e-2),
            new HaugMertonData(Option.Type.Call, 110.00, 100.00, 0.00, 0.08, 0.25, 0.25, 5.0, 0.50, 2.11, 1e-2),
            new HaugMertonData(Option.Type.Call, 110.00, 100.00, 0.00, 0.08, 0.50, 0.25, 5.0, 0.50, 4.67, 1e-2),
            new HaugMertonData(Option.Type.Call, 110.00, 100.00, 0.00, 0.08, 0.10, 0.25, 10.0, 0.50, 0.57, 1e-2),
            new HaugMertonData(Option.Type.Call, 110.00, 100.00, 0.00, 0.08, 0.25, 0.25, 10.0, 0.50, 2.14, 1e-2),
            new HaugMertonData(Option.Type.Call, 110.00, 100.00, 0.00, 0.08, 0.50, 0.25, 10.0, 0.50, 4.71, 1e-2),
            new HaugMertonData(Option.Type.Call, 120.00, 100.00, 0.00, 0.08, 0.10, 0.25, 1.0, 0.50, 0.19, 1e-2),
            new HaugMertonData(Option.Type.Call, 120.00, 100.00, 0.00, 0.08, 0.25, 0.25, 1.0, 0.50, 0.71, 1e-2),
            new HaugMertonData(Option.Type.Call, 120.00, 100.00, 0.00, 0.08, 0.50, 0.25, 1.0, 0.50, 2.15, 1e-2),
            new HaugMertonData(Option.Type.Call, 120.00, 100.00, 0.00, 0.08, 0.10, 0.25, 5.0, 0.50, 0.10, 1e-2),
            new HaugMertonData(Option.Type.Call, 120.00, 100.00, 0.00, 0.08, 0.25, 0.25, 5.0, 0.50, 0.66, 1e-2),
            new HaugMertonData(Option.Type.Call, 120.00, 100.00, 0.00, 0.08, 0.50, 0.25, 5.0, 0.50, 2.23, 1e-2),
            new HaugMertonData(Option.Type.Call, 120.00, 100.00, 0.00, 0.08, 0.10, 0.25, 10.0, 0.50, 0.07, 1e-2),
            new HaugMertonData(Option.Type.Call, 120.00, 100.00, 0.00, 0.08, 0.25, 0.25, 10.0, 0.50, 0.64, 1e-2),
            new HaugMertonData(Option.Type.Call, 120.00, 100.00, 0.00, 0.08, 0.50, 0.25, 10.0, 0.50, 2.24, 1e-2),
            new HaugMertonData(Option.Type.Call, 80.00, 100.00, 0.00, 0.08, 0.10, 0.25, 1.0, 0.75, 20.79, 1e-2),
            new HaugMertonData(Option.Type.Call, 80.00, 100.00, 0.00, 0.08, 0.25, 0.25, 1.0, 0.75, 21.96, 1e-2),
            new HaugMertonData(Option.Type.Call, 80.00, 100.00, 0.00, 0.08, 0.50, 0.25, 1.0, 0.75, 23.86, 1e-2),
            new HaugMertonData(Option.Type.Call, 80.00, 100.00, 0.00, 0.08, 0.10, 0.25, 5.0, 0.75, 20.68, 1e-2),
            new HaugMertonData(Option.Type.Call, 80.00, 100.00, 0.00, 0.08, 0.25, 0.25, 5.0, 0.75, 21.78, 1e-2),
            new HaugMertonData(Option.Type.Call, 80.00, 100.00, 0.00, 0.08, 0.50, 0.25, 5.0, 0.75, 23.67, 1e-2),
            new HaugMertonData(Option.Type.Call, 80.00, 100.00, 0.00, 0.08, 0.10, 0.25, 10.0, 0.75, 20.66, 1e-2),
            new HaugMertonData(Option.Type.Call, 80.00, 100.00, 0.00, 0.08, 0.25, 0.25, 10.0, 0.75, 21.74, 1e-2),
            new HaugMertonData(Option.Type.Call, 80.00, 100.00, 0.00, 0.08, 0.50, 0.25, 10.0, 0.75, 23.64, 1e-2),
            new HaugMertonData(Option.Type.Call, 90.00, 100.00, 0.00, 0.08, 0.10, 0.25, 1.0, 0.75, 11.11, 1e-2),
            new HaugMertonData(Option.Type.Call, 90.00, 100.00, 0.00, 0.08, 0.25, 0.25, 1.0, 0.75, 12.75, 1e-2),
            new HaugMertonData(Option.Type.Call, 90.00, 100.00, 0.00, 0.08, 0.50, 0.25, 1.0, 0.75, 15.30, 1e-2),
            new HaugMertonData(Option.Type.Call, 90.00, 100.00, 0.00, 0.08, 0.10, 0.25, 5.0, 0.75, 11.09, 1e-2),
            new HaugMertonData(Option.Type.Call, 90.00, 100.00, 0.00, 0.08, 0.25, 0.25, 5.0, 0.75, 12.78, 1e-2),
            new HaugMertonData(Option.Type.Call, 90.00, 100.00, 0.00, 0.08, 0.50, 0.25, 5.0, 0.75, 15.39, 1e-2),
            new HaugMertonData(Option.Type.Call, 90.00, 100.00, 0.00, 0.08, 0.10, 0.25, 10.0, 0.75, 11.04, 1e-2),
            new HaugMertonData(Option.Type.Call, 90.00, 100.00, 0.00, 0.08, 0.25, 0.25, 10.0, 0.75, 12.76, 1e-2),
            new HaugMertonData(Option.Type.Call, 90.00, 100.00, 0.00, 0.08, 0.50, 0.25, 10.0, 0.75, 15.40, 1e-2),
            new HaugMertonData(Option.Type.Call, 100.00, 100.00, 0.00, 0.08, 0.10, 0.25, 1.0, 0.75, 2.70, 1e-2),
            new HaugMertonData(Option.Type.Call, 100.00, 100.00, 0.00, 0.08, 0.25, 0.25, 1.0, 0.75, 5.08, 1e-2),
            new HaugMertonData(Option.Type.Call, 100.00, 100.00, 0.00, 0.08, 0.50, 0.25, 1.0, 0.75, 8.24, 1e-2),
            new HaugMertonData(Option.Type.Call, 100.00, 100.00, 0.00, 0.08, 0.10, 0.25, 5.0, 0.75, 3.16, 1e-2),
            new HaugMertonData(Option.Type.Call, 100.00, 100.00, 0.00, 0.08, 0.25, 0.25, 5.0, 0.75, 5.71, 1e-2),
            new HaugMertonData(Option.Type.Call, 100.00, 100.00, 0.00, 0.08, 0.50, 0.25, 5.0, 0.75, 8.85, 1e-2),
            new HaugMertonData(Option.Type.Call, 100.00, 100.00, 0.00, 0.08, 0.10, 0.25, 10.0, 0.75, 3.33, 1e-2),
            new HaugMertonData(Option.Type.Call, 100.00, 100.00, 0.00, 0.08, 0.25, 0.25, 10.0, 0.75, 5.85, 1e-2),
            new HaugMertonData(Option.Type.Call, 100.00, 100.00, 0.00, 0.08, 0.50, 0.25, 10.0, 0.75, 8.95, 1e-2),
            new HaugMertonData(Option.Type.Call, 110.00, 100.00, 0.00, 0.08, 0.10, 0.25, 1.0, 0.75, 0.54, 1e-2),
            new HaugMertonData(Option.Type.Call, 110.00, 100.00, 0.00, 0.08, 0.25, 0.25, 1.0, 0.75, 1.69, 1e-2),
            new HaugMertonData(Option.Type.Call, 110.00, 100.00, 0.00, 0.08, 0.50, 0.25, 1.0, 0.75, 3.99, 1e-2),
            new HaugMertonData(Option.Type.Call, 110.00, 100.00, 0.00, 0.08, 0.10, 0.25, 5.0, 0.75, 0.62, 1e-2),
            new HaugMertonData(Option.Type.Call, 110.00, 100.00, 0.00, 0.08, 0.25, 0.25, 5.0, 0.75, 2.05, 1e-2),
            new HaugMertonData(Option.Type.Call, 110.00, 100.00, 0.00, 0.08, 0.50, 0.25, 5.0, 0.75, 4.57, 1e-2),
            new HaugMertonData(Option.Type.Call, 110.00, 100.00, 0.00, 0.08, 0.10, 0.25, 10.0, 0.75, 0.60, 1e-2),
            new HaugMertonData(Option.Type.Call, 110.00, 100.00, 0.00, 0.08, 0.25, 0.25, 10.0, 0.75, 2.11, 1e-2),
            new HaugMertonData(Option.Type.Call, 110.00, 100.00, 0.00, 0.08, 0.50, 0.25, 10.0, 0.75, 4.66, 1e-2),
            new HaugMertonData(Option.Type.Call, 120.00, 100.00, 0.00, 0.08, 0.10, 0.25, 1.0, 0.75, 0.29, 1e-2),
            new HaugMertonData(Option.Type.Call, 120.00, 100.00, 0.00, 0.08, 0.25, 0.25, 1.0, 0.75, 0.84, 1e-2),
            new HaugMertonData(Option.Type.Call, 120.00, 100.00, 0.00, 0.08, 0.50, 0.25, 1.0, 0.75, 2.09, 1e-2),
            new HaugMertonData(Option.Type.Call, 120.00, 100.00, 0.00, 0.08, 0.10, 0.25, 5.0, 0.75, 0.15, 1e-2),
            new HaugMertonData(Option.Type.Call, 120.00, 100.00, 0.00, 0.08, 0.25, 0.25, 5.0, 0.75, 0.71, 1e-2),
            new HaugMertonData(Option.Type.Call, 120.00, 100.00, 0.00, 0.08, 0.50, 0.25, 5.0, 0.75, 2.21, 1e-2),
            new HaugMertonData(Option.Type.Call, 120.00, 100.00, 0.00, 0.08, 0.10, 0.25, 10.0, 0.75, 0.11, 1e-2),
            new HaugMertonData(Option.Type.Call, 120.00, 100.00, 0.00, 0.08, 0.25, 0.25, 10.0, 0.75, 0.67, 1e-2),
            new HaugMertonData(Option.Type.Call, 120.00, 100.00, 0.00, 0.08, 0.50, 0.25, 10.0, 0.75, 2.23, 1e-2)
        ];
        const dc = new Actual360();
        const today = new Date();
        const spot = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.0);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.0);
        const rTS = flatRate1(today, rRate, dc);
        const vol = new SimpleQuote(0.0);
        const volTS = flatVol1(today, vol, dc);
        const jumpIntensity = new SimpleQuote(0.0);
        const meanLogJump = new SimpleQuote(0.0);
        const jumpVol = new SimpleQuote(0.0);
        const stochProcess = new Merton76Process(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS), new Handle(jumpIntensity), new Handle(meanLogJump), new Handle(jumpVol));
        const engine = new JumpDiffusionEngine(stochProcess);
        for (let i = 0; i < values.length; i++) {
            const payoff = new PlainVanillaPayoff(values[i].type, values[i].strike);
            const exDate = DateExt.add(today, Math.floor(values[i].t * 360 + 0.5));
            const exercise = new EuropeanExercise(exDate);
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            jumpIntensity.setValue(values[i].jumpIntensity);
            const jVol = values[i].v * Math.sqrt(values[i].gamma / values[i].jumpIntensity);
            jumpVol.setValue(jVol);
            const diffusionVol = values[i].v * Math.sqrt(1.0 - values[i].gamma);
            vol.setValue(diffusionVol);
            const meanJump = 0.0;
            meanLogJump.setValue(Math.log(1.0 + meanJump) - 0.5 * jVol * jVol);
            const totalVol = Math.sqrt(values[i].jumpIntensity * jVol * jVol + diffusionVol * diffusionVol);
            const volError = Math.abs(totalVol - values[i].v);
            if (volError >= 1e-13) {
                throw new Error(`${volError} mismatch`);
            }
            const option = new EuropeanOption(payoff, exercise);
            option.setPricingEngine(engine);
            const calculated = option.NPV();
            const error = Math.abs(calculated - values[i].result);
            expect(error).toBeLessThan(values[i].tol);
        }
    });
});