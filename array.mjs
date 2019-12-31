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
import { Array1D, QL_EPSILON, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

function p2(x) {
    return x * x;
}

describe(`Array tests ${version}`, () => {

    it('Testing array construction...', () => {
        const a1 = new Array();
        expect(Array1D.empty(a1)).toEqual(true);
        const size = 5;
        const a2 = new Array(size);
        expect(Array1D.size(a2)).toEqual(size);
        const value = 42.0;
        const a3 = Array1D.fromSizeValue(size, value);
        expect(Array1D.size(a3)).toEqual(size);
        let i;
        for (i = 0; i < size; ++i) {
            expect(a3[i]).toEqual(value);
        }
        const increment = 3.0;
        const a4 = Array1D.fromSizeValueIncrement(size, value, increment);
        expect(Array1D.size(a4)).toEqual(size);
        for (i = 0; i < size; i++) {
            expect(a4[i]).toEqual(value + i * increment);
        }
        const a5 = Array1D.clone(a1);
        expect(Array1D.size(a5)).toEqual(Array1D.size(a1));
        const a6 = Array1D.clone(a3);
        expect(Array1D.size(a6)).toEqual(Array1D.size(a3));
        for (i = 0; i < Array1D.size(a3); i++) {
            expect(a6[i]).toEqual(a3[i]);
        }
        const a10 = Array1D.fromSizeValueIncrement(5, 0, 1);
        const result = a10.map(p2);
        for (i = 0; i < Array1D.size(result); i++) {
            const calculated = p2(i);
            expect(Math.abs(result[i] - calculated)).toBeLessThan(1e-5);
        }
    });

    it('Testing array functions...', () => {
        const a = new Array(5);
        for (let i = 0; i < Array1D.size(a); ++i) {
            a[i] = Math.sin(i) + 1.1;
        }
        const exponential = -2.3;
        const p = Array1D.Pow(a, exponential);
        const e = Array1D.Exp(a);
        const l = Array1D.Log(a);
        const s = Array1D.Sqrt(a);
        const tol = 10 * QL_EPSILON;
        for (let i = 0; i < Array1D.size(a); ++i) {
            expect(Math.abs(p[i] - Math.pow(a[i], exponential))).toBeLessThan(tol);
            expect(Math.abs(e[i] - Math.exp(a[i]))).toBeLessThan(tol);
            expect(Math.abs(l[i] - Math.log(a[i]))).toBeLessThan(tol);
            expect(Math.abs(s[i] - Math.sqrt(a[i]))).toBeLessThan(tol);
        }
    });
});
