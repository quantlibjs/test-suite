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
import { Array1D, BivariateCumulativeNormalDistributionDr78, BivariateCumulativeNormalDistributionWe04DP, BivariateCumulativeStudentDistribution, Comparison, CumulativeNormalDistribution, CumulativePoissonDistribution, InverseCumulativeNormal, InverseCumulativePoisson, InverseCumulativeNonCentralChiSquare, M_PI, MaddockInverseCumulativeNormal, NormalDistribution, PoissonDistribution, StochasticCollocationInvCDF, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { norm } from '/test-suite/utilities.mjs';

const average = 1.0, sigma = 2.0;

function gaussian(x) {
    const normFact = sigma * Math.sqrt(2 * M_PI);
    const dx = x - average;
    return Math.exp(-dx * dx / (2.0 * sigma * sigma)) / normFact;
}

function gaussianDerivative(x) {
    const normFact = sigma * sigma * sigma * Math.sqrt(2 * M_PI);
    const dx = x - average;
    return -dx * Math.exp(-dx * dx / (2.0 * sigma * sigma)) / normFact;
}

class BivariateTestData {
    constructor(a, b, rho, result) {
        this.a = a;
        this.b = b;
        this.rho = rho;
        this.result = result;
    }
}

function checkBivariate(tag, dr) {
    const values = [
        new BivariateTestData(0.0, 0.0, 0.0, 0.250000),
        new BivariateTestData(0.0, 0.0, -0.5, 0.166667),
        new BivariateTestData(0.0, 0.0, 0.5, 1.0 / 3),
        new BivariateTestData(0.0, -0.5, 0.0, 0.154269),
        new BivariateTestData(0.0, -0.5, -0.5, 0.081660),
        new BivariateTestData(0.0, -0.5, 0.5, 0.226878),
        new BivariateTestData(0.0, 0.5, 0.0, 0.345731),
        new BivariateTestData(0.0, 0.5, -0.5, 0.273122),
        new BivariateTestData(0.0, 0.5, 0.5, 0.418340),
        new BivariateTestData(-0.5, 0.0, 0.0, 0.154269),
        new BivariateTestData(-0.5, 0.0, -0.5, 0.081660),
        new BivariateTestData(-0.5, 0.0, 0.5, 0.226878),
        new BivariateTestData(-0.5, -0.5, 0.0, 0.095195),
        new BivariateTestData(-0.5, -0.5, -0.5, 0.036298),
        new BivariateTestData(-0.5, -0.5, 0.5, 0.163319),
        new BivariateTestData(-0.5, 0.5, 0.0, 0.213342),
        new BivariateTestData(-0.5, 0.5, -0.5, 0.145218),
        new BivariateTestData(-0.5, 0.5, 0.5, 0.272239),
        new BivariateTestData(0.5, 0.0, 0.0, 0.345731),
        new BivariateTestData(0.5, 0.0, -0.5, 0.273122),
        new BivariateTestData(0.5, 0.0, 0.5, 0.418340),
        new BivariateTestData(0.5, -0.5, 0.0, 0.213342),
        new BivariateTestData(0.5, -0.5, -0.5, 0.145218),
        new BivariateTestData(0.5, -0.5, 0.5, 0.272239),
        new BivariateTestData(0.5, 0.5, 0.0, 0.478120),
        new BivariateTestData(0.5, 0.5, -0.5, 0.419223),
        new BivariateTestData(0.5, 0.5, 0.5, 0.546244),
        new BivariateTestData(0.0, 0.0, Math.sqrt(1 / 2.0), 3.0 / 8),
        new BivariateTestData(0.0, 30, -1.0, 0.500000),
        new BivariateTestData(0.0, 30, 0.0, 0.500000),
        new BivariateTestData(0.0, 30, 1.0, 0.500000),
        new BivariateTestData(30, 30, -1.0, 1.000000),
        new BivariateTestData(30, 30, 0.0, 1.000000),
        new BivariateTestData(30, 30, 1.0, 1.000000),
        new BivariateTestData(-30, -1.0, -1.0, 0.000000),
        new BivariateTestData(-30, 0.0, -1.0, 0.000000),
        new BivariateTestData(-30, 1.0, -1.0, 0.000000),
        new BivariateTestData(-30, -1.0, 0.0, 0.000000),
        new BivariateTestData(-30, 0.0, 0.0, 0.000000),
        new BivariateTestData(-30, 1.0, 0.0, 0.000000),
        new BivariateTestData(-30, -1.0, 1.0, 0.000000),
        new BivariateTestData(-30, 0.0, 1.0, 0.000000),
        new BivariateTestData(-30, 1.0, 1.0, 0.000000)
    ];
    for (let i = 0; i < values.length; i++) {
        let bcd;
        if (dr) {
            bcd = new BivariateCumulativeNormalDistributionDr78(values[i].rho);
        }
        else {
            bcd = new BivariateCumulativeNormalDistributionWe04DP(values[i].rho);
        }
        const value = bcd.f(values[i].a, values[i].b);
        const tolerance = 1.0e-6;
        expect(Math.abs(value - values[i].result)).toBeLessThan(tolerance);
    }
}

function checkBivariateAtZero(tag, tolerance, dr) {
    const rho = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.99999];
    const x = 0.0;
    const y = 0.0;
    for (let i = 0; i < rho.length; i++) {
        for (let sgn = -1; sgn < 2; sgn += 2) {
            let bvn;
            if (dr) {
                bvn = new BivariateCumulativeNormalDistributionDr78(sgn * rho[i]);
            }
            else {
                bvn = new BivariateCumulativeNormalDistributionWe04DP(sgn * rho[i]);
            }
            const expected = 0.25 + Math.asin(sgn * rho[i]) / (2 * M_PI);
            const realised = bvn.f(x, y);
            expect(Math.abs(realised - expected)).toBeLessThan(tolerance);
        }
    }
}

function checkBivariateTail(tag, tolerance, dr) {
    const x = -6.9;
    let y = 6.9;
    const corr = -0.999;
    let bvn;
    if (dr) {
        bvn = new BivariateCumulativeNormalDistributionDr78(corr);
    }
    else {
        bvn = new BivariateCumulativeNormalDistributionWe04DP(corr);
    }
    for (let i = 0; i < 10; i++) {
        const cdf0 = bvn.f(x, y);
        y = y + tolerance;
        const cdf1 = bvn.f(x, y);
        expect(cdf0).toBeLessThanOrEqual(cdf1);
    }
}

class BivariateStudentTestData {
    constructor(n, rho, x, y, result) {
        this.n = n;
        this.rho = rho;
        this.x = x;
        this.y = y;
        this.result = result;
    }
}

describe(`Distribution tests ${version}`, () => {
    it('Testing normal distributions...', () => {
        const invCumStandardNormal = new InverseCumulativeNormal();
        const check = invCumStandardNormal.f(0.5);
        if (check !== 0.0e0) {
            throw new Error('inverse cumulative of the standard normal at 0.5 is ' +
                `${check} instead of zero, something is wrong!`);
        }
        const normal = new NormalDistribution(average, sigma);
        const cum = new CumulativeNormalDistribution(average, sigma);
        const invCum = new InverseCumulativeNormal(average, sigma);
        const numberOfStandardDeviation = 6;
        const xMin = average - numberOfStandardDeviation * sigma;
        const xMax = average + numberOfStandardDeviation * sigma;
        const N = 100001;
        const h = (xMax - xMin) / (N - 1);
        const x = new Array(N);
        let y;
        let yd;
        let temp;
        let diff;
        let i;
        for (i = 0; i < N; i++) {
            x[i] = xMin + h * h;
        }
        y = x.map(gaussian);
        yd = x.map(gaussianDerivative);
        temp = x.map(normal.f, normal);
        diff = Array1D.sub(y, temp);
        let e = norm(diff, h);
        expect(e).toBeLessThan(1.0e-16);
        temp = x.map(cum.f, cum);
        temp = temp.map(invCum.f, invCum);
        diff = Array1D.sub(x, temp);
        e = norm(diff, h);
        expect(e).toBeLessThan(1.0e-7);
        const mInvCum = new MaddockInverseCumulativeNormal(average, sigma);
        temp = x.map(cum.f, cum);
        temp = temp.map(mInvCum.f, mInvCum);
        diff = Array1D.sub(x, temp);
        e = norm(diff, h);
        expect(e).toBeLessThan(1.0e-7);
        for (i = 0; i < x.length; i++) {
            temp[i] = cum.d(x[i]);
        }
        diff = Array1D.sub(y, temp);
        e = norm(diff, h);
        expect(e).toBeLessThan(1.0e-16);
        for (i = 0; i < x.length; i++) {
            temp[i] = normal.d(x[i]);
        }
        diff = Array1D.sub(yd, temp);
        e = norm(diff, h);
        expect(e).toBeLessThan(1.0e-16);
    });

    it('Testing bivariate cumulative normal distribution...', () => {
        checkBivariateAtZero('Drezner 1978', 1.0e-6, true);
        checkBivariate('Drezner 1978', true);
        checkBivariateTail('Drezner 1978', 1.0e-5, true);
        checkBivariateAtZero('West 2004', 1.0e-15, false);
        checkBivariate('West 2004', false);
        checkBivariateTail('West 2004', 1.0e-6, false);
        checkBivariateTail('West 2004', 1.0e-8, false);
    });

    it('Testing Poisson distribution...', () => {
        for (let mean = 0.0; mean <= 10.0; mean += 0.5) {
            let i = 0;
            const pdf = new PoissonDistribution(mean);
            let calculated = pdf.f(i);
            let logHelper = -mean;
            let expected = Math.exp(logHelper);
            let error = Math.abs(calculated - expected);
            expect(error).toBeLessThan(1.0e-16);
            for (i = 1; i < 25; i++) {
                calculated = pdf.f(i);
                if (mean === 0.0) {
                    expected = 0.0;
                }
                else {
                    logHelper = logHelper + Math.log(mean) - Math.log(i);
                    expected = Math.exp(logHelper);
                }
                error = Math.abs(calculated - expected);
                expect(error).toBeLessThan(1.0e-13);
            }
        }
    });

    it('Testing cumulative Poisson distribution...', () => {
        for (let mean = 0.0; mean <= 10.0; mean += 0.5) {
            let i = 0;
            const cdf = new CumulativePoissonDistribution(mean);
            let cumCalculated = cdf.f(i);
            let logHelper = -mean;
            let cumExpected = Math.exp(logHelper);
            let error = Math.abs(cumCalculated - cumExpected);
            expect(error).toBeLessThan(1.0e-13);
            for (i = 1; i < 25; i++) {
                cumCalculated = cdf.f(i);
                if (mean === 0.0) {
                    cumExpected = 1.0;
                }
                else {
                    logHelper = logHelper + Math.log(mean) - Math.log(i);
                    cumExpected += Math.exp(logHelper);
                }
                error = Math.abs(cumCalculated - cumExpected);
                expect(error).toBeLessThan(1.0e-12);
            }
        }
    });

    it('Testing inverse cumulative Poisson distribution...', () => {
        const icp = new InverseCumulativePoisson(1.0);
        const data = [
            0.2, 0.5, 0.9, 0.98, 0.99, 0.999, 0.9999, 0.99995, 0.99999, 0.999999,
            0.9999999, 0.99999999
        ];
        for (let i = 0; i < data.length; i++) {
            expect(Comparison.close(icp.f(data[i]), i)).toEqual(true);
        }
    });

    it('Testing bivariate cumulative Student t distribution...', () => {
        const xs = [
            0.00, 0.50, 1.00, 1.50, 2.00, 2.50, 3.00, 4.00, 5.00, 6.00, 7.00, 8.00,
            9.00, 10.00
        ];
        const ns = [
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            15, 20, 25, 30, 60, 90, 120, 150, 300, 600
        ];
        const expected1 = [
            0.33333, 0.50000, 0.63497, 0.72338, 0.78063, 0.81943, 0.84704, 0.88332,
            0.90590, 0.92124, 0.93231, 0.94066, 0.94719, 0.95243, 0.33333, 0.52017,
            0.68114, 0.78925, 0.85607, 0.89754, 0.92417, 0.95433, 0.96978, 0.97862,
            0.98411, 0.98774, 0.99026, 0.99208, 0.33333, 0.52818, 0.70018, 0.81702,
            0.88720, 0.92812, 0.95238, 0.97667, 0.98712, 0.99222, 0.99497, 0.99657,
            0.99756, 0.99821, 0.33333, 0.53245, 0.71052, 0.83231, 0.90402, 0.94394,
            0.96612, 0.98616, 0.99353, 0.99664, 0.99810, 0.99885, 0.99927, 0.99951,
            0.33333, 0.53510, 0.71701, 0.84196, 0.91449, 0.95344, 0.97397, 0.99095,
            0.99637, 0.99836, 0.99918, 0.99956, 0.99975, 0.99985, 0.33333, 0.53689,
            0.72146, 0.84862, 0.92163, 0.95972, 0.97893, 0.99365, 0.99779, 0.99913,
            0.99962, 0.99982, 0.99990, 0.99995, 0.33333, 0.53819, 0.72470, 0.85348,
            0.92679, 0.96415, 0.98230, 0.99531, 0.99857, 0.99950, 0.99981, 0.99992,
            0.99996, 0.99998, 0.33333, 0.53917, 0.72716, 0.85719, 0.93070, 0.96743,
            0.98470, 0.99639, 0.99903, 0.99970, 0.99990, 0.99996, 0.99998, 0.99999,
            0.33333, 0.53994, 0.72909, 0.86011, 0.93375, 0.96995, 0.98650, 0.99713,
            0.99931, 0.99981, 0.99994, 0.99998, 0.99999, 1.00000, 0.33333, 0.54056,
            0.73065, 0.86247, 0.93621, 0.97194, 0.98788, 0.99766, 0.99950, 0.99988,
            0.99996, 0.99999, 1.00000, 1.00000, 0.33333, 0.54243, 0.73540, 0.86968,
            0.94362, 0.97774, 0.99168, 0.99890, 0.99985, 0.99998, 1.00000, 1.00000,
            1.00000, 1.00000, 0.33333, 0.54338, 0.73781, 0.87336, 0.94735, 0.98053,
            0.99337, 0.99932, 0.99993, 0.99999, 1.00000, 1.00000, 1.00000, 1.00000,
            0.33333, 0.54395, 0.73927, 0.87560, 0.94959, 0.98216, 0.99430, 0.99952,
            0.99996, 1.00000, 1.00000, 1.00000, 1.00000, 1.00000, 0.33333, 0.54433,
            0.74025, 0.87709, 0.95108, 0.98322, 0.99489, 0.99963, 0.99998, 1.00000,
            1.00000, 1.00000, 1.00000, 1.00000, 0.33333, 0.54528, 0.74271, 0.88087,
            0.95482, 0.98580, 0.99623, 0.99983, 0.99999, 1.00000, 1.00000, 1.00000,
            1.00000, 1.00000, 0.33333, 0.54560, 0.74354, 0.88215, 0.95607, 0.98663,
            0.99664, 0.99987, 1.00000, 1.00000, 1.00000, 1.00000, 1.00000, 1.00000,
            0.33333, 0.54576, 0.74396, 0.88279, 0.95669, 0.98704, 0.99683, 0.99989,
            1.00000, 1.00000, 1.00000, 1.00000, 1.00000, 1.00000, 0.33333, 0.54586,
            0.74420, 0.88317, 0.95706, 0.98729, 0.99695, 0.99990, 1.00000, 1.00000,
            1.00000, 1.00000, 1.00000, 1.00000, 0.33333, 0.54605, 0.74470, 0.88394,
            0.95781, 0.98777, 0.99717, 0.99992, 1.00000, 1.00000, 1.00000, 1.00000,
            1.00000, 1.00000, 0.33333, 0.54615, 0.74495, 0.88432, 0.95818, 0.98801,
            0.99728, 0.99993, 1.00000, 1.00000, 1.00000, 1.00000, 1.00000, 1.00000
        ];
        const expected2 = [
            0.16667, 0.36554, 0.54022, 0.65333, 0.72582, 0.77465, 0.80928, 0.85466,
            0.88284, 0.90196, 0.91575, 0.92616, 0.93429, 0.94081, 0.16667, 0.38889,
            0.59968, 0.73892, 0.82320, 0.87479, 0.90763, 0.94458, 0.96339, 0.97412,
            0.98078, 0.98518, 0.98823, 0.99044, 0.16667, 0.39817, 0.62478, 0.77566,
            0.86365, 0.91391, 0.94330, 0.97241, 0.98483, 0.99086, 0.99410, 0.99598,
            0.99714, 0.99790, 0.16667, 0.40313, 0.63863, 0.79605, 0.88547, 0.93396,
            0.96043, 0.98400, 0.99256, 0.99614, 0.99782, 0.99868, 0.99916, 0.99944,
            0.16667, 0.40620, 0.64740, 0.80900, 0.89902, 0.94588, 0.97007, 0.98972,
            0.99591, 0.99816, 0.99909, 0.99951, 0.99972, 0.99983, 0.16667, 0.40829,
            0.65345, 0.81794, 0.90820, 0.95368, 0.97607, 0.99290, 0.99755, 0.99904,
            0.99958, 0.99980, 0.99989, 0.99994, 0.16667, 0.40980, 0.65788, 0.82449,
            0.91482, 0.95914, 0.98010, 0.99482, 0.99844, 0.99946, 0.99979, 0.99991,
            0.99996, 0.99998, 0.16667, 0.41095, 0.66126, 0.82948, 0.91981, 0.96314,
            0.98295, 0.99605, 0.99895, 0.99968, 0.99989, 0.99996, 0.99998, 0.99999,
            0.16667, 0.41185, 0.66393, 0.83342, 0.92369, 0.96619, 0.98506, 0.99689,
            0.99926, 0.99980, 0.99994, 0.99998, 0.99999, 1.00000, 0.16667, 0.41257,
            0.66608, 0.83661, 0.92681, 0.96859, 0.98667, 0.99748, 0.99946, 0.99987,
            0.99996, 0.99999, 1.00000, 1.00000, 0.16667, 0.41476, 0.67268, 0.84633,
            0.93614, 0.97550, 0.99103, 0.99884, 0.99984, 0.99998, 1.00000, 1.00000,
            1.00000, 1.00000, 0.16667, 0.41586, 0.67605, 0.85129, 0.94078, 0.97877,
            0.99292, 0.99930, 0.99993, 0.99999, 1.00000, 1.00000, 1.00000, 1.00000,
            0.16667, 0.41653, 0.67810, 0.85430, 0.94356, 0.98066, 0.99396, 0.99950,
            0.99996, 1.00000, 1.00000, 1.00000, 1.00000, 1.00000, 0.16667, 0.41698,
            0.67947, 0.85632, 0.94540, 0.98189, 0.99461, 0.99962, 0.99998, 1.00000,
            1.00000, 1.00000, 1.00000, 1.00000, 0.16667, 0.41810, 0.68294, 0.86141,
            0.94998, 0.98483, 0.99607, 0.99982, 0.99999, 1.00000, 1.00000, 1.00000,
            1.00000, 1.00000, 0.16667, 0.41847, 0.68411, 0.86312, 0.95149, 0.98577,
            0.99651, 0.99987, 1.00000, 1.00000, 1.00000, 1.00000, 1.00000, 1.00000,
            0.16667, 0.41866, 0.68470, 0.86398, 0.95225, 0.98623, 0.99672, 0.99989,
            1.00000, 1.00000, 1.00000, 1.00000, 1.00000, 1.00000, 0.16667, 0.41877,
            0.68505, 0.86449, 0.95270, 0.98650, 0.99684, 0.99990, 1.00000, 1.00000,
            1.00000, 1.00000, 1.00000, 1.00000, 0.16667, 0.41900, 0.68576, 0.86552,
            0.95360, 0.98705, 0.99707, 0.99992, 1.00000, 1.00000, 1.00000, 1.00000,
            1.00000, 1.00000, 0.16667, 0.41911, 0.68612, 0.86604, 0.95405, 0.98731,
            0.99719, 0.99993, 1.00000, 1.00000, 1.00000, 1.00000, 1.00000, 1.00000
        ];
        let tolerance = 1.0e-5;
        for (let i = 0; i < ns.length; ++i) {
            const f1 = new BivariateCumulativeStudentDistribution(ns[i], 0.5);
            const f2 = new BivariateCumulativeStudentDistribution(ns[i], -0.5);
            for (let j = 0; j < xs.length; ++j) {
                const calculated1 = f1.f(xs[j], xs[j]);
                const calculated2 = f2.f(xs[j], xs[j]);
                const reference1 = expected1[i * xs.length + j];
                const reference2 = expected2[i * xs.length + j];
                expect(Math.abs(calculated1 - reference1)).toBeLessThan(tolerance);
                expect(Math.abs(calculated2 - reference2)).toBeLessThan(tolerance);
            }
        }
        const cases = [
            new BivariateStudentTestData(2, -1.0, 5.0, 8.0, 0.973491),
            new BivariateStudentTestData(2, 1.0, -2.0, 8.0, 0.091752),
            new BivariateStudentTestData(2, 1.0, 5.25, -9.5, 0.005450),
            new BivariateStudentTestData(3, -0.5, -5.0, -5.0, 0.000220),
            new BivariateStudentTestData(4, -1.0, -8.0, 7.5, 0.0),
            new BivariateStudentTestData(4, 0.5, -5.5, 10.0, 0.002655),
            new BivariateStudentTestData(4, 1.0, -5.0, 6.0, 0.003745),
            new BivariateStudentTestData(4, 1.0, 6.0, 5.5, 0.997336),
            new BivariateStudentTestData(5, -0.5, -7.0, -6.25, 0.000004),
            new BivariateStudentTestData(5, -0.5, 3.75, -7.25, 0.000166),
            new BivariateStudentTestData(5, -0.5, 7.75, -1.25, 0.133073),
            new BivariateStudentTestData(6, 0.0, 7.5, 3.25, 0.991149),
            new BivariateStudentTestData(7, -0.5, -1.0, -8.5, 0.000001),
            new BivariateStudentTestData(7, -1.0, -4.25, -4.0, 0.0),
            new BivariateStudentTestData(7, 0.0, 0.5, -2.25, 0.018819),
            new BivariateStudentTestData(8, -1.0, 8.25, 1.75, 0.940866),
            new BivariateStudentTestData(2, -1.0, 5.0, 8.0, 0.973491),
            new BivariateStudentTestData(8, 0.0, 2.25, 4.75, 0.972105),
            new BivariateStudentTestData(9, -0.5, -4.0, 8.25, 0.001550),
            new BivariateStudentTestData(9, -1.0, -1.25, -8.75, 0.0),
            new BivariateStudentTestData(9, -1.0, 5.75, -6.0, 0.0),
            new BivariateStudentTestData(9, 0.5, -6.5, -9.5, 0.000001),
            new BivariateStudentTestData(9, 1.0, -2.0, 9.25, 0.038276),
            new BivariateStudentTestData(10, -1.0, -0.5, 6.0, 0.313881),
            new BivariateStudentTestData(10, 0.5, 0.0, 9.25, 0.5),
            new BivariateStudentTestData(10, 0.5, 6.75, -2.25, 0.024090),
            new BivariateStudentTestData(10, 1.0, -1.75, -1.0, 0.055341),
            new BivariateStudentTestData(15, 0.0, -1.25, -4.75, 0.000029),
            new BivariateStudentTestData(15, 0.0, -2.0, -1.5, 0.003411),
            new BivariateStudentTestData(15, 0.5, 3.0, -3.25, 0.002691),
            new BivariateStudentTestData(20, -0.5, 2.0, -1.25, 0.098333),
            new BivariateStudentTestData(20, -1.0, 3.0, 8.0, 0.996462),
            new BivariateStudentTestData(20, 0.0, -7.5, 1.5, 0.0),
            new BivariateStudentTestData(20, 0.5, 1.25, 9.75, 0.887136),
            new BivariateStudentTestData(25, -1.0, -4.25, 5.0, 0.000111),
            new BivariateStudentTestData(25, 0.5, 9.5, -1.5, 0.073069),
            new BivariateStudentTestData(25, 1.0, -6.5, -3.25, 0.0),
            new BivariateStudentTestData(30, -1.0, -7.75, 10.0, 0.0),
            new BivariateStudentTestData(30, 1.0, 0.5, 9.5, 0.689638),
            new BivariateStudentTestData(60, -1.0, -3.5, -8.25, 0.0),
            new BivariateStudentTestData(60, -1.0, 4.25, 0.75, 0.771869),
            new BivariateStudentTestData(60, -1.0, 5.75, 3.75, 0.9998),
            new BivariateStudentTestData(60, 0.5, -4.5, 8.25, 0.000016),
            new BivariateStudentTestData(60, 1.0, 6.5, -4.0, 0.000088),
            new BivariateStudentTestData(90, -0.5, -3.75, -2.75, 0.0),
            new BivariateStudentTestData(90, 0.5, 8.75, -7.0, 0.0),
            new BivariateStudentTestData(120, 0.0, -3.5, -9.25, 0.0),
            new BivariateStudentTestData(120, 0.0, -8.25, 5.0, 0.0),
            new BivariateStudentTestData(120, 1.0, -0.75, 3.75, 0.227361),
            new BivariateStudentTestData(120, 1.0, -3.5, -8.0, 0.0),
            new BivariateStudentTestData(150, 0.0, 10.0, -1.75, 0.041082),
            new BivariateStudentTestData(300, -0.5, -6.0, 3.75, 0.0),
            new BivariateStudentTestData(300, -0.5, 3.5, -4.5, 0.000004),
            new BivariateStudentTestData(300, 0.0, 6.5, -5.0, 0.0),
            new BivariateStudentTestData(600, -0.5, 9.25, 1.5, 0.93293),
            new BivariateStudentTestData(600, -1.0, -9.25, 1.5, 0.0),
            new BivariateStudentTestData(600, 0.5, -5.0, 8.0, 0.0),
            new BivariateStudentTestData(600, 1.0, -2.75, -9.0, 0.0),
            new BivariateStudentTestData(1000, -0.5, -2.5, 0.25, 0.000589),
            new BivariateStudentTestData(1000, -0.5, 3.0, 1.0, 0.839842),
            new BivariateStudentTestData(2000, -1.0, 9.0, -4.75, 0.000001),
            new BivariateStudentTestData(2000, 0.5, 9.75, 7.25, 1.0),
            new BivariateStudentTestData(2000, 1.0, 0.75, -9.0, 0.0),
            new BivariateStudentTestData(5000, -0.5, 9.75, 5.5, 1.0),
            new BivariateStudentTestData(5000, -1.0, 6.0, 1.0, 0.841321),
            new BivariateStudentTestData(5000, 1.0, 4.0, -7.75, 0.0),
            new BivariateStudentTestData(10000, 0.5, 1.5, 6.0, 0.933177)
        ];
        tolerance = 1.0e-6;
        for (let i = 0; i < cases.length; ++i) {
            const f = new BivariateCumulativeStudentDistribution(cases[i].n, cases[i].rho);
            const calculated = f.f(cases[i].x, cases[i].y);
            const expected = cases[i].result;
            expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
        }
    });

    it('Testing bivariate cumulative Student t distribution for large N...', () => {
        const n = 10000;
        for (let rho = -1.0; rho < 1.01; rho += 0.25) {
            const T = new BivariateCumulativeStudentDistribution(n, rho);
            const N = new BivariateCumulativeNormalDistributionWe04DP(rho);
            let avgDiff = 0.0;
            let m = 0;
            const tolerance = 4.0e-5;
            for (let x = -10; x < 10.1; x += 0.25) {
                for (let y = -10; y < 10.1; y += 0.25) {
                    const calculated = T.f(x, y);
                    const expected = N.f(x, y);
                    const diff = Math.abs(calculated - expected);
                    expect(diff).toBeLessThan(tolerance);
                    avgDiff += diff;
                    ++m;
                }
            }
            avgDiff /= m;
            expect(avgDiff).toBeLessThan(3.0e-6);
        }
    });

    it('Testing inverse CDF based on stochastic collocation...', () => {
        const k = 3.0;
        const lambda = 1.0;
        const normalCDF = new CumulativeNormalDistribution();
        const invCDF = new InverseCumulativeNonCentralChiSquare(k, lambda);
        const scInvCDF10 = new StochasticCollocationInvCDF(invCDF, 10);
        for (let x = -3.0; x < 3.0; x += 0.1) {
            const u = normalCDF.f(x);
            const calculated1 = scInvCDF10.f(u);
            const calculated2 = scInvCDF10.value(x);
            const expeced = invCDF.f(u);
            expect(Math.abs(calculated1 - calculated2)).toBeLessThan(1e-6);
            const tol = 1e-2;
            expect(Math.abs(calculated2 - expeced)).toBeLessThan(tol);
        }
        const scInvCDF30 = new StochasticCollocationInvCDF(invCDF, 30, 0.9999999);
        for (let x = -4.0; x < 4.0; x += 0.1) {
            const u = normalCDF.f(x);
            const expeced = invCDF.f(u);
            const calculated = scInvCDF30.f(u);
            const tol = 1e-6;
            expect(Math.abs(calculated - expeced)).toBeLessThan(tol);
        }
    });
});
