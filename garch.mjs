import { DateExt, EndCriteria, Garch11, InverseCumulativeNormal, InverseCumulativeRng, LevenbergMarquardt, MersenneTwisterUniformRng, OptimizationMethod, TimeSeries } from '/ql.mjs';

const first = 0, second = 1;

class DummyOptimizationMethod extends OptimizationMethod {
    minimize(P, e) {
        P.setFunctionValue(P.value(P.currentValue()));
        return EndCriteria.Type.None;
    }
}

class Results {
    constructor(alpha, beta, omega, logLikelihood) {
        this.alpha = alpha;
        this.beta = beta;
        this.omega = omega;
        this.logLikelihood = logLikelihood;
    }
}

const tolerance = 1e-6;
const expected_calc = [
    0.452769, 0.513323, 0.530141, 0.5350841, 0.536558, 0.536999, 0.537132,
    0.537171, 0.537183, 0.537187
];

function check_ts(x) {
    expect(DateExt.serialNumber(x[first])).toBeGreaterThan(22835);
    expect(DateExt.serialNumber(x[first])).toBeLessThan(22844);
    const error = Math.abs(x[second] - expected_calc[DateExt.serialNumber(x[first]) - 22835]);
    expect(error).toBeLessThan(tolerance);
}

describe('Testing GARCH model calculation...', () => {
    it('Testing GARCH model calibration...', () => {
        const start = new Date('7-July-1962'), d = start;
        const ts = new TimeSeries();
        const garch = new Garch11().init1(0.2, 0.3, 0.4);
        const rng = new InverseCumulativeRng(new MersenneTwisterUniformRng().init1(48), new InverseCumulativeNormal());
        let r = 0.0, v = 0.0;
        for (let i = 0; i < 50000; ++i, DateExt.adda(d, 1)) {
            v = garch.forecast(r, v);
            r = rng.next().value * Math.sqrt(v);
            ts.set(d, r);
        }
        const cgarch1 = new Garch11().init2(ts);
        const calibrated = new Results(0.207592, 0.281979, 0.204647, -0.0217413);
        expect(Math.abs(calibrated.alpha - cgarch1.alpha()))
            .toBeLessThan(tolerance);
        expect(Math.abs(calibrated.beta - cgarch1.beta())).toBeLessThan(tolerance);
        expect(Math.abs(calibrated.omega - cgarch1.omega()))
            .toBeLessThan(tolerance);
        expect(Math.abs(calibrated.logLikelihood - cgarch1.logLikelihood()))
            .toBeLessThan(tolerance);
        const cgarch2 = new Garch11().init2(ts, Garch11.Mode.MomentMatchingGuess);
        const m = new DummyOptimizationMethod();
        cgarch2.calibrate2(ts, m, new EndCriteria(3, 2, 0.0, 0.0, 0.0));
        const expected1 = new Results(0.265749, 0.156956, 0.230964, -0.0227179);
        expect(Math.abs(expected1.alpha - cgarch2.alpha())).toBeLessThan(tolerance);
        expect(Math.abs(expected1.beta - cgarch2.beta())).toBeLessThan(tolerance);
        expect(Math.abs(expected1.omega - cgarch2.omega())).toBeLessThan(tolerance);
        expect(Math.abs(expected1.logLikelihood - cgarch2.logLikelihood()))
            .toBeLessThan(tolerance);
        cgarch2.calibrate1(ts);
        expect(Math.abs(calibrated.alpha - cgarch2.alpha()))
            .toBeLessThan(tolerance);
        expect(Math.abs(calibrated.beta - cgarch2.beta())).toBeLessThan(tolerance);
        expect(Math.abs(calibrated.omega - cgarch2.omega()))
            .toBeLessThan(tolerance);
        expect(Math.abs(calibrated.logLikelihood - cgarch2.logLikelihood()))
            .toBeLessThan(tolerance);
        const cgarch3 = new Garch11().init2(ts, Garch11.Mode.GammaGuess);
        cgarch3.calibrate2(ts, m, new EndCriteria(3, 2, 0.0, 0.0, 0.0));
        const expected2 = new Results(0.269896, 0.211373, 0.207534, -0.022798);
        expect(Math.abs(expected2.alpha - cgarch3.alpha())).toBeLessThan(tolerance);
        expect(Math.abs(expected2.beta - cgarch3.beta())).toBeLessThan(tolerance);
        expect(Math.abs(expected2.omega - cgarch3.omega())).toBeLessThan(tolerance);
        expect(Math.abs(expected2.logLikelihood - cgarch3.logLikelihood()))
            .toBeLessThan(tolerance);
        cgarch3.calibrate1(ts);
        expect(Math.abs(calibrated.alpha - cgarch3.alpha()))
            .toBeLessThan(tolerance);
        expect(Math.abs(calibrated.beta - cgarch3.beta())).toBeLessThan(tolerance);
        expect(Math.abs(calibrated.omega - cgarch3.omega()))
            .toBeLessThan(tolerance);
        expect(Math.abs(calibrated.logLikelihood - cgarch3.logLikelihood()))
            .toBeLessThan(tolerance);
        const cgarch4 = new Garch11().init2(ts, Garch11.Mode.DoubleOptimization);
        cgarch4.calibrate1(ts);
        expect(Math.abs(calibrated.alpha - cgarch4.alpha()))
            .toBeLessThan(tolerance);
        expect(Math.abs(calibrated.beta - cgarch4.beta())).toBeLessThan(tolerance);
        expect(Math.abs(calibrated.omega - cgarch4.omega()))
            .toBeLessThan(tolerance);
        expect(Math.abs(calibrated.logLikelihood - cgarch4.logLikelihood()))
            .toBeLessThan(tolerance);
        const lm = new LevenbergMarquardt();
        cgarch4.calibrate2(ts, lm, new EndCriteria(100000, 500, 1e-8, 1e-8, 1e-8));
        const expected3 = new Results(0.265196, 0.277364, 0.678812, -0.216313);
        expect(Math.abs(expected3.alpha - cgarch4.alpha())).toBeLessThan(tolerance);
        expect(Math.abs(expected3.beta - cgarch4.beta())).toBeLessThan(tolerance);
        expect(Math.abs(expected3.omega - cgarch4.omega())).toBeLessThan(tolerance);
        expect(Math.abs(expected3.logLikelihood - cgarch4.logLikelihood()))
            .toBeLessThan(tolerance);
    });
    it('Testing GARCH model calculation...', () => {
        let d = new Date('7-July-1962');
        const ts = new TimeSeries();
        const garch = new Garch11().init1(0.2, 0.3, 0.4);
        const r = 0.1;
        for (let i = 0; i < 10; ++i, d = DateExt.add(d, 1)) {
            ts.set(d, r);
        }
        const tsout = garch.calculate1(ts);
        tsout.dates().forEach(d => check_ts([d, tsout.get(d)]));
    });
});