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
import { Array1D, Array2D, BiCGstab, CholeskyDecomposition, GMRES, MersenneTwisterUniformRng, moorePenroseInverse, OrthogonalProjections, pseudoSqrt, QL_EPSILON, QL_MAX_REAL, qrDecomposition, qrSolve, SalvagingAlgorithm, SVD, SymmetricSchurDecomposition, det, inv, std, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

let N;
let M1, M2, M3, M4, M5, M6, M7, I;

function norm1(v) {
    return Math.sqrt(Array1D.DotProduct(v, v));
}

function norm2(m) {
    let sum = 0.0;
    for (let i = 0; i < Array2D.rows(m); i++) {
        for (let j = 0; j < Array2D.columns(m); j++) {
            sum += m[i][j] * m[i][j];
        }
    }
    return Math.sqrt(sum);
}

function setup() {
    N = 3;
    M1 = Array2D.newMatrix(N, N);
    M2 = Array2D.newMatrix(N, N);
    I = Array2D.newMatrix(N, N);
    M3 = Array2D.newMatrix(3, 4);
    M4 = Array2D.newMatrix(4, 3);
    M5 = Array2D.newMatrix(4, 4, 0.0);
    M6 = Array2D.newMatrix(4, 4, 0.0);
    M1[0][0] = 1.0;
    M1[0][1] = 0.9;
    M1[0][2] = 0.7;
    M1[1][0] = 0.9;
    M1[1][1] = 1.0;
    M1[1][2] = 0.4;
    M1[2][0] = 0.7;
    M1[2][1] = 0.4;
    M1[2][2] = 1.0;
    M2[0][0] = 1.0;
    M2[0][1] = 0.9;
    M2[0][2] = 0.7;
    M2[1][0] = 0.9;
    M2[1][1] = 1.0;
    M2[1][2] = 0.3;
    M2[2][0] = 0.7;
    M2[2][1] = 0.3;
    M2[2][2] = 1.0;
    I[0][0] = 1.0;
    I[0][1] = 0.0;
    I[0][2] = 0.0;
    I[1][0] = 0.0;
    I[1][1] = 1.0;
    I[1][2] = 0.0;
    I[2][0] = 0.0;
    I[2][1] = 0.0;
    I[2][2] = 1.0;
    M3[0][0] = 1;
    M3[0][1] = 2;
    M3[0][2] = 3;
    M3[0][3] = 4;
    M3[1][0] = 2;
    M3[1][1] = 0;
    M3[1][2] = 2;
    M3[1][3] = 1;
    M3[2][0] = 0;
    M3[2][1] = 1;
    M3[2][2] = 0;
    M3[2][3] = 0;
    M4[0][0] = 1;
    M4[0][1] = 2;
    M4[0][2] = 400;
    M4[1][0] = 2;
    M4[1][1] = 0;
    M4[1][2] = 1;
    M4[2][0] = 30;
    M4[2][1] = 2;
    M4[2][2] = 0;
    M4[3][0] = 2;
    M4[3][1] = 0;
    M4[3][2] = 1.05;
    M5[0][0] = 2;
    M5[0][1] = -1;
    M5[0][2] = 0.0;
    M5[0][3] = 0.0;
    M5[1][0] = M5[0][1];
    M5[1][1] = 2;
    M5[1][2] = -1;
    M5[1][3] = 0.0;
    M5[2][0] = M5[0][2];
    M5[2][1] = M5[1][2];
    M5[2][2] = 2;
    M5[2][3] = -1;
    M5[3][0] = M5[0][3];
    M5[3][1] = M5[1][3];
    M5[3][2] = M5[2][3];
    M5[3][3] = 2;
    M6[0][0] = 1;
    M6[0][1] = -0.8084124981;
    M6[0][2] = 0.1915875019;
    M6[0][3] = 0.106775049;
    M6[1][0] = M6[0][1];
    M6[1][1] = 1;
    M6[1][2] = -0.6562326948;
    M6[1][3] = M6[0][2];
    M6[2][0] = M6[0][2];
    M6[2][1] = M6[1][2];
    M6[2][2] = 1;
    M6[2][3] = M6[0][1];
    M6[3][0] = M6[0][3];
    M6[3][1] = M6[1][3];
    M6[3][2] = M6[2][3];
    M6[3][3] = 1;
    M7 = Array2D.from(M1);
    M7[0][1] = 0.3;
    M7[0][2] = 0.2;
    M7[2][1] = 1.2;
}

class MatrixMult {
    constructor(m) {
        this._m = Array2D.from(m);
    }
    f(x) {
        const retVal = Array2D.mulVector(this._m, x);
        return retVal;
    }
}

function norm3(x) {
    return Math.sqrt(Array1D.DotProduct(x, x));
}

describe(`Matrix tests ${version}`, () => {
    it('Testing eigenvalues and eigenvectors calculation...', () => {
        setup();
        const testMatrices = [M1, M2];
        for (let k = 0; k < testMatrices.length; k++) {
            const M = testMatrices[k];
            const dec = new SymmetricSchurDecomposition(M);
            const eigenValues = dec.eigenvalues();
            const eigenVectors = dec.eigenvectors();
            let minHolder = QL_MAX_REAL;
            for (let i = 0; i < N; i++) {
                const v = new Array(N);
                for (let j = 0; j < N; j++) {
                    v[j] = eigenVectors[j][i];
                }
                const a = Array2D.mulVector(M, v);
                const b = Array1D.mulScalar(v, eigenValues[i]);
                expect(norm1(Array1D.sub(a, b))).toBeLessThan(1.0e-15);
                if (eigenValues[i] >= minHolder) {
                    throw new Error('Eigenvector definition not satisfied');
                }
                else {
                    minHolder = eigenValues[i];
                }
            }
            const m = Array2D.mul(Array2D.transpose(eigenVectors), eigenVectors);
            expect(norm2(Array2D.sub(m, I))).toBeLessThan(1.0e-15);
        }
    });

    it('Testing matricial square root...', () => {
        setup();
        const m = pseudoSqrt(M1, SalvagingAlgorithm.Type.None);
        const temp = Array2D.mul(m, Array2D.transpose(m));
        const error = norm2(Array2D.sub(temp, M1));
        const tolerance = 1.0e-12;
        expect(error).toBeLessThan(tolerance);
    });

    it('Testing Higham matricial square root...', () => {
        setup();
        const tempSqrt = pseudoSqrt(M5, SalvagingAlgorithm.Type.Higham);
        const ansSqrt = pseudoSqrt(M6, SalvagingAlgorithm.Type.None);
        const error = norm2(Array2D.sub(ansSqrt, tempSqrt));
        const tolerance = 1.0e-4;
        expect(error).toBeLessThan(tolerance);
    });

    it('Testing singular value decomposition...', () => {
        setup();
        const tol = 1.0e-12;
        const testMatrices = [M1, M2, M3, M4];
        for (let j = 0; j < testMatrices.length; j++) {
            const A = testMatrices[j];
            const svd = new SVD(A);
            const U = svd.U();
            const s = svd.singularValues();
            const S = svd.S();
            const V = svd.V();
            for (let i = 0; i < Array2D.rows(S); i++) {
                expect(S[i][i]).toEqual(s[i]);
            }
            const U_Utranspose = Array2D.mul(Array2D.transpose(U), U);
            expect(norm2(Array2D.sub(U_Utranspose, I))).toBeLessThan(tol);
            const V_Vtranspose = Array2D.mul(Array2D.transpose(V), V);
            expect(norm2(Array2D.sub(V_Vtranspose, I))).toBeLessThan(tol);
            const A_reconstructed = Array2D.mul(Array2D.mul(U, S), Array2D.transpose(V));
            expect(norm2(Array2D.sub(A_reconstructed, A))).toBeLessThan(tol);
        }
    });

    it('Testing QR decomposition...', () => {
        setup();
        const tol = 1.0e-12;
        const testMatrices = [M1, M2, I, M3, Array2D.transpose(M3), M4, Array2D.transpose(M4), M5];
        for (let j = 0; j < testMatrices.length; j++) {
            const Q = [[]], R = [[]];
            let pivot = true;
            const A = testMatrices[j];
            const ipvt = qrDecomposition(A, Q, R, pivot);
            const P = Array2D.newMatrix(Array2D.columns(A), Array2D.columns(A), 0.0);
            for (let i = 0; i < Array2D.columns(P); ++i) {
                P[ipvt[i]][i] = 1.0;
            }
            expect(norm2(Array2D.sub(Array2D.mul(Q, R), Array2D.mul(A, P))))
                .toBeLessThan(tol);
            pivot = false;
            qrDecomposition(A, Q, R, pivot);
            expect(norm2(Array2D.sub(Array2D.mul(Q, R), A))).toBeLessThan(tol);
        }
    });

    it('Testing QR solve...', () => {
        setup();
        const tol = 1.0e-12;
        const rng = new MersenneTwisterUniformRng().init1(1234);
        const bigM = Array2D.newMatrix(50, 100, 0.0);
        for (let i = 0; i < Math.min(Array2D.rows(bigM), Array2D.columns(bigM)); ++i) {
            bigM[i][i] = i + 1.0;
        }
        const randM = Array2D.newMatrix(50, 200);
        for (let i = 0; i < Array2D.rows(randM); ++i) {
            for (let j = 0; j < Array2D.columns(randM); ++j) {
                randM[i][j] = rng.next().value;
            }
        }
        const testMatrices = [
            M1, M2, M3, Array2D.transpose(M3), M4, Array2D.transpose(M4), M5, I, M7,
            bigM, Array2D.transpose(bigM), randM, Array2D.transpose(randM)
        ];
        for (let j = 0; j < testMatrices.length; j++) {
            const A = testMatrices[j];
            const b = new Array(Array2D.rows(A));
            for (let k = 0; k < 10; ++k) {
                for (let iter = 0; iter < b.length; ++iter) {
                    b[iter] = rng.next().value;
                }
                const x = qrSolve(A, b, true);
                if (Array2D.columns(A) >= Array2D.rows(A)) {
                    expect(norm1(Array1D.sub(Array2D.mulVector(A, x), b)))
                        .toBeLessThan(tol);
                }
                else {
                    const n = Array2D.columns(A);
                    const xr = Array1D.fromSizeValue(n, 0.0);
                    const svd = new SVD(A);
                    const V = svd.V();
                    const U = svd.U();
                    const w = svd.singularValues();
                    const threshold = n * QL_EPSILON;
                    for (let i = 0; i < n; ++i) {
                        if (w[i] > threshold) {
                            const u = std.inner_product(Array2D.column(U, i), b, 0.0) / w[i];
                            for (let j = 0; j < n; ++j) {
                                xr[j] += u * V[j][i];
                            }
                        }
                    }
                    expect(norm1(Array1D.sub(xr, x))).toBeLessThan(tol);
                }
            }
        }
    });

    it('Testing LU inverse calculation...', () => {
        setup();
        const tol = 1e-12;
        const testMatrices = [M1, M2, I, M5];
        for (let j = 0; j < testMatrices.length; ++j) {
            const A = testMatrices[j];
            const invA = inv(A);
            const I1 = Array2D.mul(invA, A);
            const I2 = Array2D.mul(A, invA);
            const identity = Array2D.identityMatrix(Array2D.rows(A));
            for (let i = 0; i < Array2D.rows(A); ++i) {
                expect(norm2(Array2D.sub(I1, identity))).toBeLessThan(tol);
                expect(norm2(Array2D.sub(I2, identity))).toBeLessThan(tol);
            }
        }
    });

    it('Testing LU determinant calculation...', () => {
        setup();
        const tol = 1e-10;
        const testMatrices = [M1, M2, M5, M6, I];
        const expected = [0.044, -0.012, 5.0, 5.7621e-11, 1.0];
        for (let j = 0; j < testMatrices.length; ++j) {
            const calculated = det(testMatrices[j]);
            expect(Math.abs(expected[j] - calculated)).toBeLessThan(tol);
        }
        const rng = new MersenneTwisterUniformRng().init1(1234);
        for (let j = 0; j < 100; ++j) {
            const m = Array2D.newMatrix(3, 3, 0.0);
            for (let r = 0; r < Array2D.rows(m); r++) {
                for (let c = 0; c < Array2D.columns(m); c++) {
                    m[r][c] = rng.next().value;
                }
            }
            if (!(j % 3)) {
                const row = Math.floor(3 * rng.next().value);
                for (let c = 0; c < Array2D.columns(m); c++) {
                    m[row][c] = 0;
                }
            }
            const a = m[0][0];
            const b = m[0][1];
            const c = m[0][2];
            const d = m[1][0];
            const e = m[1][1];
            const f = m[1][2];
            const g = m[2][0];
            const h = m[2][1];
            const i = m[2][2];
            const expected = a * e * i + b * f * g + c * d * h -
                (g * e * c + h * f * a + i * d * b);
            const calculated = det(m);
            expect(Math.abs(expected - calculated)).toBeLessThan(tol);
        }
    });

    it('Testing orthogonal projections...', () => {
        const dimension = 1000;
        const numberVectors = 50;
        const multiplier = 100;
        const tolerance = 1e-6;
        const seed = 1;
        const errorAcceptable = 1E-11;
        const test = Array2D.newMatrix(numberVectors, dimension);
        const rng = new MersenneTwisterUniformRng().init1(seed);
        for (let i = 0; i < numberVectors; ++i) {
            for (let j = 0; j < dimension; ++j) {
                test[i][j] = rng.next().value;
            }
        }
        const projector = new OrthogonalProjections(test, multiplier, tolerance);
        let numberFailures = 0;
        let failuresTwo = 0;
        for (let i = 0; i < numberVectors; ++i) {
            if (projector.validVectors()[i]) {
                for (let j = 0; j < numberVectors; ++j) {
                    if (projector.validVectors()[j] && i !== j) {
                        let dotProduct = 0.0;
                        for (let k = 0; k < dimension; ++k) {
                            dotProduct += test[j][k] * projector.GetVector(i)[k];
                        }
                        if (Math.abs(dotProduct) > errorAcceptable) {
                            ++numberFailures;
                        }
                    }
                }
                let innerProductWithOriginal = 0.0;
                let normSq = 0.0;
                for (let j = 0; j < dimension; ++j) {
                    innerProductWithOriginal += projector.GetVector(i)[j] * test[i][j];
                    normSq += test[i][j] * test[i][j];
                }
                if (Math.abs(innerProductWithOriginal - normSq) > errorAcceptable) {
                    ++failuresTwo;
                }
            }
        }
        expect(numberFailures).toEqual(0);
        expect(failuresTwo).toEqual(0);
    });

    it('Testing Cholesky Decomposition...', () => {
        const tmp = [
            [
                6.4e-05, 5.28e-05, 2.28e-05, 0.00032, 0.00036, 6.4e-05,
                6.3968010664e-06, 7.2e-05, 7.19460269899e-06, 1.2e-05, 1.19970004999e-06
            ],
            [
                5.28e-05, 0.000121, 1.045e-05, 0.00044, 0.000165, 2.2e-05,
                2.19890036657e-06, 1.65e-05, 1.64876311852e-06, 1.1e-05,
                1.09972504583e-06
            ],
            [
                2.28e-05, 1.045e-05, 9.025e-05, 0, 0.0001425, 9.5e-06,
                9.49525158294e-07, 2.85e-05, 2.84786356835e-06, 4.75e-06,
                4.74881269789e-07
            ],
            [
                0.00032, 0.00044, 0, 0.04, 0.009, 0.0008, 7.996001333e-05, 0.0006,
                5.99550224916e-05, 0.0001, 9.99750041661e-06
            ],
            [
                0.00036, 0.000165, 0.0001425, 0.009, 0.0225, 0.0003, 2.99850049987e-05,
                0.001125, 0.000112415667172, 0.000225, 2.24943759374e-05
            ],
            [
                6.4e-05, 2.2e-05, 9.5e-06, 0.0008, 0.0003, 0.0001, 9.99500166625e-06,
                7.5e-05, 7.49437781145e-06, 2e-05, 1.99950008332e-06
            ],
            [
                6.3968010664e-06, 2.19890036657e-06, 9.49525158294e-07, 7.996001333e-05,
                2.99850049987e-05, 9.99500166625e-06, 9.99000583083e-07,
                7.49625124969e-06, 7.49063187129e-07, 1.99900033325e-06,
                1.99850066645e-07
            ],
            [
                7.2e-05, 1.65e-05, 2.85e-05, 0.0006, 0.001125, 7.5e-05,
                7.49625124969e-06, 0.000225, 2.24831334343e-05, 1.5e-05,
                1.49962506249e-06
            ],
            [
                7.19460269899e-06, 1.64876311852e-06, 2.84786356835e-06,
                5.99550224916e-05, 0.000112415667172, 7.49437781145e-06,
                7.49063187129e-07, 2.24831334343e-05, 2.24662795123e-06,
                1.49887556229e-06, 1.49850090584e-07
            ],
            [
                1.2e-05, 1.1e-05, 4.75e-06, 0.0001, 0.000225, 2e-05, 1.99900033325e-06,
                1.5e-05, 1.49887556229e-06, 2.5e-05, 2.49937510415e-06
            ],
            [
                1.19970004999e-06, 1.09972504583e-06, 4.74881269789e-07,
                9.99750041661e-06, 2.24943759374e-05, 1.99950008332e-06,
                1.99850066645e-07, 1.49962506249e-06, 1.49850090584e-07,
                2.49937510415e-06, 2.49875036451e-07
            ]
        ];
        const m = Array2D.newMatrix(11, 11);
        for (let i = 0; i < 11; ++i) {
            for (let j = 0; j < 11; ++j) {
                m[i][j] = tmp[i][j];
            }
        }
        const c = CholeskyDecomposition(m, true);
        const m2 = Array2D.mul(c, Array2D.transpose(c));
        const tol = 1.0E-12;
        for (let i = 0; i < 11; ++i) {
            for (let j = 0; j < 11; ++j) {
                expect(m2[i][j]).not.toBeNaN();
                expect(Math.abs(m[i][j] - m2[i][j])).toBeLessThan(tol);
            }
        }
    });

    it('Testing Moore-Penrose inverse...', () => {
        const tmp = [
            [64, 2, 3, 61, 60, 6], [9, 55, 54, 12, 13, 51], [17, 47, 46, 20, 21, 43],
            [40, 26, 27, 37, 36, 30], [32, 34, 35, 29, 28, 38],
            [41, 23, 22, 44, 45, 19], [49, 15, 14, 52, 53, 11], [8, 58, 59, 5, 4, 62]
        ];
        const A = Array2D.newMatrix(8, 6);
        for (let i = 0; i < 8; ++i) {
            for (let j = 0; j < 6; ++j) {
                A[i][j] = tmp[i][j];
            }
        }
        const P = moorePenroseInverse(A);
        const b = Array1D.fromSizeValue(8, 260.0);
        const x = Array2D.mulVector(P, b);
        const cached = [
            1.153846153846152, 1.461538461538463, 1.384615384615384,
            1.384615384615385, 1.461538461538462, 1.153846153846152
        ];
        const tol = 500.0 * QL_EPSILON;
        for (let i = 0; i < 6; ++i) {
            expect(Math.abs(x[i] - cached[i])).toBeLessThan(tol);
        }
        const y = Array2D.mulVector(A, x);
        const tol2 = 2000.0 * QL_EPSILON;
        for (let i = 0; i < 6; ++i) {
            expect(Math.abs(y[i] - 260.0)).toBeLessThan(tol2);
        }
    });

    it('Testing iterative solvers...', () => {
        setup();
        const b = new Array(3);
        b[0] = 1.0;
        b[1] = 0.5;
        b[2] = 3.0;
        const relTol = 1e4 * QL_EPSILON;
        const x = new BiCGstab(new MatrixMult(M1), 3, relTol).solve(b).x;
        expect(norm3(Array1D.sub(Array2D.mulVector(M1, x), b)) / norm3(b))
            .toBeLessThan(relTol);
        const u = new GMRES(new MatrixMult(M1), 3, relTol).solve(b, b);
        expect(norm3(Array1D.sub(Array2D.mulVector(M1, u.x), b)) / norm3(b))
            .toBeLessThan(relTol);
        const errors = Array.from(u.errors);
        for (let i = 0; i < errors.length; ++i) {
            const x = new GMRES(new MatrixMult(M1), 10, 1.01 * errors[i]).solve(b, b).x;
            const calculated = norm3(Array1D.sub(Array2D.mulVector(M1, x), b)) / norm3(b);
            const expected = errors[i];
            expect(Math.abs(calculated - expected)).toBeLessThan(relTol);
        }
    });
});