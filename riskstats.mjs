import { Array1D, Comparison, CumulativeNormalDistribution, GenericGaussianStatistics, IncrementalStatistics, InverseCumulativeNormal, M_PI, NormalDistribution, QL_MAX_REAL, QL_MIN_REAL, RiskStatistics, SobolRsg, StatsHolder, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

class IncrementalGaussianStatistics extends GenericGaussianStatistics {
    constructor() {
        super(new IncrementalStatistics());
    }
}

describe(`Risk statistics tests ${version}`, () => {
    it('Testing risk measures...', () => {
        const igs = new IncrementalGaussianStatistics();
        const s = new RiskStatistics();

        const averages = [-100.0, -1.0, 0.0, 1.0, 100.0];
        const sigmas = [0.1, 1.0, 100.0];
        let i, j, k, N;
        N = Math.floor(Math.pow(2.0, 16)) - 1;
        let dataMin, dataMax;
        const data = new Array(N), weights = new Array(N);

        for (i = 0; i < averages.length; i++) {
            for (j = 0; j < sigmas.length; j++) {
                const normal = new NormalDistribution(averages[i], sigmas[j]);
                const cumulative = new CumulativeNormalDistribution(averages[i], sigmas[j]);
                const inverseCum = new InverseCumulativeNormal(averages[i], sigmas[j]);

                const rng = new SobolRsg().init(1);
                dataMin = QL_MAX_REAL;
                dataMax = QL_MIN_REAL;
                for (k = 0; k < N; k++) {
                    data[k] = inverseCum.f(rng.nextSequence().value[0]);
                    dataMin = Math.min(dataMin, data[k]);
                    dataMax = Math.max(dataMax, data[k]);
                    weights[k] = 1.0;
                }

                igs.addSequence(data, weights);
                s.addSequence(data, weights);

                // checks
                let calculated, expected;
                let tolerance;

                expect(igs.samples1()).toEqual(N);
                expect(s.samples1()).toEqual(N);

                // weightSum()
                tolerance = 1e-10;
                expected = Array1D.sum(weights);
                calculated = igs.weightSum1();
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
                calculated = s.weightSum1();
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);

                // min
                tolerance = 1e-12;
                expected = dataMin;
                calculated = igs.min();
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
                calculated = s.min();
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);

                // max
                expected = dataMax;
                calculated = igs.max();
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
                calculated = s.max();
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);

                // mean
                expected = averages[i];
                tolerance = (expected === 0.0 ? 1.0e-13 : Math.abs(expected) * 1.0e-13);
                calculated = igs.mean();
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
                calculated = s.mean();
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);

                // variance
                expected = sigmas[j] * sigmas[j];
                tolerance = expected * 1.0e-1;
                calculated = igs.variance();
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
                calculated = s.variance();
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);

                // standardDeviation
                expected = sigmas[j];
                tolerance = expected * 1.0e-1;
                calculated = igs.standardDeviation();
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
                calculated = s.standardDeviation();
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);

                // missing errorEstimate() test

                // skewness
                expected = 0.0;
                tolerance = 1.0e-4;
                calculated = igs.skewness();
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
                calculated = s.skewness();
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);

                // kurtosis
                expected = 0.0;
                tolerance = 1.0e-1;
                calculated = igs.kurtosis();
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
                calculated = s.kurtosis();
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);

                // percentile
                expected = averages[i];
                tolerance = (expected === 0.0 ? 1.0e-3 : Math.abs(expected * 1.0e-3));
                calculated = igs.gaussianPercentile(0.5);
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
                calculated = s.gaussianPercentile(0.5);
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
                calculated = s.percentile(0.5);
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);

                // potential upside
                const upper_tail = averages[i] + 2.0 * sigmas[j], lower_tail = averages[i] - 2.0 * sigmas[j];
                const twoSigma = cumulative.f(upper_tail);
                expected = Math.max(upper_tail, 0.0);
                tolerance = (expected === 0.0 ? 1.0e-3 : Math.abs(expected * 1.0e-3));
                calculated = igs.gaussianPotentialUpside(twoSigma);
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
                calculated = s.gaussianPotentialUpside(twoSigma);
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
                calculated = s.potentialUpside(twoSigma);
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);

                // just to check that GaussianStatistics<StatsHolder> does work
                const h = new StatsHolder(s.mean(), s.standardDeviation());
                const test = new GenericGaussianStatistics(h);
                expected = s.gaussianPotentialUpside(twoSigma);
                calculated = test.gaussianPotentialUpside(twoSigma);
                expect(Comparison.close(calculated, expected)).toBeTruthy();

                // value-at-risk
                expected = -Math.min(lower_tail, 0.0);
                tolerance = (expected === 0.0 ? 1.0e-3 : Math.abs(expected * 1.0e-3));
                calculated = igs.gaussianValueAtRisk(twoSigma);
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
                calculated = s.gaussianValueAtRisk(twoSigma);
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
                calculated = s.valueAtRisk(twoSigma);
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);

                if (averages[i] > 0.0 && sigmas[j] < averages[i]) {
                    igs.reset();
                    s.reset();
                    continue;
                }

                // expected shortfall
                expected = -Math.min(averages[i] -
                    sigmas[j] * sigmas[j] * normal.f(lower_tail) / (1.0 - twoSigma), 0.0);
                tolerance = (expected === 0.0 ? 1.0e-4 : Math.abs(expected) * 1.0e-2);
                calculated = igs.gaussianExpectedShortfall(twoSigma);
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
                calculated = s.gaussianExpectedShortfall(twoSigma);
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
                calculated = s.expectedShortfall(twoSigma);
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);

                // shortfall
                expected = 0.5;
                tolerance = (expected === 0.0 ? 1.0e-3 : Math.abs(expected * 1.0e-3));
                calculated = igs.gaussianShortfall(averages[i]);
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
                calculated = s.gaussianShortfall(averages[i]);
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
                calculated = s.shortfall(averages[i]);
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);

                // average shortfall
                expected = sigmas[j] / Math.sqrt(2.0 * M_PI) * 2.0;
                tolerance = expected * 1.0e-3;
                calculated = igs.gaussianAverageShortfall(averages[i]);
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
                calculated = s.gaussianAverageShortfall(averages[i]);
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
                calculated = s.averageShortfall(averages[i]);
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);

                // regret
                expected = sigmas[j] * sigmas[j];
                tolerance = expected * 1.0e-1;
                calculated = igs.gaussianRegret(averages[i]);
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
                calculated = s.gaussianRegret(averages[i]);
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
                calculated = s.regret(averages[i]);
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);

                // downsideVariance
                expected = s.downsideVariance();
                tolerance = (expected === 0.0 ? 1.0e-3 : Math.abs(expected * 1.0e-3));
                calculated = igs.downsideVariance();
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
                calculated = igs.gaussianDownsideVariance();
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);

                // downsideVariance
                if (averages[i] === 0.0) {
                    expected = sigmas[j] * sigmas[j];
                    tolerance = expected * 1.0e-3;
                    calculated = igs.downsideVariance();
                    expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
                    calculated = igs.gaussianDownsideVariance();
                    expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
                    calculated = s.downsideVariance();
                    expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
                    calculated = s.gaussianDownsideVariance();
                    expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
                }

                igs.reset();
                s.reset();
            }
        }
    });
});