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
import { Array1D, constant, identity, InverseCumulativeNormal, InverseCumulativeRng, LinearRegression, MersenneTwisterUniformRng, SavedSettings, square, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

function f(a, i) {
    return a[i];
}

describe(`Linear least squares regression tests ${version}`, () => {
    it('Testing linear least-squares regression...', () => {
        const backup = new SavedSettings();
        const tolerance = 0.05;
        const nr = 100000;
        const rng = new InverseCumulativeRng(new MersenneTwisterUniformRng().init1(1234), new InverseCumulativeNormal());
        const v = [];
        v.push(new constant(1.0));
        v.push(new identity());
        v.push(new square());
        v.push({ f: Math.sin });
        const w = Array.from(v);
        w.push(new square());
        for (let k = 0; k < 3; ++k) {
            let i;
            const a = [
                rng.next().value, rng.next().value, rng.next().value, rng.next().value
            ];
            const x = new Array(nr), y = new Array(nr);
            for (i = 0; i < nr; ++i) {
                x[i] = rng.next().value;
                y[i] = a[0] * v[0].f(x[i]) + a[1] * v[1].f(x[i]) + a[2] * v[2].f(x[i]) +
                    a[3] * v[3].f(x[i]) + rng.next().value;
            }
            let m = new LinearRegression(x, y).lrInit2(v);
            for (i = 0; i < v.length; ++i) {
                expect(m.standardErrors()[i]).toBeLessThan(tolerance);
                expect(Math.abs(m.coefficients()[i] - a[i]))
                    .toBeLessThan(3 * m.standardErrors()[i]);
            }
            m = new LinearRegression(x, y).lrInit2(w);
            const ma = [
                m.coefficients()[0], m.coefficients()[1],
                m.coefficients()[2] + m.coefficients()[4], m.coefficients()[3]
            ];
            const err = [
                m.standardErrors()[0], m.standardErrors()[1],
                Math.sqrt(m.standardErrors()[2] * m.standardErrors()[2] +
                    m.standardErrors()[4] * m.standardErrors()[4]),
                m.standardErrors()[3]
            ];
            for (i = 0; i < v.length; ++i) {
                expect(Math.abs(ma[i] - a[i])).toBeLessThan(3 * err[i]);
            }
        }
        backup.dispose();
    });

    it('Testing multi-dimensional linear least-squares regression...', () => {
        const backup = new SavedSettings();
        const nr = 100000;
        const dims = 4;
        const tolerance = 0.01;
        const rng = new InverseCumulativeRng(new MersenneTwisterUniformRng().init1(1234), new InverseCumulativeNormal());
        const v = [];
        v.push(new constant(1.0));
        for (let i = 0; i < dims; ++i) {
            v.push({
                f: (x) => {
                    return f(x, i);
                }
            });
        }
        const coeff = new Array(v.length);
        for (let i = 0; i < v.length; ++i) {
            coeff[i] = rng.next().value;
        }
        const y = Array1D.fromSizeValue(nr, 0.0);
        const x = new Array(nr);
        for (let i = 0; i < x.length; i++) {
            x[i] = new Array(dims);
        }
        for (let i = 0; i < nr; ++i) {
            for (let j = 0; j < dims; ++j) {
                x[i][j] = rng.next().value;
            }
            for (let j = 0; j < v.length; ++j) {
                y[i] += coeff[j] * v[j].f(x[i]);
            }
            y[i] += rng.next().value;
        }
        const m = new LinearRegression(x, y).lrInit2(v);
        for (let i = 0; i < v.length; ++i) {
            expect(m.standardErrors()[i]).toBeLessThan(tolerance);
            expect(Math.abs(m.coefficients()[i] - coeff[i]))
                .toBeLessThan(3 * tolerance);
        }
        const m1 = new LinearRegression(x, y).lrInit1(1.0);
        for (let i = 0; i < m1.dim(); ++i) {
            expect(m1.standardErrors()[i]).toBeLessThan(tolerance);
            expect(Math.abs(m1.coefficients()[i] - coeff[i]))
                .toBeLessThan(3 * tolerance);
        }
        backup.dispose();
    });

    it('Testing 1D simple linear least-squares regression...', () => {
        const backup = new SavedSettings();
        const x = new Array(9), y = new Array(9);
        x[0] = 2.4;
        x[1] = 1.8;
        x[2] = 2.5;
        x[3] = 3.0;
        x[4] = 2.1;
        x[5] = 1.2;
        x[6] = 2.0;
        x[7] = 2.7;
        x[8] = 3.6;
        y[0] = 7.8;
        y[1] = 5.5;
        y[2] = 8.0;
        y[3] = 9.0;
        y[4] = 6.5;
        y[5] = 4.0;
        y[6] = 6.3;
        y[7] = 8.4;
        y[8] = 10.2;
        const v = [];
        v.push(new constant(1.0));
        v.push(new identity());
        const m = new LinearRegression(x, y).lrInit1();
        const tol = 0.0002;
        const coeffExpected = [0.9448, 2.6853];
        const errorsExpected = [0.3654, 0.1487];
        for (let i = 0; i < 2; ++i) {
            expect(Math.abs(m.standardErrors()[i] - errorsExpected[i]))
                .toBeLessThan(tol);
            expect(Math.abs(m.coefficients()[i] - coeffExpected[i]))
                .toBeLessThan(tol);
        }
        const cx = Array.from(x), cy = Array.from(y);
        const m1 = new LinearRegression(cx, cy).lrInit1();
        for (let i = 0; i < 2; ++i) {
            expect(Math.abs(m1.standardErrors()[i] - errorsExpected[i]))
                .toBeLessThan(tol);
            expect(Math.abs(m1.coefficients()[i] - coeffExpected[i]))
                .toBeLessThan(tol);
        }
        backup.dispose();
    });
});
