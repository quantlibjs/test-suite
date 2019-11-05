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
import { Array1D, TqrEigenDecomposition, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

const tolerance = 1.0e-10;

describe(`TQR eigendecomposition tests ${version}`, () => {
    it('Testing TQR eigenvalue decomposition...', () => {
        const diag = [11, 7, 6, 2, 0];
        const sub = Array1D.fromSizeValue(4, 1);
        const ev = [
            11.2467832217139119, 7.4854967362908535, 5.5251516080277518,
            2.1811760273123308, -0.4386075933448487
        ];
        const tqre = new TqrEigenDecomposition(diag, sub, TqrEigenDecomposition.EigenVectorCalculation.WithoutEigenVector);
        for (let i = 0; i < diag.length; ++i) {
            const expected = ev[i];
            const calculated = tqre.eigenvalues()[i];
            expect(Math.abs(expected - calculated)).toBeLessThan(tolerance);
        }
    });
    it('Testing TQR zero-off-diagonal eigenvalues...', () => {
        const diag = [12, 9, 6, 3, 0];
        const sub = Array1D.fromSizeValue(4, 1);
        sub[0] = sub[2] = 0;
        const tqre1 = new TqrEigenDecomposition(diag, sub);
        sub[0] = sub[2] = 1e-14;
        const tqre2 = new TqrEigenDecomposition(diag, sub);
        for (let i = 0; i < diag.length; ++i) {
            const expected = tqre2.eigenvalues()[i];
            const calculated = tqre1.eigenvalues()[i];
            expect(Math.abs(expected - calculated)).toBeLessThan(tolerance);
        }
    });
    it('Testing TQR eigenvector decomposition...', () => {
        const diag = Array1D.fromSizeValue(2, 1);
        const sub = Array1D.fromSizeValue(1, 1);
        const tqre = new TqrEigenDecomposition(diag, sub);
        expect(Math.abs(0.25 +
            tqre.eigenvectors()[0][0] * tqre.eigenvectors()[0][1] *
                tqre.eigenvectors()[1][0] * tqre.eigenvectors()[1][1]))
            .toBeLessThan(tolerance);
    });
});