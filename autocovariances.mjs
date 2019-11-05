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
import { Array1D, autocorrelations2, autocovariances2, convolutions, Complex, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

describe(`auto-covariance tests ${version}`, () => {
    it('Testing convolutions...', () => {
        const x = new Array(10);
        for (let i = 0; i < 10; i++) {
            x[i] = new Complex(i + 1, 0);
        }
        const conv = new Array(6);
        convolutions(x, 0, x.length, conv, 5);
        const expected = [385, 330, 276, 224, 175, 130];
        const delta = Array1D.sub(conv, expected);
        expect(Array1D.DotProduct(delta, delta)).toBeLessThan(1.0e-6);
    });

    it('Testing auto-covariances...', () => {
        const x = new Array(10);
        for (let i = 0; i < 10; i++) {
            x[i] = new Complex(i + 1, 0);
        }
        const acovf = new Array(6);
        const mean = autocovariances2(x, 0, x.length, acovf, 5, false);
        const expected = [8.25, 6.416667, 4.25, 1.75, -1.08333, -4.25];
        expect(Math.abs(mean - 5.5)).toBeLessThan(1.0e-6);
        const delta = Array1D.sub(acovf, expected);
        expect(Array1D.DotProduct(delta, delta)).toBeLessThan(1.0e-6);
    });
    
    it('Testing auto-correlations...', () => {
        const x = new Array(10);
        for (let i = 0; i < 10; i++) {
            x[i] = new Complex(i + 1, 0);
        }
        const acorf = new Array(6);
        const mean = autocorrelations2(x, 0, x.length, acorf, 5, false);
        const expected = [
            9.166667, 0.77777778, 0.51515152, 0.21212121, -0.13131313, -0.51515152
        ];
        expect(Math.abs(mean - 5.5)).toBeLessThan(1.0e-6);
        const delta = Array1D.sub(acorf, expected);
        expect(Array1D.DotProduct(delta, delta)).toBeLessThan(1.0e-6);
    });
});