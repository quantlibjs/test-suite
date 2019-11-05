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
import { Array1D, Array2D, CovarianceDecomposition, getCovariance, pseudoSqrt, rankReducedSqrt, SalvagingAlgorithm, SequenceStatistics, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

function norm(m) {
    let sum = 0.0;
    for (let i = 0; i < Array2D.rows(m); i++) {
        for (let j = 0; j < Array2D.columns(m); j++) {
            sum += m[i][j] * m[i][j];
        }
    }
    return Math.sqrt(sum);
}

describe(`Covariance and correlation tests ${version}`, () => {

    it('Testing matrix rank reduction salvaging algorithms...', () => {
        let expected, calculated;
        const n = 3;
        const badCorr = [[1.0, 0.9, 0.7], [0.9, 1.0, 0.3], [0.7, 0.3, 1.0]];
        const goodCorr = [
            [1.00000000000, 0.894024408508599, 0.696319066114392],
            [0.894024408508599, 1.00000000000, 0.300969036104592],
            [0.696319066114392, 0.300969036104592, 1.00000000000]
        ];
        let b = rankReducedSqrt(badCorr, 3, 1.0, SalvagingAlgorithm.Type.Spectral);
        const calcCorr = Array2D.mul(b, Array2D.transpose(b));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                expected = goodCorr[i][j];
                calculated = calcCorr[i][j];
                expect(Math.abs(calculated - expected)).toBeLessThan(1.0e-10);
            }
        }
        const badCov = [
            [0.04000, 0.03240, 0.02240], [0.03240, 0.03240, 0.00864],
            [0.02240, 0.00864, 0.02560]
        ];
        b = pseudoSqrt(badCov, SalvagingAlgorithm.Type.Spectral);
        b = rankReducedSqrt(badCov, 3, 1.0, SalvagingAlgorithm.Type.Spectral);
        const goodCov = Array2D.mul(b, Array2D.transpose(b));
        const error = norm(Array2D.sub(goodCov, badCov));
        expect(error).toBeLessThan(4.0e-4);
    });

    it('Testing positive semi-definiteness salvaging algorithms...', () => {
        let expected, calculated;
        const n = 3;
        const badCorr = Array2D.newMatrix(n, n);
        badCorr[0][0] = 1.0;
        badCorr[0][1] = 0.9;
        badCorr[0][2] = 0.7;
        badCorr[1][0] = 0.9;
        badCorr[1][1] = 1.0;
        badCorr[1][2] = 0.3;
        badCorr[2][0] = 0.7;
        badCorr[2][1] = 0.3;
        badCorr[2][2] = 1.0;
        const goodCorr = Array2D.newMatrix(n, n);
        goodCorr[0][0] = goodCorr[1][1] = goodCorr[2][2] = 1.00000000000;
        goodCorr[0][1] = goodCorr[1][0] = 0.894024408508599;
        goodCorr[0][2] = goodCorr[2][0] = 0.696319066114392;
        goodCorr[1][2] = goodCorr[2][1] = 0.300969036104592;
        let b = pseudoSqrt(badCorr, SalvagingAlgorithm.Type.Spectral);
        const calcCorr = Array2D.mul(b, Array2D.transpose(b));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                expected = goodCorr[i][j];
                calculated = calcCorr[i][j];
                expect(Math.abs(calculated - expected)).toBeLessThan(1.0e-10);
            }
        }
        const badCov = Array2D.newMatrix(n, n);
        badCov[0][0] = 0.04000;
        badCov[0][1] = 0.03240;
        badCov[0][2] = 0.02240;
        badCov[1][0] = 0.03240;
        badCov[1][1] = 0.03240;
        badCov[1][2] = 0.00864;
        badCov[2][0] = 0.02240;
        badCov[2][1] = 0.00864;
        badCov[2][2] = 0.02560;
        b = pseudoSqrt(badCov, SalvagingAlgorithm.Type.Spectral);
        const goodCov = Array2D.mul(b, Array2D.transpose(b));
        const error = norm(Array2D.sub(goodCov, badCov));
        expect(error).toBeLessThan(4.0e-4);
    });

    it('Testing covariance and correlation calculations...', () => {
        const data00 = [3.0, 9.0];
        const data01 = [2.0, 7.0];
        const data02 = [4.0, 12.0];
        const data03 = [5.0, 15.0];
        const data04 = [6.0, 17.0];
        const data = [data00, data01, data02, data03, data04];
        const weights = Array1D.fromSizeValue(data.length, 1.0);
        let i, j;
        const n = data00.length;
        const expCor = Array2D.newMatrix(n, n);
        expCor[0][0] = 1.0000000000000000;
        expCor[0][1] = 0.9970544855015813;
        expCor[1][0] = 0.9970544855015813;
        expCor[1][1] = 1.0000000000000000;
        const s = new SequenceStatistics(n);
        const temp = new Array(n);
        for (i = 0; i < data.length; i++) {
            for (j = 0; j < n; j++) {
                temp[j] = data[i][j];
            }
            s.add(Array.from(temp), weights[i]);
        }
        const std = Array.from(s.standardDeviation());
        let calcCov = Array.from(s.covariance());
        let calcCor = Array.from(s.correlation());
        const expCov = Array2D.newMatrix(n, n);
        for (i = 0; i < n; i++) {
            expCov[i][i] = std[i] * std[i];
            for (j = 0; j < i; j++) {
                expCov[i][j] = expCov[j][i] = expCor[i][j] * std[i] * std[j];
            }
        }
        let expected, calculated;
        for (i = 0; i < n; i++) {
            for (j = 0; j < n; j++) {
                expected = expCor[i][j];
                calculated = calcCor[i][j];
                expect(Math.abs(calculated - expected)).toBeLessThan(1.0e-10);
                expected = expCov[i][j];
                calculated = calcCov[i][j];
                expect(Math.abs(calculated - expected)).toBeLessThan(1.0e-10);
            }
        }
        calcCov = getCovariance(std, 0, std.length, expCor);
        for (i = 0; i < n; i++) {
            for (j = 0; j < n; j++) {
                const calculated = calcCov[i][j], expected = expCov[i][j];
                expect(Math.abs(calculated - expected)).toBeLessThan(1.0e-10);
            }
        }
        const covDecomposition = new CovarianceDecomposition(expCov);
        calcCor = covDecomposition.correlationMatrix();
        const calcStd = covDecomposition.standardDeviations();
        for (i = 0; i < n; i++) {
            calculated = calcStd[i];
            expected = std[i];
            expect(Math.abs(calculated - expected)).toBeLessThan(1.0e-16);
            for (j = 0; j < n; j++) {
                calculated = calcCor[i][j];
                expected = expCor[i][j];
                expect(Math.abs(calculated - expected)).toBeLessThan(1.0e-14);
            }
        }
    });
});