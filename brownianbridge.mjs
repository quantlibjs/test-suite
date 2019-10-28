import '/test-suite/quantlibtestsuite.mjs';
import { Actual365Fixed, Array1D, Array2D, BlackConstantVol, BlackScholesMertonProcess, BrownianBridge, FlatForward, Handle, InverseCumulativeNormal, InverseCumulativeRsg, NullCalendar, PathGenerator, SequenceStatistics, Settings, SimpleQuote, SobolRsg, TimeGrid, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

function maxDiff(forward1, begin1, end1, forward2, begin2) {
    let diff = 0.0;
    while (begin1 !== end1) {
        diff = Math.max(diff, Math.abs(forward1[begin1] - forward2[begin2]));
        ++begin1;
        ++begin2;
    }
    return diff;
}

function maxRelDiff(forward1, begin1, end1, forward2, begin2) {
    let diff = 0.0;
    while (begin1 !== end1) {
        diff = Math.max(diff, Math.abs((forward1[begin1] - forward2[begin2]) / (forward2[begin2])));
        ++begin1;
        ++begin2;
    }
    return diff;
}

describe(`Brownian bridge tests ${version}`, () => {
    it('Testing Brownian-bridge variates...', () => {
        const times = [];
        times.push(0.1);
        times.push(0.2);
        times.push(0.3);
        times.push(0.4);
        times.push(0.5);
        times.push(0.6);
        times.push(0.7);
        times.push(0.8);
        times.push(0.9);
        times.push(1.0);
        times.push(2.0);
        times.push(5.0);
        const N = times.length;
        const samples = 262143;
        const seed = 42;
        const sobol = new SobolRsg().init(N, seed);
        const generator = new InverseCumulativeRsg(sobol, new InverseCumulativeNormal());
        const bridge = new BrownianBridge().init2(times);
        const stats1 = new SequenceStatistics(N);
        const stats2 = new SequenceStatistics(N);
        const temp = new Array(N);
        for (let i = 0; i < samples; ++i) {
            const sample = generator.nextSequence().value;
            bridge.transform(sample, 0, sample.length, temp, 0);
            stats1.add(temp);
            temp[0] = temp[0] * Math.sqrt(times[0]);
            for (let j = 1; j < N; ++j) {
                temp[j] = temp[j - 1] + temp[j] * Math.sqrt(times[j] - times[j - 1]);
            }
            stats2.add(temp);
        }
        let expectedMean = Array1D.fromSizeValue(N, 0.0);
        let expectedCovariance = Array2D.newMatrix(N, N, 0.0);
        for (let i = 0; i < N; i++) {
            expectedCovariance[i][i] = 1.0;
        }
        let meanTolerance = 1.0e-16;
        let covTolerance = 2.5e-4;
        let mean = stats1.mean();
        let covariance = stats1.covariance();
        let maxMeanError = maxDiff(mean, 0, mean.length, expectedMean, 0);
        let covariance1d = [].concat(...covariance);
        let expectedCovariance1d = [].concat(...expectedCovariance);
        let maxCovError = maxDiff(covariance1d, 0, covariance1d.length, expectedCovariance1d, 0);
        expect(maxMeanError).toBeLessThan(meanTolerance);
        expect(maxCovError).toBeLessThan(covTolerance);
        expectedMean = Array1D.fromSizeValue(N, 0.0);
        expectedCovariance = Array2D.newMatrix(N, N);
        for (let i = 0; i < N; ++i) {
            for (let j = i; j < N; ++j) {
                expectedCovariance[i][j] = expectedCovariance[j][i] = times[i];
            }
        }
        meanTolerance = 1.0e-16;
        covTolerance = 6.0e-4;
        mean = stats2.mean();
        covariance = stats2.covariance();
        maxMeanError = maxDiff(mean, 0, mean.length, expectedMean, 0);
        covariance1d = [].concat(...covariance);
        expectedCovariance1d = [].concat(...expectedCovariance);
        maxCovError =
            maxDiff(covariance1d, 0, covariance1d.length, expectedCovariance1d, 0);
        expect(maxMeanError).toBeLessThan(meanTolerance);
        expect(maxCovError).toBeLessThan(covTolerance);
    });
    
    it('Testing Brownian-bridge path generation...', () => {
        const times = [];
        times.push(0.1);
        times.push(0.2);
        times.push(0.3);
        times.push(0.4);
        times.push(0.5);
        times.push(0.6);
        times.push(0.7);
        times.push(0.8);
        times.push(0.9);
        times.push(1.0);
        times.push(2.0);
        times.push(5.0);
        times.push(7.0);
        times.push(9.0);
        times.push(10.0);
        const grid = new TimeGrid().init2(times, 0, times.length);
        const N = times.length;
        const samples = 262143;
        const seed = 42;
        const sobol = new SobolRsg().init(N, seed);
        const gsg = new InverseCumulativeRsg(sobol, new InverseCumulativeNormal());
        const today = Settings.evaluationDate.f();
        const x0 = new Handle(new SimpleQuote(100.0));
        const r = new Handle(new FlatForward().ffInit2(today, 0.06, new Actual365Fixed()));
        const q = new Handle(new FlatForward().ffInit2(today, 0.03, new Actual365Fixed()));
        const sigma = new Handle(new BlackConstantVol().bcvInit1(today, new NullCalendar(), 0.20, new Actual365Fixed()));
        const process = new BlackScholesMertonProcess(x0, q, r, sigma);
        const generator1 = new PathGenerator().init2(process, grid, gsg, false);
        const generator2 = new PathGenerator().init2(process, grid, gsg, true);
        const stats1 = new SequenceStatistics(N);
        const stats2 = new SequenceStatistics(N);
        let temp;
        for (let i = 0; i < samples; ++i) {
            const path1 = generator1.next().value;
            temp = Array.from(path1.values().slice(1, path1.length()));
            stats1.add(temp);
            const path2 = generator2.next().value;
            temp = Array.from(path2.values().slice(1, path2.length()));
            stats2.add(temp);
        }
        const expectedMean = stats1.mean();
        const expectedCovariance = stats1.covariance();
        const mean = stats2.mean();
        const covariance = stats2.covariance();
        const meanTolerance = 1.5e-5;
        const covTolerance = 3.0e-3;
        const maxMeanError = maxRelDiff(mean, 0, mean.length, expectedMean, 0);
        const covariance1d = [].concat(...covariance);
        const expectedCovariance1d = [].concat(...expectedCovariance);
        const maxCovError = maxRelDiff(covariance1d, 0, covariance1d.length, expectedCovariance1d, 0);
        expect(maxMeanError).toBeLessThan(meanTolerance);
        expect(maxCovError).toBeLessThan(covTolerance);
    });
});