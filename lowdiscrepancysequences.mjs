import { DiscrepancyStatistics, FaureRsg, HaltonRsg, LatticeRsg, LatticeRule, MersenneTwisterUniformRng, PPMT_MAX_DIM, PrimitivePolynomials, RandomizedLDS, RandomSequenceGenerator, SeedGenerator, SequenceStatistics, SobolRsg } from '/ql.mjs';
function testRandomizedLatticeRule(name, nameString) {
    const maxDim = 30;
    const N = 1024;
    const numberBatches = 32;
    const z = [];
    LatticeRule.getRule(name, z, N);
    const latticeGenerator = new LatticeRsg(maxDim, z, N);
    const seed = 12345678;
    const rng = new MersenneTwisterUniformRng().init1(seed);
    const rsg = new RandomSequenceGenerator(rng).init1(maxDim);
    const rldsg = new RandomizedLDS(new SobolRsg().init(PPMT_MAX_DIM))
        .init1(latticeGenerator, rsg);
    const outerStats = new SequenceStatistics(maxDim);
    for (let i = 0; i < numberBatches; ++i) {
        const innerStats = new SequenceStatistics(maxDim);
        for (let j = 0; j < N; ++j) {
            innerStats.add(rldsg.nextSequence().value);
        }
        outerStats.add(innerStats.mean());
        rldsg.nextRandomizer();
    }
    const means = outerStats.mean();
    const sds = outerStats.errorEstimate();
    const errorInSds = new Array(maxDim);
    for (let i = 0; i < maxDim; ++i) {
        errorInSds[i] = (means[i] - 0.5) / sds[i];
    }
    const tolerance = 4.0;
    for (let i = 0; i < maxDim; ++i) {
        expect(Math.abs(errorInSds[i])).toBeLessThan(tolerance);
    }
}
const dim002Discr_Sobol = [
    8.33e-004, 4.32e-004, 2.24e-004, 1.12e-004, 5.69e-005, 2.14e-005
];
const dim002DiscrMersenneTwis = [
    8.84e-003, 5.42e-003, 5.23e-003, 4.47e-003, 4.75e-003, 3.11e-003, 2.97e-003
];
const dim002DiscrPlainHalton = [
    1.26e-003, 6.73e-004, 3.35e-004, 1.91e-004, 1.11e-004, 5.05e-005, 2.42e-005
];
const dim002DiscrRShiftHalton = [1.32e-003, 7.25e-004];
const dim002DiscrRStRShHalton = [1.35e-003, 9.43e-004];
const dim002DiscrRStartHalton = [1.08e-003, 6.40e-004];
const dim002Discr__Unit_Sobol = [
    8.33e-004, 4.32e-004, 2.24e-004, 1.12e-004, 5.69e-005, 2.14e-005
];
const dim003Discr_Sobol = [
    1.21e-003, 6.37e-004, 3.40e-004, 1.75e-004, 9.21e-005, 4.79e-005, 2.56e-005
];
const dim003DiscrMersenneTwis = [
    7.02e-003, 4.94e-003, 4.82e-003, 4.91e-003, 3.33e-003, 2.80e-003, 2.62e-003
];
const dim003DiscrPlainHalton = [
    1.63e-003, 9.62e-004, 4.83e-004, 2.67e-004, 1.41e-004, 7.64e-005, 3.93e-005
];
const dim003DiscrRShiftHalton = [1.96e-003, 1.03e-003];
const dim003DiscrRStRShHalton = [2.17e-003, 1.54e-003];
const dim003DiscrRStartHalton = [1.48e-003, 7.77e-004];
const dim003Discr__Unit_Sobol = [
    1.21e-003, 6.37e-004, 3.40e-004, 1.75e-004, 9.21e-005, 4.79e-005, 2.56e-005
];
const dim005Discr_Sobol = [
    1.59e-003, 9.55e-004, 5.33e-004, 3.22e-004, 1.63e-004, 9.41e-005, 5.19e-005
];
const dim005DiscrMersenneTwis = [
    4.28e-003, 3.48e-003, 2.48e-003, 1.98e-003, 1.57e-003, 1.39e-003, 6.33e-004
];
const dim005DiscrPlainHalton = [
    1.93e-003, 1.23e-003, 6.89e-004, 4.22e-004, 2.13e-004, 1.25e-004, 7.17e-005
];
const dim005DiscrRShiftHalton = [2.02e-003, 1.36e-003];
const dim005DiscrRStRShHalton = [2.11e-003, 1.25e-003];
const dim005DiscrRStartHalton = [1.74e-003, 1.08e-003];
const dim005Discr__Unit_Sobol = [
    1.85e-003, 9.39e-004, 5.19e-004, 2.99e-004, 1.75e-004, 9.51e-005, 5.55e-005
];
const dim010DiscrJackel_Sobol = [
    7.08e-004, 5.31e-004, 3.60e-004, 2.18e-004, 1.57e-004, 1.12e-004, 6.39e-005
];
const dim010DiscrSobLev_Sobol = [
    7.01e-004, 5.10e-004, 3.28e-004, 2.21e-004, 1.57e-004, 1.08e-004, 6.38e-005
];
const dim010DiscrMersenneTwis = [
    8.83e-004, 6.56e-004, 4.87e-004, 3.37e-004, 3.06e-004, 1.73e-004, 1.43e-004
];
const dim010DiscrPlainHalton = [
    1.23e-003, 6.89e-004, 4.03e-004, 2.83e-004, 1.61e-004, 1.08e-004, 6.69e-005
];
const dim010DiscrRShiftHalton = [9.25e-004, 6.40e-004];
const dim010DiscrRStRShHalton = [8.41e-004, 5.42e-004];
const dim010DiscrRStartHalton = [7.89e-004, 5.33e-004];
const dim010Discr__Unit_Sobol = [
    7.67e-004, 4.92e-004, 3.47e-004, 2.34e-004, 1.39e-004, 9.47e-005, 5.72e-005
];
const dim015DiscrJackel_Sobol = [
    1.59e-004, 1.23e-004, 7.73e-005, 5.51e-005, 3.91e-005, 2.73e-005, 1.96e-005
];
const dim015DiscrSobLev_Sobol = [
    1.48e-004, 1.06e-004, 8.19e-005, 6.29e-005, 4.16e-005, 2.54e-005, 1.73e-005
];
const dim015DiscrMersenneTwis = [
    1.63e-004, 1.12e-004, 8.36e-005, 6.09e-005, 4.34e-005, 2.95e-005, 2.10e-005
];
const dim015DiscrPlainHalton = [
    5.75e-004, 3.12e-004, 1.70e-004, 9.89e-005, 5.33e-005, 3.45e-005, 2.11e-005
];
const dim015DiscrRShiftHalton = [1.75e-004, 1.19e-004];
const dim015DiscrRStRShHalton = [1.66e-004, 1.34e-004];
const dim015DiscrRStartHalton = [2.09e-004, 1.30e-004];
const dim015Discr__Unit_Sobol = [
    2.24e-004, 1.39e-004, 9.86e-005, 6.02e-005, 4.39e-005, 3.06e-005, 2.32e-005
];
const dim030DiscrJackel_Sobol = [
    6.43e-007, 5.28e-007, 3.88e-007, 2.49e-007, 2.09e-007, 1.55e-007, 1.07e-007
];
const dim030DiscrSobLev_Sobol = [
    1.03e-006, 6.06e-007, 3.81e-007, 2.71e-007, 2.68e-007, 1.73e-007, 1.21e-007
];
const dim030DiscrMersenneTwis = [
    4.38e-007, 3.25e-007, 4.47e-007, 2.85e-007, 2.03e-007, 1.50e-007, 1.17e-007
];
const dim030DiscrPlainHalton = [
    4.45e-004, 2.23e-004, 1.11e-004, 5.56e-005, 2.78e-005, 1.39e-005, 6.95e-006
];
const dim030DiscrRShiftHalton = [8.11e-007, 6.05e-007];
const dim030DiscrRStRShHalton = [1.85e-006, 1.03e-006];
const dim030DiscrRStartHalton = [4.42e-007, 4.64e-007];
const dim030Discr__Unit_Sobol = [
    4.35e-005, 2.17e-005, 1.09e-005, 5.43e-006, 2.73e-006, 1.37e-006, 6.90e-007
];
const dim050DiscrJackel_Sobol = [
    2.98e-010, 2.91e-010, 2.62e-010, 1.53e-010, 1.48e-010, 1.15e-010, 8.41e-011
];
const dim050DiscrSobLev_Sobol = [
    3.11e-010, 2.52e-010, 1.61e-010, 1.54e-010, 1.11e-010, 8.60e-011, 1.17e-010
];
const dim050DiscrSobLem_Sobol = [
    4.57e-010, 6.84e-010, 3.68e-010, 2.20e-010, 1.81e-010, 1.14e-010, 8.31e-011
];
const dim050DiscrMersenneTwis = [
    3.27e-010, 2.42e-010, 1.47e-010, 1.98e-010, 2.31e-010, 1.30e-010, 8.09e-011
];
const dim050DiscrPlainHalton = [
    4.04e-004, 2.02e-004, 1.01e-004, 5.05e-005, 2.52e-005, 1.26e-005, 6.31e-006
];
const dim050DiscrRShiftHalton = [1.14e-010, 1.25e-010];
const dim050DiscrRStRShHalton = [2.92e-010, 5.02e-010];
const dim050DiscrRStartHalton = [1.93e-010, 6.82e-010];
const dim050Discr__Unit_Sobol = [
    1.63e-005, 8.14e-006, 4.07e-006, 2.04e-006, 1.02e-006, 5.09e-007, 2.54e-007
];
const dim100DiscrJackel_Sobol = [
    1.26e-018, 1.55e-018, 8.46e-019, 4.43e-019, 4.04e-019, 2.44e-019, 4.86e-019
];
const dim100DiscrSobLev_Sobol = [
    1.17e-018, 2.65e-018, 1.45e-018, 7.28e-019, 6.33e-019, 3.36e-019, 3.43e-019
];
const dim100DiscrSobLem_Sobol = [
    8.79e-019, 4.60e-019, 6.69e-019, 7.17e-019, 5.81e-019, 2.97e-019, 2.64e-019
];
const dim100DiscrMersenneTwis = [
    5.30e-019, 7.29e-019, 3.71e-019, 3.33e-019, 1.33e-017, 6.70e-018, 3.36e-018
];
const dim100DiscrPlainHalton = [
    3.63e-004, 1.81e-004, 9.07e-005, 4.53e-005, 2.27e-005, 1.13e-005, 5.66e-006
];
const dim100DiscrRShiftHalton = [3.36e-019, 2.19e-019];
const dim100DiscrRStRShHalton = [4.44e-019, 2.24e-019];
const dim100DiscrRStartHalton = [9.85e-020, 8.34e-019];
const dim100Discr__Unit_Sobol = [
    4.97e-006, 2.48e-006, 1.24e-006, 6.20e-007, 3.10e-007, 1.55e-007, 7.76e-008
];
const dimensionality = [2, 3, 5, 10, 15, 30, 50, 100];
const discrepancyMeasuresNumber = 1;
class MersenneFactory {
    make(dim, seed) {
        return new RandomSequenceGenerator(new MersenneTwisterUniformRng())
            .init2(dim, seed);
    }
    name() {
        return 'Mersenne Twister';
    }
}
class SobolFactory {
    constructor(unit) {
        this._unit = unit;
    }
    make(dim, seed) {
        return new SobolRsg().init(dim, seed, this._unit);
    }
    name() {
        return SobolRsg.DirectionIntegers[this._unit];
    }
}
class HaltonFactory {
    constructor(randomStart, randomShift) {
        this._start = randomStart;
        this._shift = randomShift;
    }
    make(dim, seed) {
        return new HaltonRsg(dim, seed, this._start, this._shift);
    }
    name() {
        let prefix = this._start ? 'random-start ' : '';
        if (this._shift) {
            prefix += 'random-shift ';
        }
        return prefix + 'Halton';
    }
}
function testGeneratorDiscrepancy(generatorFactory, discrepancy) {
    const tolerance = 1.0e-2;
    let point;
    let dim;
    const seed = 123456;
    let discr;
    const sampleLoops = Math.max(1, discrepancyMeasuresNumber);
    for (let i = 0; i < 8; i++) {
        dim = dimensionality[i];
        const stat = new DiscrepancyStatistics(dim);
        const rsg = generatorFactory.make(dim, seed);
        let j, k = 0;
        const jMin = 10;
        stat.reset();
        for (j = jMin; j < jMin + sampleLoops; j++) {
            const points = Math.floor(Math.pow(2.0, j)) - 1;
            for (; k < points; k++) {
                point = rsg.nextSequence().value;
                stat.add(point);
            }
            discr = stat.discrepancy();
            expect(Math.abs(discr - discrepancy[i][j - jMin]))
                .toBeLessThan(tolerance * discr);
        }
    }
}
describe('Low-discrepancy sequence tests', () => {
    it('Testing random-seed generator...', () => {
        expect(SeedGenerator.get()).not.toBeNaN();
        expect(SeedGenerator.get()).not.toBeNull();
        expect(SeedGenerator.get()).not.toBeUndefined();
    });
    it(`Testing ${PPMT_MAX_DIM} primitive polynomials modulo two...`, () => {
        const jj = [
            1, 1, 2, 2, 6, 6, 18, 16, 48,
            60, 176, 144, 630, 756, 1800, 2048, 7710, 7776,
            27594, 24000, 84672, 120032, 356960, 276480, 1296000, 1719900, 4202496
        ];
        let i = 0, j = 0, n = 0;
        let polynomial = 0;
        while (n < PPMT_MAX_DIM || polynomial !== -1) {
            if (polynomial === -1) {
                ++i;
                j = 0;
            }
            polynomial = PrimitivePolynomials[i][j];
            if (polynomial === -1) {
                --n;
                expect(j).toEqual(jj[i]);
            }
            ++j;
            ++n;
        }
    });
    it('Testing randomized low-discrepancy sequences up to dimension ' +
        `${PPMT_MAX_DIM}...`, () => {
        const rldsg = new RandomizedLDS(new SobolRsg().init(PPMT_MAX_DIM))
            .init3(PPMT_MAX_DIM);
        rldsg.nextSequence();
        rldsg.lastSequence();
        rldsg.nextRandomizer();
        const t1 = new SobolRsg().init(PPMT_MAX_DIM);
        const t2 = new RandomizedLDS(new SobolRsg().init(PPMT_MAX_DIM))
            .init3(PPMT_MAX_DIM);
        const rldsg2 = new RandomizedLDS(new SobolRsg().init(PPMT_MAX_DIM)).init1(t1, t2);
        rldsg2.nextSequence();
        rldsg2.lastSequence();
        rldsg2.nextRandomizer();
        const rldsg3 = new RandomizedLDS(new SobolRsg().init(PPMT_MAX_DIM)).init2(t1);
        rldsg3.nextSequence();
        rldsg3.lastSequence();
        rldsg3.nextRandomizer();
    });
    it('Testing randomized lattice sequences...', () => {
        testRandomizedLatticeRule(LatticeRule.type.A, 'A');
        testRandomizedLatticeRule(LatticeRule.type.B, 'B');
        testRandomizedLatticeRule(LatticeRule.type.C, 'C');
        testRandomizedLatticeRule(LatticeRule.type.D, 'D');
    });
    it(`Testing Sobol sequences up to dimension ${PPMT_MAX_DIM}...`, () => {
        let point;
        const tolerance = 1.0e-15;
        let dimensionality = PPMT_MAX_DIM;
        let seed = 123456;
        let rsg = new SobolRsg().init(dimensionality, seed);
        let points = 100, i;
        for (i = 0; i < points; i++) {
            point = rsg.nextSequence().value;
            expect(point.length).toEqual(dimensionality);
        }
        dimensionality = 33;
        seed = 123456;
        rsg = new SobolRsg().init(dimensionality, seed);
        const stat = new SequenceStatistics(dimensionality);
        let mean;
        let k = 0;
        for (let j = 1; j < 5; j++) {
            points = Math.floor(Math.pow(2.0, j)) - 1;
            for (; k < points; k++) {
                point = rsg.nextSequence().value;
                stat.add(point);
            }
            mean = stat.mean();
            for (i = 0; i < dimensionality; i++) {
                const error = Math.abs(mean[i] - 0.5);
                expect(error).toBeLessThan(tolerance);
            }
        }
        const vanderCorputSequenceModuloTwo = [
            0.50000,
            0.75000, 0.25000,
            0.37500, 0.87500, 0.62500, 0.12500,
            0.18750, 0.68750, 0.93750, 0.43750, 0.31250, 0.81250, 0.56250, 0.06250,
            0.09375, 0.59375, 0.84375, 0.34375, 0.46875, 0.96875, 0.71875, 0.21875,
            0.15625, 0.65625, 0.90625, 0.40625, 0.28125, 0.78125, 0.53125, 0.03125
        ];
        dimensionality = 1;
        rsg = new SobolRsg().init(dimensionality);
        points = Math.floor(Math.pow(2.0, 5)) - 1;
        for (i = 0; i < points; i++) {
            point = rsg.nextSequence().value;
            const error = Math.abs(point[0] - vanderCorputSequenceModuloTwo[i]);
            expect(error).toBeLessThan(tolerance);
        }
    });
    it('Testing Faure sequences...', () => {
        let point;
        const tolerance = 1.0e-15;
        let dimensionality = PPMT_MAX_DIM;
        let rsg = new FaureRsg(dimensionality);
        let points = 100, i;
        for (i = 0; i < points; i++) {
            point = rsg.nextSequence().value;
            expect(point.length).toEqual(dimensionality);
        }
        const vanderCorputSequenceModuloTwo = [
            0.50000,
            0.75000, 0.25000,
            0.37500, 0.87500, 0.62500, 0.12500,
            0.18750, 0.68750, 0.93750, 0.43750, 0.31250, 0.81250, 0.56250, 0.06250,
            0.09375, 0.59375, 0.84375, 0.34375, 0.46875, 0.96875, 0.71875, 0.21875,
            0.15625, 0.65625, 0.90625, 0.40625, 0.28125, 0.78125, 0.53125, 0.03125
        ];
        dimensionality = 1;
        rsg = new FaureRsg(dimensionality);
        points = Math.floor(Math.pow(2.0, 5)) - 1;
        for (i = 0; i < points; i++) {
            point = rsg.nextSequence().value;
            const error = Math.abs(point[0] - vanderCorputSequenceModuloTwo[i]);
            expect(error).toBeLessThan(tolerance);
        }
        const FaureDimensionTwoOfTwo = [
            0.50000,
            0.25000, 0.75000,
            0.37500, 0.87500, 0.12500, 0.62500,
            0.31250, 0.81250, 0.06250, 0.56250, 0.18750, 0.68750, 0.43750, 0.93750,
            0.46875, 0.96875, 0.21875, 0.71875, 0.09375, 0.59375, 0.34375, 0.84375,
            0.15625, 0.65625, 0.40625, 0.90625, 0.28125, 0.78125, 0.03125, 0.53125
        ];
        dimensionality = 2;
        rsg = new FaureRsg(dimensionality);
        points = Math.floor(Math.pow(2.0, 5)) - 1;
        for (i = 0; i < points; i++) {
            point = rsg.nextSequence().value;
            let error = Math.abs(point[0] - vanderCorputSequenceModuloTwo[i]);
            expect(error).toBeLessThan(tolerance);
            error = Math.abs(point[1] - FaureDimensionTwoOfTwo[i]);
            expect(error).toBeLessThan(tolerance);
        }
        const FaureDimensionOneOfThree = [
            1.0 / 3, 2.0 / 3,
            7.0 / 9, 1.0 / 9, 4.0 / 9, 5.0 / 9, 8.0 / 9, 2.0 / 9
        ];
        const FaureDimensionTwoOfThree = [
            1.0 / 3, 2.0 / 3,
            1.0 / 9, 4.0 / 9, 7.0 / 9, 2.0 / 9, 5.0 / 9, 8.0 / 9
        ];
        const FaureDimensionThreeOfThree = [
            1.0 / 3, 2.0 / 3,
            4.0 / 9, 7.0 / 9, 1.0 / 9, 8.0 / 9, 2.0 / 9, 5.0 / 9
        ];
        dimensionality = 3;
        rsg = new FaureRsg(dimensionality);
        points = Math.floor(Math.pow(3.0, 2)) - 1;
        for (i = 0; i < points; i++) {
            point = rsg.nextSequence().value;
            let error = Math.abs(point[0] - FaureDimensionOneOfThree[i]);
            expect(error).toBeLessThan(tolerance);
            error = Math.abs(point[1] - FaureDimensionTwoOfThree[i]);
            expect(error).toBeLessThan(tolerance);
            error = Math.abs(point[2] - FaureDimensionThreeOfThree[i]);
            expect(error).toBeLessThan(tolerance);
        }
    });
    it('Testing Halton sequences...', () => {
        let point;
        const tolerance = 1.0e-15;
        let dimensionality = PPMT_MAX_DIM;
        let rsg = new HaltonRsg(dimensionality, 0, false, false);
        let points = 100, i, k;
        for (i = 0; i < points; i++) {
            point = rsg.nextSequence().value;
            expect(point.length).toEqual(dimensionality);
        }
        const vanderCorputSequenceModuloTwo = [
            0.50000,
            0.25000,
            0.75000,
            0.12500,
            0.62500,
            0.37500,
            0.87500,
            0.06250,
            0.56250,
            0.31250,
            0.81250,
            0.18750,
            0.68750,
            0.43750,
            0.93750,
            0.03125,
            0.53125,
            0.28125,
            0.78125,
            0.15625,
            0.65625,
            0.40625,
            0.90625,
            0.09375,
            0.59375,
            0.34375,
            0.84375,
            0.21875,
            0.71875,
            0.46875,
            0.96875,
        ];
        dimensionality = 1;
        rsg = new HaltonRsg(dimensionality, 0, false, false);
        points = Math.floor(Math.pow(2.0, 5)) - 1;
        for (i = 0; i < points; i++) {
            point = rsg.nextSequence().value;
            const error = Math.abs(point[0] - vanderCorputSequenceModuloTwo[i]);
            expect(error).toBeLessThan(tolerance);
        }
        const vanderCorputSequenceModuloThree = [
            1.0 / 3, 2.0 / 3,
            1.0 / 9, 4.0 / 9, 7.0 / 9, 2.0 / 9, 5.0 / 9, 8.0 / 9,
            1.0 / 27, 10.0 / 27, 19.0 / 27, 4.0 / 27, 13.0 / 27, 22.0 / 27, 7.0 / 27,
            16.0 / 27, 25.0 / 27, 2.0 / 27, 11.0 / 27, 20.0 / 27, 5.0 / 27, 14.0 / 27,
            23.0 / 27, 8.0 / 27, 17.0 / 27, 26.0 / 27
        ];
        dimensionality = 2;
        rsg = new HaltonRsg(dimensionality, 0, false, false);
        points = Math.floor(Math.pow(3.0, 3)) -
            1;
        for (i = 0; i < points; i++) {
            point = rsg.nextSequence().value;
            let error = Math.abs(point[0] - vanderCorputSequenceModuloTwo[i]);
            expect(error).toBeLessThan(tolerance);
            error = Math.abs(point[1] - vanderCorputSequenceModuloThree[i]);
            expect(error).toBeLessThan(tolerance);
        }
        dimensionality = 33;
        rsg = new HaltonRsg(dimensionality, 0, false, false);
        const stat = new SequenceStatistics(dimensionality);
        let mean;
        k = 0;
        let j;
        for (j = 1; j < 5; j++) {
            points = Math.floor(Math.pow(2.0, j)) - 1;
            for (; k < points; k++) {
                point = rsg.nextSequence().value;
                stat.add(point);
            }
            mean = stat.mean();
            const error = Math.abs(mean[0] - 0.5);
            expect(error).toBeLessThan(tolerance);
        }
        rsg = new HaltonRsg(dimensionality, 0, false, false);
        stat.reset(dimensionality);
        k = 0;
        for (j = 1; j < 3; j++) {
            points = Math.floor(Math.pow(3.0, j)) - 1;
            for (; k < points; k++) {
                point = rsg.nextSequence().value;
                stat.add(point);
            }
            mean = stat.mean();
            const error = Math.abs(mean[1] - 0.5);
            expect(error).toBeLessThan(tolerance);
        }
    });
    it('Testing Mersenne-twister discrepancy...', () => {
        const discrepancy = [
            dim002DiscrMersenneTwis, dim003DiscrMersenneTwis, dim005DiscrMersenneTwis,
            dim010DiscrMersenneTwis, dim015DiscrMersenneTwis, dim030DiscrMersenneTwis,
            dim050DiscrMersenneTwis, dim100DiscrMersenneTwis
        ];
        testGeneratorDiscrepancy(new MersenneFactory(), discrepancy);
    });
    it('Testing plain Halton discrepancy...', () => {
        const discrepancy = [
            dim002DiscrPlainHalton, dim003DiscrPlainHalton, dim005DiscrPlainHalton,
            dim010DiscrPlainHalton, dim015DiscrPlainHalton, dim030DiscrPlainHalton,
            dim050DiscrPlainHalton, dim100DiscrPlainHalton
        ];
        testGeneratorDiscrepancy(new HaltonFactory(false, false), discrepancy);
    });
    it('Testing random-start Halton discrepancy...', () => {
        const discrepancy = [
            dim002DiscrRStartHalton, dim003DiscrRStartHalton, dim005DiscrRStartHalton,
            dim010DiscrRStartHalton, dim015DiscrRStartHalton, dim030DiscrRStartHalton,
            dim050DiscrRStartHalton, dim100DiscrRStartHalton
        ];
        testGeneratorDiscrepancy(new HaltonFactory(true, false), discrepancy);
    });
    it('Testing random-shift Halton discrepancy...', () => {
        const discrepancy = [
            dim002DiscrRShiftHalton, dim003DiscrRShiftHalton, dim005DiscrRShiftHalton,
            dim010DiscrRShiftHalton, dim015DiscrRShiftHalton, dim030DiscrRShiftHalton,
            dim050DiscrRShiftHalton, dim100DiscrRShiftHalton
        ];
        testGeneratorDiscrepancy(new HaltonFactory(false, true), discrepancy);
    });
    it('Testing random-start, random-shift Halton discrepancy...', () => {
        const discrepancy = [
            dim002DiscrRStRShHalton, dim003DiscrRStRShHalton, dim005DiscrRStRShHalton,
            dim010DiscrRStRShHalton, dim015DiscrRStRShHalton, dim030DiscrRStRShHalton,
            dim050DiscrRStRShHalton, dim100DiscrRStRShHalton
        ];
        testGeneratorDiscrepancy(new HaltonFactory(true, true), discrepancy);
    });
    it('Testing Jaeckel-Sobol discrepancy...', () => {
        const discrepancy = [
            dim002Discr_Sobol, dim003Discr_Sobol, dim005Discr_Sobol,
            dim010DiscrJackel_Sobol, dim015DiscrJackel_Sobol, dim030DiscrJackel_Sobol,
            dim050DiscrJackel_Sobol, dim100DiscrJackel_Sobol
        ];
        testGeneratorDiscrepancy(new SobolFactory(SobolRsg.DirectionIntegers.Jaeckel), discrepancy);
    });
    it('Testing Levitan-Sobol discrepancy...', () => {
        const discrepancy = [
            dim002Discr_Sobol, dim003Discr_Sobol, dim005Discr_Sobol,
            dim010DiscrSobLev_Sobol, dim015DiscrSobLev_Sobol, dim030DiscrSobLev_Sobol,
            dim050DiscrSobLev_Sobol, dim100DiscrSobLev_Sobol
        ];
        testGeneratorDiscrepancy(new SobolFactory(SobolRsg.DirectionIntegers.SobolLevitan), discrepancy);
    });
    it('Testing Levitan-Lemieux-Sobol discrepancy...', () => {
        const discrepancy = [
            dim002Discr_Sobol, dim003Discr_Sobol, dim005Discr_Sobol,
            dim010DiscrSobLev_Sobol, dim015DiscrSobLev_Sobol, dim030DiscrSobLev_Sobol,
            dim050DiscrSobLem_Sobol, dim100DiscrSobLem_Sobol
        ];
        testGeneratorDiscrepancy(new SobolFactory(SobolRsg.DirectionIntegers.SobolLevitanLemieux), discrepancy);
    });
    it('Testing unit Sobol discrepancy...', () => {
        const discrepancy = [
            dim002Discr__Unit_Sobol, dim003Discr__Unit_Sobol, dim005Discr__Unit_Sobol,
            dim010Discr__Unit_Sobol, dim015Discr__Unit_Sobol, dim030Discr__Unit_Sobol,
            dim050Discr__Unit_Sobol, dim100Discr__Unit_Sobol
        ];
        testGeneratorDiscrepancy(new SobolFactory(SobolRsg.DirectionIntegers.Unit), discrepancy);
    });
    it('Testing Sobol sequence skipping...', () => {
        const seed = 42;
        const dimensionality = [1, 10, 100, 1000];
        const skip = [0, 1, 42, 512, 100000];
        const integers = [
            SobolRsg.DirectionIntegers.Unit, SobolRsg.DirectionIntegers.Jaeckel,
            SobolRsg.DirectionIntegers.SobolLevitan,
            SobolRsg.DirectionIntegers.SobolLevitanLemieux
        ];
        for (let i = 0; i < integers.length; i++) {
            for (let j = 0; j < dimensionality.length; j++) {
                for (let k = 0; k < skip.length; k++) {
                    const rsg1 = new SobolRsg().init(dimensionality[j], seed, integers[i]);
                    for (let l = 0; l < skip[k]; l++) {
                        rsg1.nextInt32Sequence();
                    }
                    const rsg2 = new SobolRsg().init(dimensionality[j], seed, integers[i]);
                    rsg2.skipTo(skip[k]);
                    for (let m = 0; m < 100; m++) {
                        const s1 = rsg1.nextInt32Sequence();
                        const s2 = rsg2.nextInt32Sequence();
                        for (let n = 0; n < s1.length; n++) {
                            expect(s1[n]).toEqual(s2[n]);
                        }
                    }
                }
            }
        }
    });
});
//# sourceMappingURL=lowdiscrepancysequences.js.map