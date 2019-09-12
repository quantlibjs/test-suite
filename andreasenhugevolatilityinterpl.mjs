import { Actual365Fixed, AnalyticHestonEngine, AndreasenHugeLocalVolAdapter, AndreasenHugeVolatilityAdapter, AndreasenHugeVolatilityInterpl, Barrier, BarrierOption, BFGS, blackFormulaImpliedStdDevLiRS1, DateExt, EuropeanExercise, FdBlackScholesBarrierEngine, FdBlackScholesVanillaEngine, FdmSchemeDesc, GeneralizedBlackScholesProcess, Handle, HestonBlackVolSurface, HestonModel, HestonProcess, LevenbergMarquardt, Option, PlainVanillaPayoff, QL_EPSILON, QL_NULL_REAL, sabrVolatility, SavedSettings, Settings, SimpleQuote, Simplex, TimeUnit, VanillaOption, ZeroCurve } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate2, flatRate4 } from '/test-suite/utilities.mjs';

const first = 0, second = 1;

class CalibrationData {
    constructor(spot, rTS, qTS, calibrationSet) {
        this.spot = spot;
        this.rTS = rTS;
        this.qTS = qTS;
        this.calibrationSet = calibrationSet;
    }
}
class CalibrationResults {
    constructor(calibrationType, interpolationType, maxError, avgError, lvMaxError, lvAvgError) {
        this.calibrationType = calibrationType;
        this.interpolationType = interpolationType;
        this.maxError = maxError;
        this.avgError = avgError;
        this.lvMaxError = lvMaxError;
        this.lvAvgError = lvAvgError;
    }
}
function AndreasenHugeExampleData() {
    const spot = new Handle(new SimpleQuote(2772.7));
    const maturityTimes = [
        0.025, 0.101, 0.197, 0.274, 0.523, 0.772, 1.769, 2.267, 2.784, 3.781, 4.778,
        5.774
    ];
    const raw = [
        [
            0.5131, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.3366, 0.3291, 0.0000, 0.0000
        ],
        [
            0.5864, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.3178, 0.3129, 0.3008, 0.0000
        ],
        [
            0.6597, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.3019, 0.2976, 0.2975, 0.0000
        ],
        [
            0.7330, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.2863, 0.2848, 0.2848, 0.0000
        ],
        [
            0.7697, 0.0000, 0.0000, 0.0000, 0.3262, 0.3079, 0.3001, 0.2843, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000
        ],
        [
            0.8063, 0.0000, 0.0000, 0.0000, 0.3058, 0.2936, 0.2876, 0.2753, 0.2713,
            0.2711, 0.2711, 0.2722, 0.2809
        ],
        [
            0.8430, 0.0000, 0.0000, 0.0000, 0.2887, 0.2798, 0.2750, 0.2666, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000
        ],
        [
            0.8613, 0.3365, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000
        ],
        [
            0.8796, 0.3216, 0.2906, 0.2764, 0.2717, 0.2663, 0.2637, 0.2575, 0.2555,
            0.2580, 0.2585, 0.2611, 0.2693
        ],
        [
            0.8979, 0.3043, 0.2797, 0.2672, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000
        ],
        [
            0.9163, 0.2880, 0.2690, 0.2578, 0.2557, 0.2531, 0.2519, 0.2497, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000
        ],
        [
            0.9346, 0.2724, 0.2590, 0.2489, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000
        ],
        [
            0.9529, 0.2586, 0.2488, 0.2405, 0.2407, 0.2404, 0.2411, 0.2418, 0.2410,
            0.2448, 0.2469, 0.2501, 0.2584
        ],
        [
            0.9712, 0.2466, 0.2390, 0.2329, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000
        ],
        [
            0.9896, 0.2358, 0.2300, 0.2253, 0.2269, 0.2284, 0.2299, 0.2347, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000
        ],
        [
            1.0079, 0.2247, 0.2213, 0.2184, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000
        ],
        [
            1.0262, 0.2159, 0.2140, 0.2123, 0.2142, 0.2173, 0.2198, 0.2283, 0.2275,
            0.2322, 0.2384, 0.2392, 0.2486
        ],
        [
            1.0445, 0.2091, 0.2076, 0.2069, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000
        ],
        [
            1.0629, 0.2056, 0.2024, 0.2025, 0.2039, 0.2074, 0.2104, 0.2213, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000
        ],
        [
            1.0812, 0.2045, 0.1982, 0.1984, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000
        ],
        [
            1.0995, 0.2025, 0.1959, 0.1944, 0.1962, 0.1988, 0.2022, 0.2151, 0.2161,
            0.2219, 0.2269, 0.2305, 0.2399
        ],
        [
            1.1178, 0.1933, 0.1929, 0.1920, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000
        ],
        [
            1.1362, 0.0000, 0.0000, 0.0000, 0.1902, 0.1914, 0.1950, 0.2091, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000
        ],
        [
            1.1728, 0.0000, 0.0000, 0.0000, 0.1885, 0.1854, 0.1888, 0.2039, 0.2058,
            0.2122, 0.2186, 0.2223, 0.2321
        ],
        [
            1.2095, 0.0000, 0.0000, 0.0000, 0.1867, 0.1811, 0.1839, 0.1990, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000
        ],
        [
            1.2461, 0.0000, 0.0000, 0.0000, 0.1871, 0.1785, 0.1793, 0.1945, 0.0000,
            0.2054, 0.2103, 0.2164, 0.2251
        ],
        [
            1.3194, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.1988, 0.2054, 0.2105, 0.2190
        ],
        [
            1.3927, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.1930, 0.2002, 0.2054, 0.2135
        ],
        [
            1.4660, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.1849, 0.1964, 0.2012, 0.0000
        ]
    ];
    const dc = new Actual365Fixed();
    const today = new Date('1-March-2010');
    const rTS = new Handle(flatRate2(today, 0.0, dc));
    const qTS = new Handle(flatRate2(today, 0.0, dc));
    const nMaturities = maturityTimes.length;
    if (nMaturities !== raw[1].length - 1) {
        throw new Error('check raw data');
    }
    let calibrationSet;
    calibrationSet = [];
    for (let i = 0; i < raw.length; ++i) {
        const strike = spot.currentLink().value() * raw[i][0];
        for (let j = 1; j < raw[i].length; ++j) {
            if (raw[i][j] > QL_EPSILON) {
                const maturity = DateExt.advance(today, Math.floor(365 * maturityTimes[j - 1]), TimeUnit.Days);
                const impliedVol = raw[i][j];
                calibrationSet.push([
                    new VanillaOption(new PlainVanillaPayoff((strike < spot.currentLink().value()) ? Option.Type.Put :
                        Option.Type.Call, strike), new EuropeanExercise(maturity)),
                    new SimpleQuote(impliedVol)
                ]);
            }
        }
    }
    const data = new CalibrationData(spot, rTS, qTS, calibrationSet);
    return data;
}
function testAndreasenHugeVolatilityInterpolation(data, expected) {
    const backup = new SavedSettings();
    const rTS = data.rTS;
    const qTS = data.qTS;
    const dc = rTS.currentLink().dayCounter();
    const today = rTS.currentLink().referenceDate();
    Settings.evaluationDate.set(today);
    const spot = data.spot;
    const calibrationSet = data.calibrationSet;
    const andreasenHugeVolInterplation = new AndreasenHugeVolatilityInterpl(calibrationSet, spot, rTS, qTS, expected.interpolationType, expected.calibrationType);
    const error = andreasenHugeVolInterplation.calibrationError();
    const maxError = error[1];
    const avgError = error[2];
    expect(maxError).toBeLessThan(expected.maxError);
    expect(avgError).toBeLessThan(expected.avgError);
    const volatilityAdapter = new AndreasenHugeVolatilityAdapter(andreasenHugeVolInterplation);
    const localVolAdapter = new AndreasenHugeLocalVolAdapter(andreasenHugeVolInterplation);
    const localVolProcess = new GeneralizedBlackScholesProcess().init2(spot, qTS, rTS, new Handle(volatilityAdapter), new Handle(localVolAdapter));
    let lvAvgError = 0.0, lvMaxError = 0.0;
    for (let i = 0, n = 0; i < calibrationSet.length; ++i) {
        const option = calibrationSet[i][first];
        const payoff = option.payoff();
        const strike = payoff.strike();
        const optionType = payoff.optionType();
        const t = dc.yearFraction(today, option.exercise().lastDate());
        const expectedVol = calibrationSet[i][second].value();
        const calculatedVol = volatilityAdapter.blackVol2(t, strike, true);
        const diffVol = Math.abs(expectedVol - calculatedVol);
        const tol = Math.max(1e-10, 1.01 * maxError);
        expect(diffVol).toBeLessThan(tol);
        const fdEngine = new FdBlackScholesVanillaEngine(localVolProcess, Math.max(30, Math.floor(100 * t)), 200, 0, FdmSchemeDesc.Douglas(), true);
        option.setPricingEngine(fdEngine);
        const discount = rTS.currentLink().discount2(t);
        const fwd = spot.currentLink().value() * qTS.currentLink().discount2(t) / discount;
        const lvImpliedVol = blackFormulaImpliedStdDevLiRS1(optionType, strike, fwd, option.NPV(), discount, 0.0, QL_NULL_REAL, 1.0, 1e-12) /
            Math.sqrt(t);
        const lvError = Math.abs(lvImpliedVol - expectedVol);
        lvMaxError = Math.max(lvError, lvMaxError);
        lvAvgError = (n * lvAvgError + lvError) / (n + 1);
        ++n;
    }
    expect(lvMaxError).toBeLessThan(expected.lvMaxError);
    expect(avgError).toBeLessThan(expected.avgError);
    backup.dispose();
}
function BorovkovaExampleData() {
    const dc = new Actual365Fixed();
    const today = new Date('4-January-2018');
    const rTS = new Handle(flatRate2(today, 0.025, dc));
    const qTS = new Handle(flatRate2(today, 0.085, dc));
    const spot = new Handle(new SimpleQuote(100));
    const b1 = 0.35;
    const b2 = 0.03;
    const b3 = 0.005;
    const b4 = -0.02;
    const b5 = -0.005;
    const strikes = [35, 50, 75, 100, 125, 150, 200, 300];
    const maturityMonths = [1, 3, 6, 9, 12, 15, 18, 24];
    const calibrationSet = [];
    for (let i = 0; i < strikes.length; ++i) {
        const strike = strikes[i];
        for (let j = 0; j < maturityMonths.length; ++j) {
            const maturityDate = DateExt.advance(today, maturityMonths[j], TimeUnit.Months);
            const t = dc.yearFraction(today, maturityDate);
            const fwd = spot.currentLink().value() *
                qTS.currentLink().discount2(t) / rTS.currentLink().discount2(t);
            const mn = Math.log(fwd / strike) / Math.sqrt(t);
            const vol = b1 + b2 * mn + b3 * mn * mn + b4 * t + b5 * mn * t;
            if (Math.abs(mn) < 3.71 * vol) {
                calibrationSet.push([
                    new VanillaOption(new PlainVanillaPayoff(Option.Type.Call, strike), new EuropeanExercise(maturityDate)),
                    new SimpleQuote(vol)
                ]);
            }
        }
    }
    const data = new CalibrationData(spot, rTS, qTS, calibrationSet);
    return data;
}
function arbitrageData() {
    const dc = new Actual365Fixed();
    const today = new Date('4-January-2018');
    const rTS = new Handle(flatRate2(today, 0.13, dc));
    const qTS = new Handle(flatRate2(today, 0.03, dc));
    const spot = new Handle(new SimpleQuote(100));
    const strikes = [100, 100, 100, 150];
    const maturities = [1, 3, 6, 6];
    const vols = [0.25, 0.35, 0.05, 0.35];
    const calibrationSet = [];
    for (let i = 0; i < strikes.length; ++i) {
        const strike = strikes[i];
        const maturityDate = DateExt.advance(today, maturities[i], TimeUnit.Months);
        const vol = vols[i];
        calibrationSet.push([
            new VanillaOption(new PlainVanillaPayoff(Option.Type.Call, strike), new EuropeanExercise(maturityDate)),
            new SimpleQuote(vol)
        ]);
    }
    const data = new CalibrationData(spot, rTS, qTS, calibrationSet);
    return data;
}
function sabrData() {
    const dc = new Actual365Fixed();
    const today = new Date('4-January-2018');
    const alpha = 0.15;
    const beta = 0.8;
    const nu = 0.5;
    const rho = -0.48;
    const forward = 0.03;
    const maturityInYears = 20;
    const maturityDate = DateExt.advance(today, maturityInYears, TimeUnit.Years);
    const maturity = dc.yearFraction(today, maturityDate);
    const calibrationSet = [];
    const strikes = [0.02, 0.025, 0.03, 0.035, 0.04, 0.05, 0.06];
    for (let i = 0; i < strikes.length; ++i) {
        const strike = strikes[i];
        const vol = sabrVolatility(strike, forward, maturity, alpha, beta, nu, rho);
        calibrationSet.push([
            new VanillaOption(new PlainVanillaPayoff(Option.Type.Call, strike), new EuropeanExercise(maturityDate)),
            new SimpleQuote(vol)
        ]);
    }
    const rTS = new Handle(flatRate2(today, forward, dc));
    const qTS = new Handle(flatRate2(today, forward, dc));
    const spot = new Handle(new SimpleQuote(forward));
    const data = new CalibrationData(spot, rTS, qTS, calibrationSet);
    const parameter = [alpha, beta, nu, rho, forward, maturity];
    return [data, parameter];
}
describe('Andreasen-Huge volatility interpolation tests', () => {
    it('Testing Andreasen-Huge example with Put calibration...', () => {
        const data = AndreasenHugeExampleData();
        const expected = new CalibrationResults(AndreasenHugeVolatilityInterpl.CalibrationType.Put, AndreasenHugeVolatilityInterpl.InterpolationType.CubicSpline, 0.0015, 0.00035, 0.0020, 0.00035);
        testAndreasenHugeVolatilityInterpolation(data, expected);
    });
    it('Testing Andreasen-Huge example with Call calibration...', () => {
        const data = AndreasenHugeExampleData();
        const expected = new CalibrationResults(AndreasenHugeVolatilityInterpl.CalibrationType.Call, AndreasenHugeVolatilityInterpl.InterpolationType.CubicSpline, 0.0015, 0.00035, 0.0015, 0.00035);
        testAndreasenHugeVolatilityInterpolation(data, expected);
    });
    it('Testing Andreasen-Huge example with instantaneous' +
        ' Call and Put calibration...', () => {
        const data = AndreasenHugeExampleData();
        const expected = new CalibrationResults(AndreasenHugeVolatilityInterpl.CalibrationType.CallPut, AndreasenHugeVolatilityInterpl.InterpolationType.CubicSpline, 0.0015, 0.00035, 0.0015, 0.00035);
        testAndreasenHugeVolatilityInterpolation(data, expected);
    });
    it('Testing Andreasen-Huge example with linear interpolation...', () => {
        const data = AndreasenHugeExampleData();
        const expected = new CalibrationResults(AndreasenHugeVolatilityInterpl.CalibrationType.CallPut, AndreasenHugeVolatilityInterpl.InterpolationType.Linear, 0.0020, 0.00015, 0.0040, 0.00035);
        testAndreasenHugeVolatilityInterpolation(data, expected);
    });
    it('Testing Andreasen-Huge example with piecewise constant interpolation...', () => {
        const data = AndreasenHugeExampleData();
        const expected = new CalibrationResults(AndreasenHugeVolatilityInterpl.CalibrationType.CallPut, AndreasenHugeVolatilityInterpl.InterpolationType.PiecewiseConstant, 0.0025, 0.00025, 0.0040, 0.00035);
        testAndreasenHugeVolatilityInterpolation(data, expected);
    });
    it('Testing Andreasen-Huge volatility interpolation with' +
        ' time dependent interest rates and dividend yield...', () => {
        const backup = new SavedSettings();
        const data = AndreasenHugeExampleData();
        const dc = data.rTS.currentLink().dayCounter();
        const today = data.rTS.currentLink().referenceDate();
        Settings.evaluationDate.set(today);
        const r = [0.0167, 0.023, 0.03234, 0.034, 0.038, 0.042, 0.047, 0.053], q = [0.01, 0.011, 0.013, 0.014, 0.02, 0.025, 0.067, 0.072];
        const dates = [
            today, DateExt.advance(today, 41, TimeUnit.Days),
            DateExt.advance(today, 75, TimeUnit.Days),
            DateExt.advance(today, 165, TimeUnit.Days),
            DateExt.advance(today, 256, TimeUnit.Days),
            DateExt.advance(today, 345, TimeUnit.Days),
            DateExt.advance(today, 524, TimeUnit.Days),
            DateExt.advance(today, 2190, TimeUnit.Days)
        ];
        const rTS = new Handle(new ZeroCurve().curveInit1(dates, r, dc));
        const qTS = new Handle(new ZeroCurve().curveInit1(dates, q, dc));
        const origData = AndreasenHugeExampleData();
        const calibrationSet = origData.calibrationSet;
        const spot = origData.spot;
        const hestonModel = new HestonModel(new HestonProcess(rTS, qTS, spot, 0.09, 2.0, 0.09, 0.4, -0.75));
        const hestonEngine = new AnalyticHestonEngine().aheInit3(hestonModel, AnalyticHestonEngine.ComplexLogFormula.AndersenPiterbarg, AnalyticHestonEngine.Integration.discreteTrapezoid(128));
        for (let i = 0; i < calibrationSet.length; ++i) {
            const option = calibrationSet[i][first];
            const payoff = option.payoff();
            const strike = payoff.strike();
            const optionType = payoff.optionType();
            const t = dc.yearFraction(today, option.exercise().lastDate());
            const discount = rTS.currentLink().discount2(t);
            const fwd = spot.currentLink().value() *
                qTS.currentLink().discount2(t) / discount;
            option.setPricingEngine(hestonEngine);
            const npv = option.NPV();
            const impliedVol = blackFormulaImpliedStdDevLiRS1(optionType, strike, fwd, npv, discount, 0.0, QL_NULL_REAL, 1.0, 1e-12) /
                Math.sqrt(t);
            calibrationSet[i][second] = new SimpleQuote(impliedVol);
        }
        const irData = { spot, rTS, qTS, calibrationSet };
        const expected = new CalibrationResults(AndreasenHugeVolatilityInterpl.CalibrationType.CallPut, AndreasenHugeVolatilityInterpl.InterpolationType.CubicSpline, 0.0020, 0.0003, 0.0020, 0.0004);
        testAndreasenHugeVolatilityInterpolation(irData, expected);
        backup.dispose();
    });
    it('Testing Andreasen-Huge volatility interpolation with a single option...', () => {
        const backup = new SavedSettings();
        const dc = new Actual365Fixed();
        const today = new Date('4-January-2018');
        const rTS = new Handle(flatRate2(today, 0.025, dc));
        const qTS = new Handle(flatRate2(today, 0.085, dc));
        const calibrationSet = [];
        const strike = 10.0;
        const vol = 0.3;
        const maturity = DateExt.advance(today, 1, TimeUnit.Years);
        const spot = new Handle(new SimpleQuote(strike));
        calibrationSet.push([
            new VanillaOption(new PlainVanillaPayoff(Option.Type.Call, strike), new EuropeanExercise(maturity)),
            new SimpleQuote(vol)
        ]);
        const interpl = [
            AndreasenHugeVolatilityInterpl.InterpolationType.Linear,
            AndreasenHugeVolatilityInterpl.InterpolationType.CubicSpline,
            AndreasenHugeVolatilityInterpl.InterpolationType.PiecewiseConstant
        ];
        const calibrationType = [
            AndreasenHugeVolatilityInterpl.CalibrationType.Put,
            AndreasenHugeVolatilityInterpl.CalibrationType.Call,
            AndreasenHugeVolatilityInterpl.CalibrationType.CallPut
        ];
        for (let i = 0; i < interpl.length; ++i) {
            for (let j = 0; j < calibrationType.length; ++j) {
                const andreasenHugeVolInterplation = new AndreasenHugeVolatilityInterpl(calibrationSet, spot, rTS, qTS, interpl[i], calibrationType[j], 50);
                const volatilityAdapter = new AndreasenHugeVolatilityAdapter(andreasenHugeVolInterplation);
                const calculated = volatilityAdapter.blackVol1(maturity, strike);
                const expected = vol;
                expect(Math.abs(calculated - expected)).toBeLessThan(1e-4);
            }
        }
        backup.dispose();
    });
    it('Testing Andreasen-Huge volatility interpolation' +
        ' gives arbitrage free prices...', () => {
        const backup = new SavedSettings();
        const data = [BorovkovaExampleData(), arbitrageData()];
        for (let i = 0; i < data.length; ++i) {
            const spot = data[i].spot;
            const calibrationSet = data[i].calibrationSet;
            const rTS = data[i].rTS;
            const qTS = data[i].qTS;
            const dc = rTS.currentLink().dayCounter();
            const today = rTS.currentLink().referenceDate();
            const andreasenHugeVolInterplation = new AndreasenHugeVolatilityInterpl(calibrationSet, spot, rTS, qTS, AndreasenHugeVolatilityInterpl.InterpolationType.CubicSpline, AndreasenHugeVolatilityInterpl.CalibrationType.CallPut, 5000);
            const volatilityAdapter = new AndreasenHugeVolatilityAdapter(andreasenHugeVolInterplation);
            for (let m = -0.7; m < 0.7; m += 0.05) {
                for (let weeks = 6; weeks < 52; ++weeks) {
                    const maturityDate = DateExt.advance(today, weeks, TimeUnit.Weeks);
                    const t = dc.yearFraction(today, maturityDate);
                    const fwd = spot.currentLink().value() *
                        qTS.currentLink().discount2(t) /
                        rTS.currentLink().discount2(t);
                    const eps = 0.025;
                    const k = fwd * Math.exp(m);
                    const km = fwd * Math.exp(m - eps);
                    const kp = fwd * Math.exp(m + eps);
                    const w = volatilityAdapter.blackVariance2(t, k, true);
                    const w_p = volatilityAdapter.blackVariance2(t, kp, true);
                    const w_m = volatilityAdapter.blackVariance2(t, km, true);
                    const w1 = (w_p - w_m) / (2 * eps);
                    const w2 = (w_p + w_m - 2 * w) / (eps * eps);
                    const g_k = (1 - m * w1 / (2 * w)) * (1 - m * w1 / (2 * w)) -
                        w1 * w1 / 4 * (1 / w + 0.25) + 0.5 * w2;
                    expect(g_k).toBeGreaterThan(0);
                    const deltaT = 1.0 / 365.;
                    const fwdpt = spot.currentLink().value() *
                        qTS.currentLink().discount2(t + deltaT) /
                        rTS.currentLink().discount2(t + deltaT);
                    const kpt = fwdpt * Math.exp(m);
                    const w_pt = volatilityAdapter.blackVariance2(t + deltaT, kpt, true);
                    const w_t = (w_pt - w) / deltaT;
                    expect(w_t).toBeGreaterThan(-1e-8);
                    backup.dispose();
                }
            }
        }
    });
    it('Testing Barrier option pricing with Andreasen-Huge' +
        ' local volatility surface...', () => {
        const backup = new SavedSettings();
        const dc = new Actual365Fixed();
        const today = new Date('4-January-2018');
        const rTS = new Handle(flatRate2(today, 0.01, dc));
        const qTS = new Handle(flatRate2(today, 0.03, dc));
        const spot = new Handle(new SimpleQuote(100));
        const hestonModel = new HestonModel(new HestonProcess(rTS, qTS, spot, 0.04, 2.0, 0.04, 0.4, -0.75));
        const hestonVol = new HestonBlackVolSurface(new Handle(hestonModel));
        const dupireLocalVolProcess = new GeneralizedBlackScholesProcess().init1(spot, qTS, rTS, new Handle(hestonVol));
        const strikes = [25, 50, 75, 90, 100, 110, 125, 150, 200, 400];
        const maturityMonths = [1, 3, 6, 9, 12];
        const calibrationSet = [];
        for (let i = 0; i < strikes.length; ++i) {
            const strike = strikes[i];
            for (let j = 0; j < maturityMonths.length; ++j) {
                const maturityDate = DateExt.advance(today, maturityMonths[j], TimeUnit.Months);
                const t = dc.yearFraction(today, maturityDate);
                const vol = hestonVol.blackVol2(t, strike);
                const mn = Math.log(spot.currentLink().value() / strike) / Math.sqrt(t);
                if (Math.abs(mn) < 3.07 * vol) {
                    calibrationSet.push([
                        new VanillaOption(new PlainVanillaPayoff(Option.Type.Call, strike), new EuropeanExercise(maturityDate)),
                        new SimpleQuote(vol)
                    ]);
                }
            }
        }
        const andreasenHugeVolInterplation = new AndreasenHugeVolatilityInterpl(calibrationSet, spot, rTS, qTS);
        const localVolAdapter = new AndreasenHugeLocalVolAdapter(andreasenHugeVolInterplation);
        const andreasenHugeLocalVolProcess = new GeneralizedBlackScholesProcess().init2(spot, qTS, rTS, new Handle(hestonVol), new Handle(localVolAdapter));
        const strike = 120.0;
        const barrier = 80.0;
        const rebate = 0.0;
        const maturity = DateExt.advance(today, 1, TimeUnit.Years);
        const barrierType = Barrier.Type.DownOut;
        const barrierOption = new BarrierOption(barrierType, barrier, rebate, new PlainVanillaPayoff(Option.Type.Put, strike), new EuropeanExercise(maturity));
        barrierOption.setPricingEngine(new FdBlackScholesBarrierEngine(dupireLocalVolProcess, 50, 100, 0, FdmSchemeDesc.Douglas(), true, 0.2));
        const dupireNPV = barrierOption.NPV();
        barrierOption.setPricingEngine(new FdBlackScholesBarrierEngine(andreasenHugeLocalVolProcess, 200, 400, 0, FdmSchemeDesc.Douglas(), true, 0.25));
        const andreasenHugeNPV = barrierOption.NPV();
        const tol = 0.15;
        const diff = Math.abs(andreasenHugeNPV - dupireNPV);
        expect(diff).toBeLessThan(tol);
        backup.dispose();
    });
    it('Testing Peter\'s and Fabien\'s SABR example...', () => {
        const backup = new SavedSettings();
        const sd = sabrData();
        const data = sd[first];
        const parameter = sd[second];
        const andreasenHugeVolInterplation = new AndreasenHugeVolatilityInterpl(data.calibrationSet, data.spot, data.rTS, data.qTS);
        const volAdapter = new AndreasenHugeVolatilityAdapter(andreasenHugeVolInterplation);
        const alpha = parameter[0];
        const beta = parameter[1];
        const nu = parameter[2];
        const rho = parameter[3];
        const forward = parameter[4];
        const maturity = parameter[5];
        for (let strike = 0.02; strike < 0.06; strike += 0.001) {
            const sabrVol = sabrVolatility(strike, forward, maturity, alpha, beta, nu, rho);
            const ahVol = volAdapter.blackVol2(maturity, strike, true);
            const diff = Math.abs(sabrVol - ahVol);
            expect(ahVol).not.toBeNaN();
            expect(diff).toBeLessThan(0.005);
        }
        backup.dispose();
    });
    it('Testing different optimizer for Andreasen-Huge' +
        ' volatility interpolation...', () => {
        const data = sabrData()[first];
        const optimizationMethods = [new LevenbergMarquardt(), new BFGS(), new Simplex(0.2)];
        for (let i = 0; i < optimizationMethods.length; ++i) {
            const optimizationMethod = optimizationMethods[i];
            const avgError = new AndreasenHugeVolatilityInterpl(data.calibrationSet, data.spot, data.rTS, data.qTS, AndreasenHugeVolatilityInterpl.InterpolationType.CubicSpline, AndreasenHugeVolatilityInterpl.CalibrationType.Call, 400, QL_NULL_REAL, QL_NULL_REAL, optimizationMethod)
                .calibrationError()[2];
            expect(avgError).not.toBeNaN();
            expect(avgError).toBeLessThan(0.0001);
        }
    });
    it('Testing that reference date of adapter surface' +
        ' moves along with evaluation date...', () => {
        const backup = new SavedSettings();
        const today = new Date('4-January-2018');
        Settings.evaluationDate.set(today);
        const dc = new Actual365Fixed();
        const maturity = DateExt.advance(today, 1, TimeUnit.Months);
        const ts = new Handle(flatRate4(0.04, dc));
        const s0 = 100.0;
        const impliedVol = 0.2;
        const spot = new Handle(new SimpleQuote(s0));
        const calibrationSet = [[
                new VanillaOption(new PlainVanillaPayoff(Option.Type.Call, s0), new EuropeanExercise(maturity)),
                new SimpleQuote(impliedVol)
            ]];
        const andreasenHugeVolInterplation = new AndreasenHugeVolatilityInterpl(calibrationSet, spot, ts, ts);
        const tol = 1e-8;
        const volatilityAdapter = new AndreasenHugeVolatilityAdapter(andreasenHugeVolInterplation, tol);
        const localVolAdapter = new AndreasenHugeLocalVolAdapter(andreasenHugeVolInterplation);
        const volRefDate = volatilityAdapter.referenceDate();
        const localRefDate = localVolAdapter.referenceDate();
        expect(volRefDate.valueOf()).toEqual(today.valueOf());
        expect(localRefDate.valueOf()).toEqual(today.valueOf());
        const modToday = new Date('15-January-2018');
        Settings.evaluationDate.set(modToday);
        const modVolRefDate = volatilityAdapter.referenceDate();
        const modLocalRefDate = localVolAdapter.referenceDate();
        expect(modVolRefDate.valueOf()).toEqual(modToday.valueOf());
        expect(modLocalRefDate.valueOf()).toEqual(modToday.valueOf());
        const modImpliedVol = volatilityAdapter.blackVol1(maturity, s0, true);
        const diff = Math.abs(modImpliedVol - impliedVol);
        expect(diff).toBeLessThan(10 * tol);
        backup.dispose();
    });
});