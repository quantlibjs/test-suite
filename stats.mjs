import { Array1D, Comparison, ConvergenceStatistics, GenericSequenceStatistics, IncrementalStatistics, InverseCumulativeNormal, InverseCumulativeRng, MersenneTwisterUniformRng, RiskStatistics, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

const first = 0, second = 1;

const data = [3.0, 4.0, 5.0, 2.0, 3.0, 4.0, 5.0, 6.0, 4.0, 7.0];
const weights = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];

function check(s) {
    for (let i = 0; i < data.length; i++) {
        s.add(data[i], weights[i]);
    }
    let calculated, expected;
    let tolerance;
    expect(s.samples()).toEqual(data.length);
    expected = weights.reduce((a, c) => a + c, 0);
    calculated = s.weightSum();
    expect(calculated).toEqual(expected);
    expected = Math.min(...data);
    calculated = s.min();
    expect(calculated).toEqual(expected);
    expected = Math.max(...data);
    calculated = s.max();
    expect(calculated).toEqual(expected);
    expected = 4.3;
    tolerance = 1.0e-9;
    calculated = s.mean();
    expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
    expected = 2.23333333333;
    calculated = s.variance();
    expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
    expected = 1.4944341181;
    calculated = s.standardDeviation();
    expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
    expected = 0.359543071407;
    calculated = s.skewness();
    expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
    expected = -0.151799637209;
    calculated = s.kurtosis();
    expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
}

function checkSequence(ss, dimension) {
    let i;
    for (i = 0; i < data.length; i++) {
        const temp = Array1D.fromSizeValue(dimension, data[i]);
        ss.add(temp, weights[i]);
    }
    let calculated;
    let expected, tolerance;
    expect(ss.samples()).toEqual(data.length);
    expected = weights.reduce((a, c) => a + c, 0);
    expect(ss.weightSum()).toEqual(expected);
    expected = Math.min(...data);
    calculated = ss.min();
    for (i = 0; i < dimension; i++) {
        expect(calculated[i]).toEqual(expected);
    }
    expected = Math.max(...data);
    calculated = ss.max();
    for (i = 0; i < dimension; i++) {
        expect(calculated[i]).toEqual(expected);
    }
    expected = 4.3;
    tolerance = 1.0e-9;
    calculated = ss.mean();
    for (i = 0; i < dimension; i++) {
        expect(Math.abs(calculated[i] - expected)).toBeLessThan(tolerance);
    }
    expected = 2.23333333333;
    calculated = ss.variance();
    for (i = 0; i < dimension; i++) {
        expect(Math.abs(calculated[i] - expected)).toBeLessThan(tolerance);
    }
    expected = 1.4944341181;
    calculated = ss.standardDeviation();
    for (i = 0; i < dimension; i++) {
        expect(Math.abs(calculated[i] - expected)).toBeLessThan(tolerance);
    }
    expected = 0.359543071407;
    calculated = ss.skewness();
    for (i = 0; i < dimension; i++) {
        expect(Math.abs(calculated[i] - expected)).toBeLessThan(tolerance);
    }
    expected = -0.151799637209;
    calculated = ss.kurtosis();
    for (i = 0; i < dimension; i++) {
        expect(Math.abs(calculated[i] - expected)).toBeLessThan(tolerance);
    }
}

function checkConvergence(s) {
    const stats = new ConvergenceStatistics(s);
    stats.add(1.0);
    stats.add(2.0);
    stats.add(3.0);
    stats.add(4.0);
    stats.add(5.0);
    stats.add(6.0);
    stats.add(7.0);
    stats.add(8.0);
    const expectedSize1 = 3;
    let calculatedSize = stats.convergenceTable().length;
    expect(calculatedSize).toEqual(expectedSize1);
    const expectedValue1 = 4.0;
    const tolerance = 1.0e-9;
    let calculatedValue = Array1D.back(stats.convergenceTable())[second];
    expect(Math.abs(calculatedValue - expectedValue1)).toBeLessThan(tolerance);
    const expectedSampleSize1 = 7;
    let calculatedSamples = Array1D.back(stats.convergenceTable())[first];
    expect(calculatedSamples).toEqual(expectedSampleSize1);
    stats.reset();
    stats.add(1.0);
    stats.add(2.0);
    stats.add(3.0);
    stats.add(4.0);
    const expectedSize2 = 2;
    calculatedSize = stats.convergenceTable().length;
    expect(calculatedSize).toEqual(expectedSize2);
    const expectedValue2 = 2.0;
    calculatedValue = Array1D.back(stats.convergenceTable())[second];
    expect(Math.abs(calculatedValue - expectedValue2)).toBeLessThan(tolerance);
    const expectedSampleSize2 = 3;
    calculatedSamples = Array1D.back(stats.convergenceTable())[first];
    expect(calculatedSamples).toEqual(expectedSampleSize2);
}

describe(`Statistics tests ${version}`, () => {
    it('Testing statistics...', () => {
        check(new IncrementalStatistics());
        check(new RiskStatistics());
    });

    it('Testing sequence statistics...', () => {
        const s1 = new GenericSequenceStatistics(new IncrementalStatistics()).init(5);
        checkSequence(s1, 5);
        const s2 = new GenericSequenceStatistics(new RiskStatistics()).init(5);
        checkSequence(s2, 5);
    });

    it('Testing convergence statistics...', () => {
        checkConvergence(new IncrementalStatistics());
        checkConvergence(new RiskStatistics());
    });
    
    it('Testing incremental statistics...', () => {
        const mt = new MersenneTwisterUniformRng().init1(42);
        const stat = new IncrementalStatistics();
        for (let i = 0; i < 500000; ++i) {
            const x = 2.0 * (mt.nextReal() - 0.5) * 1234.0;
            const w = mt.nextReal();
            stat.add(x, w);
        }
        expect(stat.samples()).toEqual(500000);
        expect(Comparison.close_enough(stat.weightSum(), 2.5003623600676749e+05))
            .toEqual(true);
        expect(Comparison.close_enough(stat.mean(), 4.9122325964293845e-01))
            .toEqual(true);
        expect(Comparison.close_enough(stat.variance(), 5.0706503959683329e+05))
            .toEqual(true);
        expect(Comparison.close_enough(stat.standardDeviation(), 7.1208499464378076e+02))
            .toEqual(true);
        expect(Comparison.close_enough(stat.errorEstimate(), 1.0070402569876076e+00))
            .toEqual(true);
        expect(Comparison.close_enough(stat.skewness(), -1.7360169326722651e-03))
            .toEqual(true);
        expect(Comparison.close_enough(stat.kurtosis(), -1.1990742562086139e+00))
            .toEqual(true);
        expect(Comparison.close_enough(stat.min(), -1.2339945045639761e+03))
            .toEqual(true);
        expect(Comparison.close_enough(stat.max(), 1.2339958308008499e+03))
            .toEqual(true);
        expect(Comparison.close_enough(stat.downsideVariance(), 5.0786776146975247e+05))
            .toEqual(true);
        expect(Comparison.close_enough(stat.downsideDeviation(), 7.1264841364431061e+02))
            .toEqual(true);
        const normal_gen = new InverseCumulativeRng(mt, new InverseCumulativeNormal());
        const stat2 = new IncrementalStatistics();
        for (let i = 0; i < 500000; ++i) {
            const x = normal_gen.next().value * 1E-1 + 1E8;
            const w = 1.0;
            stat2.add(x, w);
        }
        const tol = 1E-5;
        expect(Math.abs(stat2.variance() - 1E-2)).toBeLessThan(tol);
    });
});