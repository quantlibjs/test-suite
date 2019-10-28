import '/test-suite/quantlibtestsuite.mjs';
import { Actual360, AnalyticContinuousGeometricAveragePriceAsianEngine, AnalyticDiscreteGeometricAveragePriceAsianEngine, AnalyticDiscreteGeometricAverageStrikeAsianEngine, Average, BlackScholesMertonProcess, Comparison, ContinuousArithmeticAsianLevyEngine, ContinuousArithmeticAsianVecerEngine, ContinuousAveragingAsianOption, DateExt, DiscreteAveragingAsianOption, EuropeanExercise, FdBlackScholesAsianEngine, Handle, LowDiscrepancy, MakeMCDiscreteArithmeticAPEngine, MakeMCDiscreteArithmeticASEngine, MakeMCDiscreteGeometricAPEngine, Option, PlainVanillaPayoff, QL_NULL_INTEGER, QL_NULL_REAL, SavedSettings, Settings, SimpleQuote, TimeUnit, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate1, flatRate2, flatRate3, flatVol1, flatVol2, flatVol3, relativeError } from '/test-suite/utilities.mjs';

const first = 0;

class DiscreteAverageData {
    constructor(type, underlying, strike, dividendYield, riskFreeRate, first, length, fixings, volatility, controlVariate, result) {
        this.type = type;
        this.underlying = underlying;
        this.strike = strike;
        this.dividendYield = dividendYield;
        this.riskFreeRate = riskFreeRate;
        this.first = first;
        this.length = length;
        this.fixings = fixings;
        this.volatility = volatility;
        this.controlVariate = controlVariate;
        this.result = result;
    }
}

class ContinuousAverageData {
    constructor(type, spot, currentAverage, strike, dividendYield, riskFreeRate, volatility, length, elapsed, result) {
        this.type = type;
        this.spot = spot;
        this.currentAverage = currentAverage;
        this.strike = strike;
        this.dividendYield = dividendYield;
        this.riskFreeRate = riskFreeRate;
        this.volatility = volatility;
        this.length = length;
        this.elapsed = elapsed;
        this.result = result;
    }
}

class VecerData {
    constructor(spot, riskFreeRate, volatility, strike, length, result, tolerance) {
        this.spot = spot;
        this.riskFreeRate = riskFreeRate;
        this.volatility = volatility;
        this.strike = strike;
        this.length = length;
        this.result = result;
        this.tolerance = tolerance;
    }
}

describe(`Asian option tests ${version}`, () => {
    it('Testing analytic continuous geometric average-price Asians...', () => {
        const dc = new Actual360();
        const today = Settings.evaluationDate.f();
        const spot = new SimpleQuote(80.0);
        const qRate = new SimpleQuote(-0.03);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.05);
        const rTS = flatRate1(today, rRate, dc);
        const vol = new SimpleQuote(0.20);
        const volTS = flatVol1(today, vol, dc);
        const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
        const engine = new AnalyticContinuousGeometricAveragePriceAsianEngine(stochProcess);
        const averageType = Average.Type.Geometric;
        const type = Option.Type.Put;
        const strike = 85.0;
        const exerciseDate = DateExt.add(today, 90);
        let pastFixings = QL_NULL_INTEGER;
        let runningAccumulator = QL_NULL_REAL;
        const payoff = new PlainVanillaPayoff(type, strike);
        const exercise = new EuropeanExercise(exerciseDate);
        const option = new ContinuousAveragingAsianOption(averageType, payoff, exercise);
        option.setPricingEngine(engine);
        let calculated = option.NPV();
        const expected = 4.6922;
        let tolerance = 1.0e-4;
        expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
        runningAccumulator = 1.0;
        pastFixings = 0;
        const fixingDates = new Array(DateExt.daysBetween(today, exerciseDate) + 1);
        for (let i = 0; i < fixingDates.length; i++) {
            fixingDates[i] = DateExt.add(today, i);
        }
        const engine2 = new AnalyticDiscreteGeometricAveragePriceAsianEngine(stochProcess);
        const option2 = new DiscreteAveragingAsianOption(averageType, runningAccumulator, pastFixings, fixingDates, payoff, exercise);
        option2.setPricingEngine(engine2);
        calculated = option2.NPV();
        tolerance = 3.0e-3;
        expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
    });

    it('Testing analytic continuous geometric average-price Asian greeks...', () => {
        const backup = new SavedSettings();
        const calculated = new Map(), expected = new Map(), tolerance = new Map();
        tolerance.set('delta', 1.0e-5);
        tolerance.set('gamma', 1.0e-5);
        tolerance.set('theta', 1.0e-5);
        tolerance.set('rho', 1.0e-5);
        tolerance.set('divRho', 1.0e-5);
        tolerance.set('vega', 1.0e-5);
        const types = [Option.Type.Call, Option.Type.Put];
        const underlyings = [100.0];
        const strikes = [90.0, 100.0, 110.0];
        const qRates = [0.04, 0.05, 0.06];
        const rRates = [0.01, 0.05, 0.15];
        const lengths = [1, 2];
        const vols = [0.11, 0.50, 1.20];
        const dc = new Actual360();
        const today = Settings.evaluationDate.f();
        Settings.evaluationDate.set(today);
        const spot = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.0);
        const qTS = new Handle(flatRate1(today, qRate, dc));
        const rRate = new SimpleQuote(0.0);
        const rTS = new Handle(flatRate1(today, rRate, dc));
        const vol = new SimpleQuote(0.0);
        const volTS = new Handle(flatVol1(today, vol, dc));
        const process = new BlackScholesMertonProcess(new Handle(spot), qTS, rTS, volTS);
        for (let i = 0; i < types.length; i++) {
            for (let j = 0; j < strikes.length; j++) {
                for (let k = 0; k < lengths.length; k++) {
                    const maturity = new EuropeanExercise(DateExt.advance(today, lengths[k], TimeUnit.Years));
                    const payoff = new PlainVanillaPayoff(types[i], strikes[j]);
                    const engine = new AnalyticContinuousGeometricAveragePriceAsianEngine(process);
                    const option = new ContinuousAveragingAsianOption(Average.Type.Geometric, payoff, maturity);
                    option.setPricingEngine(engine);
                    for (let l = 0; l < underlyings.length; l++) {
                        for (let m = 0; m < qRates.length; m++) {
                            for (let n = 0; n < rRates.length; n++) {
                                for (let p = 0; p < vols.length; p++) {
                                    const u = underlyings[l];
                                    const q = qRates[m], r = rRates[n];
                                    const v = vols[p];
                                    spot.setValue(u);
                                    qRate.setValue(q);
                                    rRate.setValue(r);
                                    vol.setValue(v);
                                    const value = option.NPV();
                                    calculated.set('delta', option.delta());
                                    calculated.set('gamma', option.gamma());
                                    calculated.set('theta', option.theta());
                                    calculated.set('rho', option.rho());
                                    calculated.set('divRho', option.dividendRho());
                                    calculated.set('vega', option.vega());
                                    if (value > spot.value() * 1.0e-5) {
                                        const du = u * 1.0e-4;
                                        spot.setValue(u + du);
                                        let value_p = option.NPV();
                                        const delta_p = option.delta();
                                        spot.setValue(u - du);
                                        let value_m = option.NPV();
                                        const delta_m = option.delta();
                                        spot.setValue(u);
                                        expected.set('delta', (value_p - value_m) / (2 * du));
                                        expected.set('gamma', (delta_p - delta_m) / (2 * du));
                                        const dr = r * 1.0e-4;
                                        rRate.setValue(r + dr);
                                        value_p = option.NPV();
                                        rRate.setValue(r - dr);
                                        value_m = option.NPV();
                                        rRate.setValue(r);
                                        expected.set('rho', (value_p - value_m) / (2 * dr));
                                        const dq = q * 1.0e-4;
                                        qRate.setValue(q + dq);
                                        value_p = option.NPV();
                                        qRate.setValue(q - dq);
                                        value_m = option.NPV();
                                        qRate.setValue(q);
                                        expected.set('divRho', (value_p - value_m) / (2 * dq));
                                        const dv = v * 1.0e-4;
                                        vol.setValue(v + dv);
                                        value_p = option.NPV();
                                        vol.setValue(v - dv);
                                        value_m = option.NPV();
                                        vol.setValue(v);
                                        expected.set('vega', (value_p - value_m) / (2 * dv));
                                        const dT = dc.yearFraction(DateExt.sub(today, 1), DateExt.add(today, 1));
                                        Settings.evaluationDate.set(DateExt.sub(today, 1));
                                        value_m = option.NPV();
                                        Settings.evaluationDate.set(DateExt.add(today, 1));
                                        value_p = option.NPV();
                                        Settings.evaluationDate.set(today);
                                        expected.set('theta', (value_p - value_m) / dT);
                                        let it;
                                        const calc = Array.from(calculated);
                                        for (it = 0; it < calc.length; ++it) {
                                            const greek = calc[it][first];
                                            const expct = expected.get(greek), calcl = calculated.get(greek), tol = tolerance.get(greek);
                                            const error = relativeError(expct, calcl, u);
                                            expect(error).toBeLessThan(tol);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        backup.dispose();
    });

    it('Testing analytic discrete geometric average-price Asians...', () => {
        const dc = new Actual360();
        const today = Settings.evaluationDate.f();
        const spot = new SimpleQuote(100.0);
        const qRate = new SimpleQuote(0.03);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.06);
        const rTS = flatRate1(today, rRate, dc);
        const vol = new SimpleQuote(0.20);
        const volTS = flatVol1(today, vol, dc);
        const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
        const engine = new AnalyticDiscreteGeometricAveragePriceAsianEngine(stochProcess);
        const averageType = Average.Type.Geometric;
        const runningAccumulator = 1.0;
        const pastFixings = 0;
        const futureFixings = 10;
        const type = Option.Type.Call;
        const strike = 100.0;
        const payoff = new PlainVanillaPayoff(type, strike);
        const exerciseDate = DateExt.add(today, 360);
        const exercise = new EuropeanExercise(exerciseDate);
        const fixingDates = new Array(futureFixings);
        const dt = Math.floor(360 / futureFixings + 0.5);
        fixingDates[0] = DateExt.add(today, dt);
        for (let j = 1; j < futureFixings; j++) {
            fixingDates[j] = DateExt.add(fixingDates[j - 1], dt);
        }
        const option = new DiscreteAveragingAsianOption(averageType, runningAccumulator, pastFixings, fixingDates, payoff, exercise);
        option.setPricingEngine(engine);
        const calculated = option.NPV();
        const expected = 5.3425606635;
        const tolerance = 1e-10;
        expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
    });

    it('Testing analytic discrete geometric average-strike Asians...', () => {
        const dc = new Actual360();
        const today = Settings.evaluationDate.f();
        const spot = new SimpleQuote(100.0);
        const qRate = new SimpleQuote(0.03);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.06);
        const rTS = flatRate1(today, rRate, dc);
        const vol = new SimpleQuote(0.20);
        const volTS = flatVol1(today, vol, dc);
        const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
        const engine = new AnalyticDiscreteGeometricAverageStrikeAsianEngine(stochProcess);
        const averageType = Average.Type.Geometric;
        const runningAccumulator = 1.0;
        const pastFixings = 0;
        const futureFixings = 10;
        const type = Option.Type.Call;
        const strike = 100.0;
        const payoff = new PlainVanillaPayoff(type, strike);
        const exerciseDate = DateExt.add(today, 360);
        const exercise = new EuropeanExercise(exerciseDate);
        const fixingDates = new Array(futureFixings);
        const dt = Math.floor(360 / futureFixings + 0.5);
        fixingDates[0] = DateExt.add(today, dt);
        for (let j = 1; j < futureFixings; j++) {
            fixingDates[j] = DateExt.add(fixingDates[j - 1], dt);
        }
        const option = new DiscreteAveragingAsianOption(averageType, runningAccumulator, pastFixings, fixingDates, payoff, exercise);
        option.setPricingEngine(engine);
        const calculated = option.NPV();
        const expected = 4.97109;
        const tolerance = 1e-5;
        expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
    });

    it('Testing Monte Carlo discrete geometric average-price Asians...', () => {
        const dc = new Actual360();
        const today = Settings.evaluationDate.f();
        const spot = new SimpleQuote(100.0);
        const qRate = new SimpleQuote(0.03);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.06);
        const rTS = flatRate1(today, rRate, dc);
        const vol = new SimpleQuote(0.20);
        const volTS = flatVol1(today, vol, dc);
        const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
        const tolerance = 4.0e-3;
        const engine = new MakeMCDiscreteGeometricAPEngine(new LowDiscrepancy())
            .init(stochProcess)
            .withSamples(8191)
            .f();
        const averageType = Average.Type.Geometric;
        const runningAccumulator = 1.0;
        const pastFixings = 0;
        const futureFixings = 10;
        const type = Option.Type.Call;
        const strike = 100.0;
        const payoff = new PlainVanillaPayoff(type, strike);
        const exerciseDate = DateExt.add(today, 360);
        const exercise = new EuropeanExercise(exerciseDate);
        const fixingDates = new Array(futureFixings);
        const dt = Math.floor(360 / futureFixings + 0.5);
        fixingDates[0] = DateExt.add(today, dt);
        for (let j = 1; j < futureFixings; j++) {
            fixingDates[j] = DateExt.add(fixingDates[j - 1], dt);
        }
        const option = new DiscreteAveragingAsianOption(averageType, runningAccumulator, pastFixings, fixingDates, payoff, exercise);
        option.setPricingEngine(engine);
        const calculated = option.NPV();
        const engine2 = new AnalyticDiscreteGeometricAveragePriceAsianEngine(stochProcess);
        option.setPricingEngine(engine2);
        const expected = option.NPV();
        expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
    });

    it('Testing Monte Carlo discrete arithmetic average-price Asians...', () => {
        const cases4 = [
            new DiscreteAverageData(Option.Type.Put, 90.0, 87.0, 0.06, 0.025, 0.0, 11.0 / 12.0, 2, 0.13, true, 1.3942835683),
            new DiscreteAverageData(Option.Type.Put, 90.0, 87.0, 0.06, 0.025, 0.0, 11.0 / 12.0, 4, 0.13, true, 1.5852442983),
            new DiscreteAverageData(Option.Type.Put, 90.0, 87.0, 0.06, 0.025, 0.0, 11.0 / 12.0, 8, 0.13, true, 1.66970673),
            new DiscreteAverageData(Option.Type.Put, 90.0, 87.0, 0.06, 0.025, 0.0, 11.0 / 12.0, 12, 0.13, true, 1.6980019214),
            new DiscreteAverageData(Option.Type.Put, 90.0, 87.0, 0.06, 0.025, 0.0, 11.0 / 12.0, 26, 0.13, true, 1.7255070456),
            new DiscreteAverageData(Option.Type.Put, 90.0, 87.0, 0.06, 0.025, 0.0, 11.0 / 12.0, 52, 0.13, true, 1.7401553533),
            new DiscreteAverageData(Option.Type.Put, 90.0, 87.0, 0.06, 0.025, 0.0, 11.0 / 12.0, 100, 0.13, true, 1.7478303712),
            new DiscreteAverageData(Option.Type.Put, 90.0, 87.0, 0.06, 0.025, 0.0, 11.0 / 12.0, 250, 0.13, true, 1.7490291943),
            new DiscreteAverageData(Option.Type.Put, 90.0, 87.0, 0.06, 0.025, 0.0, 11.0 / 12.0, 500, 0.13, true, 1.7515113291),
            new DiscreteAverageData(Option.Type.Put, 90.0, 87.0, 0.06, 0.025, 0.0, 11.0 / 12.0, 1000, 0.13, true, 1.7537344885),
            new DiscreteAverageData(Option.Type.Put, 90.0, 87.0, 0.06, 0.025, 1.0 / 12.0, 11.0 / 12.0, 2, 0.13, true, 1.8496053697),
            new DiscreteAverageData(Option.Type.Put, 90.0, 87.0, 0.06, 0.025, 1.0 / 12.0, 11.0 / 12.0, 4, 0.13, true, 2.0111495205),
            new DiscreteAverageData(Option.Type.Put, 90.0, 87.0, 0.06, 0.025, 1.0 / 12.0, 11.0 / 12.0, 8, 0.13, true, 2.0852138818),
            new DiscreteAverageData(Option.Type.Put, 90.0, 87.0, 0.06, 0.025, 1.0 / 12.0, 11.0 / 12.0, 12, 0.13, true, 2.1105094397),
            new DiscreteAverageData(Option.Type.Put, 90.0, 87.0, 0.06, 0.025, 1.0 / 12.0, 11.0 / 12.0, 26, 0.13, true, 2.1346526695),
            new DiscreteAverageData(Option.Type.Put, 90.0, 87.0, 0.06, 0.025, 1.0 / 12.0, 11.0 / 12.0, 52, 0.13, true, 2.147489651),
            new DiscreteAverageData(Option.Type.Put, 90.0, 87.0, 0.06, 0.025, 1.0 / 12.0, 11.0 / 12.0, 100, 0.13, true, 2.154728109),
            new DiscreteAverageData(Option.Type.Put, 90.0, 87.0, 0.06, 0.025, 1.0 / 12.0, 11.0 / 12.0, 250, 0.13, true, 2.1564276565),
            new DiscreteAverageData(Option.Type.Put, 90.0, 87.0, 0.06, 0.025, 1.0 / 12.0, 11.0 / 12.0, 500, 0.13, true, 2.1594238588),
            new DiscreteAverageData(Option.Type.Put, 90.0, 87.0, 0.06, 0.025, 1.0 / 12.0, 11.0 / 12.0, 1000, 0.13, true, 2.1595367326),
            new DiscreteAverageData(Option.Type.Put, 90.0, 87.0, 0.06, 0.025, 3.0 / 12.0, 11.0 / 12.0, 2, 0.13, true, 2.63315092584),
            new DiscreteAverageData(Option.Type.Put, 90.0, 87.0, 0.06, 0.025, 3.0 / 12.0, 11.0 / 12.0, 4, 0.13, true, 2.76723962361),
            new DiscreteAverageData(Option.Type.Put, 90.0, 87.0, 0.06, 0.025, 3.0 / 12.0, 11.0 / 12.0, 8, 0.13, true, 2.83124836881),
            new DiscreteAverageData(Option.Type.Put, 90.0, 87.0, 0.06, 0.025, 3.0 / 12.0, 11.0 / 12.0, 12, 0.13, true, 2.84290301412),
            new DiscreteAverageData(Option.Type.Put, 90.0, 87.0, 0.06, 0.025, 3.0 / 12.0, 11.0 / 12.0, 26, 0.13, true, 2.88179560417),
            new DiscreteAverageData(Option.Type.Put, 90.0, 87.0, 0.06, 0.025, 3.0 / 12.0, 11.0 / 12.0, 52, 0.13, true, 2.88447044543),
            new DiscreteAverageData(Option.Type.Put, 90.0, 87.0, 0.06, 0.025, 3.0 / 12.0, 11.0 / 12.0, 100, 0.13, true, 2.89985329603),
            new DiscreteAverageData(Option.Type.Put, 90.0, 87.0, 0.06, 0.025, 3.0 / 12.0, 11.0 / 12.0, 250, 0.13, true, 2.90047296063),
            new DiscreteAverageData(Option.Type.Put, 90.0, 87.0, 0.06, 0.025, 3.0 / 12.0, 11.0 / 12.0, 500, 0.13, true, 2.89813412160),
            new DiscreteAverageData(Option.Type.Put, 90.0, 87.0, 0.06, 0.025, 3.0 / 12.0, 11.0 / 12.0, 1000, 0.13, true, 2.89703362437)
        ];
        const dc = new Actual360();
        const today = Settings.evaluationDate.f();
        const spot = new SimpleQuote(100.0);
        const qRate = new SimpleQuote(0.03);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.06);
        const rTS = flatRate1(today, rRate, dc);
        const vol = new SimpleQuote(0.20);
        const volTS = flatVol1(today, vol, dc);
        const averageType = Average.Type.Arithmetic;
        const runningSum = 0.0;
        const pastFixings = 0;
        for (let l = 0; l < cases4.length; l++) {
            const payoff = new PlainVanillaPayoff(cases4[l].type, cases4[l].strike);
            const dt = cases4[l].length / (cases4[l].fixings - 1);
            const timeIncrements = new Array(cases4[l].fixings);
            const fixingDates = new Array(cases4[l].fixings);
            timeIncrements[0] = cases4[l].first;
            fixingDates[0] =
                DateExt.add(today, Math.floor(timeIncrements[0] * 360 + 0.5));
            for (let i = 1; i < cases4[l].fixings; i++) {
                timeIncrements[i] = i * dt + cases4[l].first;
                fixingDates[i] =
                    DateExt.add(today, Math.floor(timeIncrements[i] * 360 + 0.5));
            }
            const exercise = new EuropeanExercise(fixingDates[cases4[l].fixings - 1]);
            spot.setValue(cases4[l].underlying);
            qRate.setValue(cases4[l].dividendYield);
            rRate.setValue(cases4[l].riskFreeRate);
            vol.setValue(cases4[l].volatility);
            const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
            let engine = new MakeMCDiscreteArithmeticAPEngine(new LowDiscrepancy())
                .init(stochProcess)
                .withSamples(2047)
                .withControlVariate(cases4[l].controlVariate)
                .f();
            const option = new DiscreteAveragingAsianOption(averageType, runningSum, pastFixings, fixingDates, payoff, exercise);
            option.setPricingEngine(engine);
            let calculated = option.NPV();
            const expected = cases4[l].result;
            const tolerance = 2.0e-2;
            expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
            if (cases4[l].fixings < 100) {
                engine = new FdBlackScholesAsianEngine(stochProcess, 100, 100, 100);
                option.setPricingEngine(engine);
                calculated = option.NPV();
                expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
            }
        }
    });

    it('Testing Monte Carlo discrete arithmetic average-strike Asians...', () => {
        const cases5 = [
            new DiscreteAverageData(Option.Type.Call, 90.0, 87.0, 0.06, 0.025, 0.0, 11.0 / 12.0, 2, 0.13, true, 1.51917595129),
            new DiscreteAverageData(Option.Type.Call, 90.0, 87.0, 0.06, 0.025, 0.0, 11.0 / 12.0, 4, 0.13, true, 1.67940165674),
            new DiscreteAverageData(Option.Type.Call, 90.0, 87.0, 0.06, 0.025, 0.0, 11.0 / 12.0, 8, 0.13, true, 1.75371215251),
            new DiscreteAverageData(Option.Type.Call, 90.0, 87.0, 0.06, 0.025, 0.0, 11.0 / 12.0, 12, 0.13, true, 1.77595318693),
            new DiscreteAverageData(Option.Type.Call, 90.0, 87.0, 0.06, 0.025, 0.0, 11.0 / 12.0, 26, 0.13, true, 1.81430536630),
            new DiscreteAverageData(Option.Type.Call, 90.0, 87.0, 0.06, 0.025, 0.0, 11.0 / 12.0, 52, 0.13, true, 1.82269246898),
            new DiscreteAverageData(Option.Type.Call, 90.0, 87.0, 0.06, 0.025, 0.0, 11.0 / 12.0, 100, 0.13, true, 1.83822402464),
            new DiscreteAverageData(Option.Type.Call, 90.0, 87.0, 0.06, 0.025, 0.0, 11.0 / 12.0, 250, 0.13, true, 1.83875059026),
            new DiscreteAverageData(Option.Type.Call, 90.0, 87.0, 0.06, 0.025, 0.0, 11.0 / 12.0, 500, 0.13, true, 1.83750703638),
            new DiscreteAverageData(Option.Type.Call, 90.0, 87.0, 0.06, 0.025, 0.0, 11.0 / 12.0, 1000, 0.13, true, 1.83887181884),
            new DiscreteAverageData(Option.Type.Call, 90.0, 87.0, 0.06, 0.025, 1.0 / 12.0, 11.0 / 12.0, 2, 0.13, true, 1.51154400089),
            new DiscreteAverageData(Option.Type.Call, 90.0, 87.0, 0.06, 0.025, 1.0 / 12.0, 11.0 / 12.0, 4, 0.13, true, 1.67103508506),
            new DiscreteAverageData(Option.Type.Call, 90.0, 87.0, 0.06, 0.025, 1.0 / 12.0, 11.0 / 12.0, 8, 0.13, true, 1.74529684070),
            new DiscreteAverageData(Option.Type.Call, 90.0, 87.0, 0.06, 0.025, 1.0 / 12.0, 11.0 / 12.0, 12, 0.13, true, 1.76667074564),
            new DiscreteAverageData(Option.Type.Call, 90.0, 87.0, 0.06, 0.025, 1.0 / 12.0, 11.0 / 12.0, 26, 0.13, true, 1.80528400613),
            new DiscreteAverageData(Option.Type.Call, 90.0, 87.0, 0.06, 0.025, 1.0 / 12.0, 11.0 / 12.0, 52, 0.13, true, 1.81400883891),
            new DiscreteAverageData(Option.Type.Call, 90.0, 87.0, 0.06, 0.025, 1.0 / 12.0, 11.0 / 12.0, 100, 0.13, true, 1.82922901451),
            new DiscreteAverageData(Option.Type.Call, 90.0, 87.0, 0.06, 0.025, 1.0 / 12.0, 11.0 / 12.0, 250, 0.13, true, 1.82937111773),
            new DiscreteAverageData(Option.Type.Call, 90.0, 87.0, 0.06, 0.025, 1.0 / 12.0, 11.0 / 12.0, 500, 0.13, true, 1.82826193186),
            new DiscreteAverageData(Option.Type.Call, 90.0, 87.0, 0.06, 0.025, 1.0 / 12.0, 11.0 / 12.0, 1000, 0.13, true, 1.82967846654),
            new DiscreteAverageData(Option.Type.Call, 90.0, 87.0, 0.06, 0.025, 3.0 / 12.0, 11.0 / 12.0, 2, 0.13, true, 1.49648170891),
            new DiscreteAverageData(Option.Type.Call, 90.0, 87.0, 0.06, 0.025, 3.0 / 12.0, 11.0 / 12.0, 4, 0.13, true, 1.65443100462),
            new DiscreteAverageData(Option.Type.Call, 90.0, 87.0, 0.06, 0.025, 3.0 / 12.0, 11.0 / 12.0, 8, 0.13, true, 1.72817806731),
            new DiscreteAverageData(Option.Type.Call, 90.0, 87.0, 0.06, 0.025, 3.0 / 12.0, 11.0 / 12.0, 12, 0.13, true, 1.74877367895),
            new DiscreteAverageData(Option.Type.Call, 90.0, 87.0, 0.06, 0.025, 3.0 / 12.0, 11.0 / 12.0, 26, 0.13, true, 1.78733801988),
            new DiscreteAverageData(Option.Type.Call, 90.0, 87.0, 0.06, 0.025, 3.0 / 12.0, 11.0 / 12.0, 52, 0.13, true, 1.79624826757),
            new DiscreteAverageData(Option.Type.Call, 90.0, 87.0, 0.06, 0.025, 3.0 / 12.0, 11.0 / 12.0, 100, 0.13, true, 1.81114186876),
            new DiscreteAverageData(Option.Type.Call, 90.0, 87.0, 0.06, 0.025, 3.0 / 12.0, 11.0 / 12.0, 250, 0.13, true, 1.81101152587),
            new DiscreteAverageData(Option.Type.Call, 90.0, 87.0, 0.06, 0.025, 3.0 / 12.0, 11.0 / 12.0, 500, 0.13, true, 1.81002311939),
            new DiscreteAverageData(Option.Type.Call, 90.0, 87.0, 0.06, 0.025, 3.0 / 12.0, 11.0 / 12.0, 1000, 0.13, true, 1.81145760308)
        ];
        const dc = new Actual360();
        const today = Settings.evaluationDate.f();
        const spot = new SimpleQuote(100.0);
        const qRate = new SimpleQuote(0.03);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.06);
        const rTS = flatRate1(today, rRate, dc);
        const vol = new SimpleQuote(0.20);
        const volTS = flatVol1(today, vol, dc);
        const averageType = Average.Type.Arithmetic;
        const runningSum = 0.0;
        const pastFixings = 0;
        for (let l = 0; l < cases5.length; l++) {
            const payoff = new PlainVanillaPayoff(cases5[l].type, cases5[l].strike);
            const dt = cases5[l].length / (cases5[l].fixings - 1);
            const timeIncrements = new Array(cases5[l].fixings);
            const fixingDates = new Array(cases5[l].fixings);
            timeIncrements[0] = cases5[l].first;
            fixingDates[0] =
                DateExt.add(today, Math.floor(timeIncrements[0] * 360 + 0.5));
            for (let i = 1; i < cases5[l].fixings; i++) {
                timeIncrements[i] = i * dt + cases5[l].first;
                fixingDates[i] =
                    DateExt.add(today, Math.floor(timeIncrements[i] * 360 + 0.5));
            }
            const exercise = new EuropeanExercise(fixingDates[cases5[l].fixings - 1]);
            spot.setValue(cases5[l].underlying);
            qRate.setValue(cases5[l].dividendYield);
            rRate.setValue(cases5[l].riskFreeRate);
            vol.setValue(cases5[l].volatility);
            const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
            const engine = new MakeMCDiscreteArithmeticASEngine(new LowDiscrepancy(), stochProcess)
                .withSeed(3456789)
                .withSamples(1023)
                .f();
            const option = new DiscreteAveragingAsianOption(averageType, runningSum, pastFixings, fixingDates, payoff, exercise);
            option.setPricingEngine(engine);
            const calculated = option.NPV();
            const expected = cases5[l].result;
            const tolerance = 2.0e-2;
            expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
        }
    });

    it('Testing discrete-averaging geometric Asian greeks...', () => {
        const backup = new SavedSettings();
        const calculated = new Map(), expected = new Map(), tolerance = new Map();
        tolerance.set('delta', 1.0e-5);
        tolerance.set('gamma', 1.0e-5);
        tolerance.set('theta', 1.0e-5);
        tolerance.set('rho', 1.0e-5);
        tolerance.set('divRho', 1.0e-5);
        tolerance.set('vega', 1.0e-5);
        const types = [Option.Type.Call, Option.Type.Put];
        const underlyings = [100.0];
        const strikes = [90.0, 100.0, 110.0];
        const qRates = [0.04, 0.05, 0.06];
        const rRates = [0.01, 0.05, 0.15];
        const lengths = [1, 2];
        const vols = [0.11, 0.50, 1.20];
        const dc = new Actual360();
        const today = Settings.evaluationDate.f();
        Settings.evaluationDate.set(today);
        const spot = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.0);
        const qTS = new Handle(flatRate3(qRate, dc));
        const rRate = new SimpleQuote(0.0);
        const rTS = new Handle(flatRate3(rRate, dc));
        const vol = new SimpleQuote(0.0);
        const volTS = new Handle(flatVol3(vol, dc));
        const process = new BlackScholesMertonProcess(new Handle(spot), qTS, rTS, volTS);
        for (let i = 0; i < types.length; i++) {
            for (let j = 0; j < strikes.length; j++) {
                for (let k = 0; k < lengths.length; k++) {
                    const maturity = new EuropeanExercise(DateExt.advance(today, lengths[k], TimeUnit.Years));
                    const payoff = new PlainVanillaPayoff(types[i], strikes[j]);
                    const runningAverage = 120;
                    const pastFixings = 1;
                    const fixingDates = [];
                    for (let d = DateExt.advance(today, 3, TimeUnit.Months); d.valueOf() <= maturity.lastDate().valueOf(); d = DateExt.advance(d, 3, TimeUnit.Months)) {
                        fixingDates.push(d);
                    }
                    const engine = new AnalyticDiscreteGeometricAveragePriceAsianEngine(process);
                    const option = new DiscreteAveragingAsianOption(Average.Type.Geometric, runningAverage, pastFixings, fixingDates, payoff, maturity);
                    option.setPricingEngine(engine);
                    for (let l = 0; l < underlyings.length; l++) {
                        for (let m = 0; m < qRates.length; m++) {
                            for (let n = 0; n < rRates.length; n++) {
                                for (let p = 0; p < vols.length; p++) {
                                    const u = underlyings[l];
                                    const q = qRates[m], r = rRates[n];
                                    const v = vols[p];
                                    spot.setValue(u);
                                    qRate.setValue(q);
                                    rRate.setValue(r);
                                    vol.setValue(v);
                                    const value = option.NPV();
                                    calculated.set('delta', option.delta());
                                    calculated.set('gamma', option.gamma());
                                    calculated.set('theta', option.theta());
                                    calculated.set('rho', option.rho());
                                    calculated.set('divRho', option.dividendRho());
                                    calculated.set('vega', option.vega());
                                    if (value > spot.value() * 1.0e-5) {
                                        const du = u * 1.0e-4;
                                        spot.setValue(u + du);
                                        let value_p = option.NPV();
                                        const delta_p = option.delta();
                                        spot.setValue(u - du);
                                        let value_m = option.NPV();
                                        const delta_m = option.delta();
                                        spot.setValue(u);
                                        expected.set('delta', (value_p - value_m) / (2 * du));
                                        expected.set('gamma', (delta_p - delta_m) / (2 * du));
                                        const dr = r * 1.0e-4;
                                        rRate.setValue(r + dr);
                                        value_p = option.NPV();
                                        rRate.setValue(r - dr);
                                        value_m = option.NPV();
                                        rRate.setValue(r);
                                        expected.set('rho', (value_p - value_m) / (2 * dr));
                                        const dq = q * 1.0e-4;
                                        qRate.setValue(q + dq);
                                        value_p = option.NPV();
                                        qRate.setValue(q - dq);
                                        value_m = option.NPV();
                                        qRate.setValue(q);
                                        expected.set('divRho', (value_p - value_m) / (2 * dq));
                                        const dv = v * 1.0e-4;
                                        vol.setValue(v + dv);
                                        value_p = option.NPV();
                                        vol.setValue(v - dv);
                                        value_m = option.NPV();
                                        vol.setValue(v);
                                        expected.set('vega', (value_p - value_m) / (2 * dv));
                                        const dT = dc.yearFraction(DateExt.sub(today, 1), DateExt.add(today, 1));
                                        Settings.evaluationDate.set(DateExt.sub(today, 1));
                                        value_m = option.NPV();
                                        Settings.evaluationDate.set(DateExt.add(today, 1));
                                        value_p = option.NPV();
                                        Settings.evaluationDate.set(today);
                                        expected.set('theta', (value_p - value_m) / dT);
                                        const it = Array.from(calculated.entries());
                                        for (let i = 0; i < it.length; ++i) {
                                            const greek = it[i][first];
                                            const expct = expected.get(greek), calcl = calculated.get(greek), tol = tolerance.get(greek);
                                            const error = relativeError(expct, calcl, u);
                                            expect(error).toBeLessThan(tol);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        backup.dispose();
    });

    it('Testing use of past fixings in Asian options...', () => {
        const dc = new Actual360();
        const today = Settings.evaluationDate.f();
        const spot = new SimpleQuote(100.0);
        const qRate = new SimpleQuote(0.03);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.06);
        const rTS = flatRate1(today, rRate, dc);
        const vol = new SimpleQuote(0.20);
        const volTS = flatVol1(today, vol, dc);
        const payoff = new PlainVanillaPayoff(Option.Type.Put, 100.0);
        const exercise = new EuropeanExercise(DateExt.advance(today, 1, TimeUnit.Years));
        const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
        let runningSum = 0.0;
        let pastFixings = 0;
        const fixingDates1 = [];
        for (let i = 0; i <= 12; ++i) {
            fixingDates1.push(DateExt.advance(today, i, TimeUnit.Months));
        }
        const option1 = new DiscreteAveragingAsianOption(Average.Type.Arithmetic, runningSum, pastFixings, fixingDates1, payoff, exercise);
        pastFixings = 2;
        runningSum = pastFixings * spot.value() * 0.8;
        const fixingDates2 = [];
        for (let i = -2; i <= 12; ++i) {
            fixingDates2.push(DateExt.advance(today, i, TimeUnit.Months));
        }
        const option2 = new DiscreteAveragingAsianOption(Average.Type.Arithmetic, runningSum, pastFixings, fixingDates2, payoff, exercise);
        let engine = new MakeMCDiscreteArithmeticAPEngine(new LowDiscrepancy(), stochProcess)
            .withSamples(2047)
            .f();
        option1.setPricingEngine(engine);
        option2.setPricingEngine(engine);
        let price1 = option1.NPV();
        let price2 = option2.NPV();
        expect(Comparison.close(price1, price2)).toBeFalsy();
        engine =
            new MakeMCDiscreteArithmeticASEngine(new LowDiscrepancy(), stochProcess)
                .withSamples(2047)
                .f();
        option1.setPricingEngine(engine);
        option2.setPricingEngine(engine);
        price1 = option1.NPV();
        price2 = option2.NPV();
        expect(Comparison.close(price1, price2)).toBeFalsy();
        let runningProduct = 1.0;
        pastFixings = 0;
        const option3 = new DiscreteAveragingAsianOption(Average.Type.Geometric, runningProduct, pastFixings, fixingDates1, payoff, exercise);
        pastFixings = 2;
        runningProduct = spot.value() * spot.value();
        const option4 = new DiscreteAveragingAsianOption(Average.Type.Geometric, runningProduct, pastFixings, fixingDates2, payoff, exercise);
        engine = new AnalyticDiscreteGeometricAveragePriceAsianEngine(stochProcess);
        option3.setPricingEngine(engine);
        option4.setPricingEngine(engine);
        let price3 = option3.NPV();
        let price4 = option4.NPV();
        expect(Comparison.close(price3, price4)).toBeFalsy();
        engine =
            new MakeMCDiscreteGeometricAPEngine(new LowDiscrepancy(), stochProcess)
                .withSamples(2047)
                .f();
        option3.setPricingEngine(engine);
        option4.setPricingEngine(engine);
        price3 = option3.NPV();
        price4 = option4.NPV();
        expect(Comparison.close(price3, price4)).toBeFalsy();
    });

    it('Testing Asian options with all fixing dates in the past...', () => {
        const dc = new Actual360();
        const today = Settings.evaluationDate.f();
        const spot = new SimpleQuote(100.0);
        const qRate = new SimpleQuote(0.005);
        const qTS = flatRate3(qRate, dc);
        const rRate = new SimpleQuote(0.01);
        const rTS = flatRate3(rRate, dc);
        const vol = new SimpleQuote(0.20);
        const volTS = flatVol3(vol, dc);
        const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
        const exerciseDate = DateExt.advance(today, 2, TimeUnit.Weeks);
        const startDate = DateExt.advance(exerciseDate, -1, TimeUnit.Years);
        const fixingDates = [];
        for (let i = 0; i < 12; ++i) {
            fixingDates.push(DateExt.advance(startDate, i, TimeUnit.Months));
        }
        const pastFixings = 12;
        const payoff = new PlainVanillaPayoff(Option.Type.Put, 100.0);
        const exercise = new EuropeanExercise(exerciseDate);
        const runningSum = pastFixings * spot.value();
        const option1 = new DiscreteAveragingAsianOption(Average.Type.Arithmetic, runningSum, pastFixings, fixingDates, payoff, exercise);
        option1.setPricingEngine(new MakeMCDiscreteArithmeticAPEngine(new LowDiscrepancy(), stochProcess)
            .withSamples(2047)
            .f());
        const option2 = new DiscreteAveragingAsianOption(Average.Type.Arithmetic, runningSum, pastFixings, fixingDates, payoff, exercise);
        option2.setPricingEngine(new MakeMCDiscreteArithmeticASEngine(new LowDiscrepancy(), stochProcess)
            .withSamples(2047)
            .f());
        const runningProduct = Math.pow(spot.value(), Math.floor(pastFixings));
        const option3 = new DiscreteAveragingAsianOption(Average.Type.Geometric, runningProduct, pastFixings, fixingDates, payoff, exercise);
        option3.setPricingEngine(new MakeMCDiscreteGeometricAPEngine(new LowDiscrepancy(), stochProcess)
            .withSamples(2047)
            .f());
        let raised = false;
        try {
            option1.NPV();
        }
        catch (e) {
            raised = true;
        }
        expect(raised).toBeTruthy();
        raised = false;
        try {
            option1.NPV();
        }
        catch (e) {
            raised = true;
        }
        expect(raised).toBeTruthy();
        raised = false;
        try {
            option2.NPV();
        }
        catch (e) {
            raised = true;
        }
        expect(raised).toBeTruthy();
        const backup = new SavedSettings();
        Settings.evaluationDate.set(fixingDates[fixingDates.length - 1]);
        raised = false;
        try {
            option1.NPV();
        }
        catch (e) {
            raised = true;
        }
        expect(raised).toBeTruthy();
        raised = false;
        try {
            option1.NPV();
        }
        catch (e) {
            raised = true;
        }
        expect(raised).toBeTruthy();
        raised = false;
        try {
            option2.NPV();
        }
        catch (e) {
            raised = true;
        }
        expect(raised).toBeTruthy();
        backup.dispose();
    });
});

describe(`Asian option experimental tests ${version}`, () => {
    it('Testing Levy engine for Asians options...', () => {
        const cases = [
            new ContinuousAverageData(Option.Type.Call, 6.80, 6.80, 6.90, 0.09, 0.07, 0.14, 180, 0, 0.0944),
            new ContinuousAverageData(Option.Type.Put, 6.80, 6.80, 6.90, 0.09, 0.07, 0.14, 180, 0, 0.2237),
            new ContinuousAverageData(Option.Type.Call, 100.0, 100.0, 95.0, 0.05, 0.1, 0.15, 270, 0, 7.0544),
            new ContinuousAverageData(Option.Type.Call, 100.0, 100.0, 95.0, 0.05, 0.1, 0.15, 270, 90, 5.6731),
            new ContinuousAverageData(Option.Type.Call, 100.0, 100.0, 95.0, 0.05, 0.1, 0.15, 270, 180, 5.0806),
            new ContinuousAverageData(Option.Type.Call, 100.0, 100.0, 95.0, 0.05, 0.1, 0.35, 270, 0, 10.1213),
            new ContinuousAverageData(Option.Type.Call, 100.0, 100.0, 95.0, 0.05, 0.1, 0.35, 270, 90, 6.9705),
            new ContinuousAverageData(Option.Type.Call, 100.0, 100.0, 95.0, 0.05, 0.1, 0.35, 270, 180, 5.1411),
            new ContinuousAverageData(Option.Type.Call, 100.0, 100.0, 100.0, 0.05, 0.1, 0.15, 270, 0, 3.7845),
            new ContinuousAverageData(Option.Type.Call, 100.0, 100.0, 100.0, 0.05, 0.1, 0.15, 270, 90, 1.9964),
            new ContinuousAverageData(Option.Type.Call, 100.0, 100.0, 100.0, 0.05, 0.1, 0.15, 270, 180, 0.6722),
            new ContinuousAverageData(Option.Type.Call, 100.0, 100.0, 100.0, 0.05, 0.1, 0.35, 270, 0, 7.5038),
            new ContinuousAverageData(Option.Type.Call, 100.0, 100.0, 100.0, 0.05, 0.1, 0.35, 270, 90, 4.0687),
            new ContinuousAverageData(Option.Type.Call, 100.0, 100.0, 100.0, 0.05, 0.1, 0.35, 270, 180, 1.4222),
            new ContinuousAverageData(Option.Type.Call, 100.0, 100.0, 105.0, 0.05, 0.1, 0.15, 270, 0, 1.6729),
            new ContinuousAverageData(Option.Type.Call, 100.0, 100.0, 105.0, 0.05, 0.1, 0.15, 270, 90, 0.3565),
            new ContinuousAverageData(Option.Type.Call, 100.0, 100.0, 105.0, 0.05, 0.1, 0.15, 270, 180, 0.0004),
            new ContinuousAverageData(Option.Type.Call, 100.0, 100.0, 105.0, 0.05, 0.1, 0.35, 270, 0, 5.4071),
            new ContinuousAverageData(Option.Type.Call, 100.0, 100.0, 105.0, 0.05, 0.1, 0.35, 270, 90, 2.1359),
            new ContinuousAverageData(Option.Type.Call, 100.0, 100.0, 105.0, 0.05, 0.1, 0.35, 270, 180, 0.1552)
        ];
        const dc = new Actual360();
        const today = Settings.evaluationDate.f();
        for (let l = 0; l < cases.length; l++) {
            const spot = new SimpleQuote(cases[l].spot);
            const qTS = flatRate2(today, cases[l].dividendYield, dc);
            const rTS = flatRate2(today, cases[l].riskFreeRate, dc);
            const volTS = flatVol2(today, cases[l].volatility, dc);
            const averageType = Average.Type.Arithmetic;
            const average = new SimpleQuote(cases[l].currentAverage);
            const payoff = new PlainVanillaPayoff(cases[l].type, cases[l].strike);
            const startDate = DateExt.sub(today, cases[l].elapsed);
            const maturity = DateExt.add(startDate, cases[l].length);
            const exercise = new EuropeanExercise(maturity);
            const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
            const engine = new ContinuousArithmeticAsianLevyEngine(stochProcess, new Handle(average), startDate);
            const option = new ContinuousAveragingAsianOption(averageType, payoff, exercise);
            option.setPricingEngine(engine);
            const calculated = option.NPV();
            const expected = cases[l].result;
            const tolerance = 1.0e-4;
            const error = Math.abs(expected - calculated);
            expect(error).toBeLessThan(tolerance);
        }
    });
    
    it('Testing Vecer engine for Asian options...', () => {
        const cases = [
            new VecerData(1.9, 0.05, 0.5, 2.0, 1, 0.193174, 1.0e-5),
            new VecerData(2.0, 0.05, 0.5, 2.0, 1, 0.246416, 1.0e-5),
            new VecerData(2.1, 0.05, 0.5, 2.0, 1, 0.306220, 1.0e-4),
            new VecerData(2.0, 0.02, 0.1, 2.0, 1, 0.055986, 2.0e-4),
            new VecerData(2.0, 0.18, 0.3, 2.0, 1, 0.218388, 1.0e-4),
            new VecerData(2.0, 0.0125, 0.25, 2.0, 2, 0.172269, 1.0e-4),
            new VecerData(2.0, 0.05, 0.5, 2.0, 2, 0.350095, 2.0e-4)
        ];
        const today = Settings.evaluationDate.f();
        const dayCounter = new Actual360();
        const type = Option.Type.Call;
        const q = new Handle(flatRate2(today, 0.0, dayCounter));
        const timeSteps = 200;
        const assetSteps = 200;
        for (let i = 0; i < cases.length; ++i) {
            const u = new Handle(new SimpleQuote(cases[i].spot));
            const r = new Handle(flatRate2(today, cases[i].riskFreeRate, dayCounter));
            const sigma = new Handle(flatVol2(today, cases[i].volatility, dayCounter));
            const process = new BlackScholesMertonProcess(u, q, r, sigma);
            const maturity = DateExt.add(today, cases[i].length * 360);
            const exercise = new EuropeanExercise(maturity);
            const payoff = new PlainVanillaPayoff(type, cases[i].strike);
            const average = new Handle(new SimpleQuote(0.0));
            const option = new ContinuousAveragingAsianOption(Average.Type.Arithmetic, payoff, exercise);
            option.setPricingEngine(new ContinuousArithmeticAsianVecerEngine(process, average, today, timeSteps, assetSteps, -1.0, 1.0));
            const calculated = option.NPV();
            const error = Math.abs(calculated - cases[i].result);
            expect(error).toBeLessThan(cases[i].tolerance);
        }
    });
});