import { Actual360, Actual365Fixed, ActualActual, AmericanExercise, AnalyticHestonEngine, AnalyticPDFHestonEngine, AnalyticPTDHestonEngine, Barrier, BarrierOption, BlackCalibrationHelper, blackFormula1, BlackScholesMertonProcess, BoundaryConstraint, CashOrNothingPayoff, ConstantParameter, COSHestonEngine, CrankNicolson, DateExt, DividendVanillaOption, EndCriteria, EuropeanExercise, FDAmericanEngine, FdHestonBarrierEngine, FdHestonVanillaEngine, FordeHestonExpansion, Handle, HestonExpansionEngine, HestonModel, HestonModelHelper, HestonProcess, LevenbergMarquardt, LowDiscrepancy, LPP2HestonExpansion, LPP3HestonExpansion, M_PI, MakeMCEuropeanHestonEngine, MersenneTwisterUniformRng, Month, MultiPathGenerator, NullCalendar, NumericalDifferentiation, Option, Period, PiecewiseConstantParameter, PiecewiseTimeDependentHestonModel, PlainVanillaPayoff, PositiveConstraint, PseudoRandom, QL_EPSILON, QL_NULL_INTEGER, QL_NULL_REAL, RiskStatistics, SavedSettings, Settings, SimpleQuote, TARGET, TimeGrid, TimeUnit, VanillaOption, ZeroCurve, Complex, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate2, flatRate4, flatVol2 } from '/test-suite/utilities.mjs';

class CalibrationMarketData {
    constructor(s0, riskFreeTS, dividendYield, options) {
        this.s0 = s0;
        this.riskFreeTS = riskFreeTS;
        this.dividendYield = dividendYield;
        this.options = options;
    }
}

function getDAXCalibrationMarketData() {
    const settlementDate = Settings.evaluationDate.f();
    const dayCounter = new Actual365Fixed();
    const calendar = new TARGET();
    const t = [13, 41, 75, 165, 256, 345, 524, 703];
    const r = [0.0357, 0.0349, 0.0341, 0.0355, 0.0359, 0.0368, 0.0386, 0.0401];
    const dates = [];
    const rates = [];
    dates.push(settlementDate);
    rates.push(0.0357);
    let i;
    for (i = 0; i < 8; ++i) {
        dates.push(DateExt.add(settlementDate, t[i]));
        rates.push(r[i]);
    }
    const riskFreeTS = new Handle(new ZeroCurve().curveInit1(dates, rates, dayCounter));
    const dividendYield = new Handle(flatRate2(settlementDate, 0.0, dayCounter));
    const v = [
        0.6625, 0.4875, 0.4204, 0.3667, 0.3431, 0.3267, 0.3121, 0.3121, 0.6007,
        0.4543, 0.3967, 0.3511, 0.3279, 0.3154, 0.2984, 0.2921, 0.5084, 0.4221,
        0.3718, 0.3327, 0.3155, 0.3027, 0.2919, 0.2889, 0.4541, 0.3869, 0.3492,
        0.3149, 0.2963, 0.2926, 0.2819, 0.2800, 0.4060, 0.3607, 0.3330, 0.2999,
        0.2887, 0.2811, 0.2751, 0.2775, 0.3726, 0.3396, 0.3108, 0.2781, 0.2788,
        0.2722, 0.2661, 0.2686, 0.3550, 0.3277, 0.3012, 0.2781, 0.2781, 0.2661,
        0.2661, 0.2681, 0.3428, 0.3209, 0.2958, 0.2740, 0.2688, 0.2627, 0.2580,
        0.2620, 0.3302, 0.3062, 0.2799, 0.2631, 0.2573, 0.2533, 0.2504, 0.2544,
        0.3343, 0.2959, 0.2705, 0.2540, 0.2504, 0.2464, 0.2448, 0.2462, 0.3460,
        0.2845, 0.2624, 0.2463, 0.2425, 0.2385, 0.2373, 0.2422, 0.3857, 0.2860,
        0.2578, 0.2399, 0.2357, 0.2327, 0.2312, 0.2351, 0.3976, 0.2860, 0.2607,
        0.2356, 0.2297, 0.2268, 0.2241, 0.2320
    ];
    const s0 = new Handle(new SimpleQuote(4468.17));
    const strike = [
        3400, 3600, 3800, 4000, 4200, 4400, 4500, 4600, 4800, 5000, 5200, 5400, 5600
    ];
    const options = [];
    for (let s = 0; s < 13; ++s) {
        for (let m = 0; m < 8; ++m) {
            const vol = new Handle(new SimpleQuote(v[s * 8 + m]));
            const maturity = new Period().init1(Math.floor((t[m] + 3) / 7.), TimeUnit.Weeks);
            options.push(new HestonModelHelper().hmhInit2(maturity, calendar, s0, strike[s], vol, riskFreeTS, dividendYield, BlackCalibrationHelper.CalibrationErrorType.ImpliedVolError));
        }
    }
    const marketData = new CalibrationMarketData(s0, riskFreeTS, dividendYield, options);
    return marketData;
}

class HestonProcessDiscretizationDesc {
    constructor(discretization, nSteps, name) {
        this.discretization = discretization;
        this.nSteps = nSteps;
        this.name = name;
    }
}

class HestonParameter {
    constructor(v0, kappa, theta, sigma, rho) {
        this.v0 = v0;
        this.kappa = kappa;
        this.theta = theta;
        this.rho = rho;
    }
}

function reportOnIntegrationMethodTest(option, model, integration, formula, isAdaptive, expected, tol, valuations, method) {
    if (integration.isAdaptiveIntegration() !== isAdaptive) {
        throw new Error('not an adaptive integration routine');
    }
    const engine = new AnalyticHestonEngine().aheInit3(model, formula, integration, 1e-9);
    option.setPricingEngine(engine);
    const calculated = option.NPV();
    const error = Math.abs(calculated - expected);
    expect(error).not.toBeNaN();
    expect(error).toBeLessThan(tol);
    expect(valuations).toEqual(engine.numberOfEvaluations());
}

class LogCharacteristicFunction {
    constructor(n, t, engine) {
        this._t = t;
        this._alpha = new Complex(0.0, 1.0);
        this._engine = engine;
        for (let i = 1; i < n; ++i) {
            this._alpha = Complex.mul(this._alpha, new Complex(0, 1));
        }
    }
    f(u) {
        return Complex.log(Complex.div(this._engine.chF(u, this._t), this._alpha))
            .real();
    }
}

describe(`Heston model tests ${version}`, () => {
    it('Testing Heston model calibration using a flat volatility surface...', () => {
        const backup = new SavedSettings();
        const today = DateExt.UTC();
        Settings.evaluationDate.set(today);
        const dayCounter = new Actual360();
        const calendar = new NullCalendar();
        const riskFreeTS = new Handle(flatRate4(0.04, dayCounter));
        const dividendTS = new Handle(flatRate4(0.50, dayCounter));
        const optionMaturities = [];
        optionMaturities.push(new Period().init1(1, TimeUnit.Months));
        optionMaturities.push(new Period().init1(2, TimeUnit.Months));
        optionMaturities.push(new Period().init1(3, TimeUnit.Months));
        optionMaturities.push(new Period().init1(6, TimeUnit.Months));
        optionMaturities.push(new Period().init1(9, TimeUnit.Months));
        optionMaturities.push(new Period().init1(1, TimeUnit.Years));
        optionMaturities.push(new Period().init1(2, TimeUnit.Years));
        const options = [];
        const s0 = new Handle(new SimpleQuote(1.0));
        const vol = new Handle(new SimpleQuote(0.1));
        const volatility = vol.currentLink().value();
        for (let i = 0; i < optionMaturities.length; ++i) {
            for (let moneyness = -1.0; moneyness < 2.0; moneyness += 1.0) {
                const tau = dayCounter.yearFraction(riskFreeTS.currentLink().referenceDate(), calendar.advance2(riskFreeTS.currentLink().referenceDate(), optionMaturities[i]));
                const fwdPrice = s0.currentLink().value() *
                    dividendTS.currentLink().discount2(tau) /
                    riskFreeTS.currentLink().discount2(tau);
                const strikePrice = fwdPrice * Math.exp(-moneyness * volatility * Math.sqrt(tau));
                options.push(new HestonModelHelper().hmhInit2(optionMaturities[i], calendar, s0, strikePrice, vol, riskFreeTS, dividendTS));
            }
        }
        for (let sigma = 0.1; sigma < 0.7; sigma += 0.2) {
            const v0 = 0.01;
            const kappa = 0.2;
            const theta = 0.02;
            const rho = -0.75;
            const process = new HestonProcess(riskFreeTS, dividendTS, s0, v0, kappa, theta, sigma, rho);
            const model = new HestonModel(process);
            const engine = new AnalyticHestonEngine().aheInit2(model, 96);
            for (let i = 0; i < options.length; ++i) {
                options[i].setPricingEngine(engine);
            }
            const om = new LevenbergMarquardt(1e-8, 1e-8, 1e-8);
            model.calibrate(options, om, new EndCriteria(400, 40, 1.0e-8, 1.0e-8, 1.0e-8));
            const tolerance = 3.0e-3;
            expect(model.sigma()).toBeLessThan(tolerance);
            expect(Math.abs(model.kappa() * (model.theta() - volatility * volatility)))
                .toBeLessThan(tolerance);
            expect(Math.abs(model.v0() - volatility * volatility))
                .toBeLessThan(tolerance);
        }
        backup.dispose();
    });

    it('Testing Heston model calibration using DAX volatility data...', () => {
        const backup = new SavedSettings();
        const settlementDate = DateExt.UTC('5,July,2002');
        Settings.evaluationDate.set(settlementDate);
        const marketData = getDAXCalibrationMarketData();
        const riskFreeTS = marketData.riskFreeTS;
        const dividendTS = marketData.dividendYield;
        const s0 = marketData.s0;
        const options = marketData.options;
        const v0 = 0.1;
        const kappa = 1.0;
        const theta = 0.1;
        const sigma = 0.5;
        const rho = -0.5;
        const process = new HestonProcess(riskFreeTS, dividendTS, s0, v0, kappa, theta, sigma, rho);
        const model = new HestonModel(process);
        const engines = [
            new AnalyticHestonEngine().aheInit2(model, 64),
            new COSHestonEngine(model, 12, 75)
        ];
        const params = model.params();
        for (let j = 0; j < engines.length; ++j) {
            model.setParams(params);
            for (let i = 0; i < options.length; ++i) {
                options[i].setPricingEngine(engines[j]);
            }
            const om = new LevenbergMarquardt(1e-8, 1e-8, 1e-8);
            model.calibrate(options, om, new EndCriteria(400, 40, 1.0e-8, 1.0e-8, 1.0e-8));
            let sse = 0;
            for (let i = 0; i < 13 * 8; ++i) {
                const diff = options[i].calibrationError() * 100.0;
                sse += diff * diff;
            }
            const expected = 177.2;
            expect(Math.abs(sse - expected)).toBeLessThan(1.0);
        }
        backup.dispose();
    });

    xit('Testing analytic Heston engine against Black formula...', () => {
        const backup = new SavedSettings();
        const settlementDate = new Date();
        Settings.evaluationDate.set(settlementDate);
        const dayCounter = new ActualActual();
        const exerciseDate = DateExt.advance(settlementDate, 6, TimeUnit.Months);
        const payoff = new PlainVanillaPayoff(Option.Type.Put, 30);
        const exercise = new EuropeanExercise(exerciseDate);
        const riskFreeTS = new Handle(flatRate4(0.1, dayCounter));
        const dividendTS = new Handle(flatRate4(0.04, dayCounter));
        const s0 = new Handle(new SimpleQuote(32.0));
        const v0 = 0.05;
        const kappa = 5.0;
        const theta = 0.05;
        const sigma = 1.0e-4;
        const rho = 0.0;
        const process = new HestonProcess(riskFreeTS, dividendTS, s0, v0, kappa, theta, sigma, rho);
        const option = new VanillaOption(payoff, exercise);
        let engine = new AnalyticHestonEngine().aheInit2(new HestonModel(process), 144);
        option.setPricingEngine(engine);
        let calculated = option.NPV();
        const yearFraction = dayCounter.yearFraction(settlementDate, exerciseDate);
        const forwardPrice = 32 * Math.exp((0.1 - 0.04) * yearFraction);
        const expected = blackFormula1(payoff.optionType(), payoff.strike(), forwardPrice, Math.sqrt(0.05 * yearFraction)) *
            Math.exp(-0.1 * yearFraction);
        let error = Math.abs(calculated - expected);
        let tolerance = 2.0e-7;
        expect(error).toBeLessThan(tolerance);
        engine = new FdHestonVanillaEngine(new HestonModel(process), 200, 200, 100);
        option.setPricingEngine(engine);
        calculated = option.NPV();
        error = Math.abs(calculated - expected);
        tolerance = 1.0e-3;
        expect(error).toBeLessThan(tolerance);
        backup.dispose();
    });

    it('Testing analytic Heston engine against cached values...', () => {
        const backup = new SavedSettings();
        const settlementDate = new Date('27-December-2004');
        Settings.evaluationDate.set(settlementDate);
        const dayCounter = new ActualActual();
        const exerciseDate = new Date('28-March-2005');
        const payoff = new PlainVanillaPayoff(Option.Type.Call, 1.05);
        const exercise = new EuropeanExercise(exerciseDate);
        const riskFreeTS = new Handle(flatRate4(0.0225, dayCounter));
        const dividendTS = new Handle(flatRate4(0.02, dayCounter));
        const s0 = new Handle(new SimpleQuote(1.0));
        const v0 = 0.1;
        const kappa = 3.16;
        const theta = 0.09;
        const sigma = 0.4;
        const rho = -0.2;
        const process = new HestonProcess(riskFreeTS, dividendTS, s0, v0, kappa, theta, sigma, rho);
        const option = new VanillaOption(payoff, exercise);
        const engine = new AnalyticHestonEngine().aheInit2(new HestonModel(process), 64);
        option.setPricingEngine(engine);
        const expected1 = 0.0404774515;
        const calculated1 = option.NPV();
        const tolerance = 1.0e-8;
        expect(Math.abs(calculated1 - expected1)).toBeLessThan(tolerance);
        const K = [0.9, 1.0, 1.1];
        const expected2 = [0.1330371, 0.0641016, 0.0270645];
        const calculated2 = new Array(6);
        let i;
        for (i = 0; i < 6; ++i) {
            const exerciseDate = new Date(2005, Month.September - 1, 8 + i / 3);
            const payoff = new PlainVanillaPayoff(Option.Type.Call, K[i % 3]);
            const exercise = new EuropeanExercise(exerciseDate);
            const riskFreeTS = new Handle(flatRate4(0.05, dayCounter));
            const dividendTS = new Handle(flatRate4(0.02, dayCounter));
            const s = riskFreeTS.currentLink().discount2(0.7) /
                dividendTS.currentLink().discount2(0.7);
            const s0 = new Handle(new SimpleQuote(s));
            const process = new HestonProcess(riskFreeTS, dividendTS, s0, 0.09, 1.2, 0.08, 1.8, -0.45);
            const option = new VanillaOption(payoff, exercise);
            const engine = new AnalyticHestonEngine().aheInit2(new HestonModel(process));
            option.setPricingEngine(engine);
            calculated2[i] = option.NPV();
        }
        const t1 = dayCounter.yearFraction(settlementDate, new Date('8-September-2005'));
        const t2 = dayCounter.yearFraction(settlementDate, new Date('9-September-2005'));
        for (i = 0; i < 3; ++i) {
            const interpolated = calculated2[i] +
                (calculated2[i + 3] - calculated2[i]) / (t2 - t1) * (0.7 - t1);
            expect(Math.abs(interpolated - expected2[i]))
                .toBeLessThan(100 * tolerance);
        }
        backup.dispose();
    });

    it('Testing Monte Carlo Heston engine against cached values...', () => {
        const backup = new SavedSettings();
        const settlementDate = new Date('27-December-2004');
        Settings.evaluationDate.set(settlementDate);
        const dayCounter = new ActualActual();
        const exerciseDate = new Date('28-March-2005');
        const payoff = new PlainVanillaPayoff(Option.Type.Put, 1.05);
        const exercise = new EuropeanExercise(exerciseDate);
        const riskFreeTS = new Handle(flatRate4(0.7, dayCounter));
        const dividendTS = new Handle(flatRate4(0.4, dayCounter));
        const s0 = new Handle(new SimpleQuote(1.05));
        const process = new HestonProcess(riskFreeTS, dividendTS, s0, 0.3, 1.16, 0.2, 0.8, 0.8, HestonProcess.Discretization.QuadraticExponentialMartingale);
        const option = new VanillaOption(payoff, exercise);
        let engine;
        engine = new MakeMCEuropeanHestonEngine(new PseudoRandom())
            .mmceheInit(process)
            .withStepsPerYear(11)
            .withAntitheticVariate()
            .withSamples(50000)
            .withSeed(1234)
            .f();
        option.setPricingEngine(engine);
        const expected = 0.0632851308977151;
        const calculated = option.NPV();
        const errorEstimate = option.errorEstimate();
        const tolerance = 7.5e-4;
        expect(Math.abs(calculated - expected)).toBeLessThan(2.34 * errorEstimate);
        expect(errorEstimate).toBeLessThan(tolerance);
        backup.dispose();
    });

    it('Testing FD barrier Heston engine against cached values...', () => {
        const backup = new SavedSettings();
        const dc = new Actual360();
        const today = new Date();
        const s0 = new Handle(new SimpleQuote(100.0));
        const rTS = new Handle(flatRate2(today, 0.08, dc));
        const qTS = new Handle(flatRate2(today, 0.04, dc));
        const exDate = DateExt.add(today, Math.floor(0.5 * 360 + 0.5));
        const exercise = new EuropeanExercise(exDate);
        const payoff = new PlainVanillaPayoff(Option.Type.Call, 90.0);
        const process = new HestonProcess(rTS, qTS, s0, 0.25 * 0.25, 1.0, 0.25 * 0.25, 0.001, 0.0);
        let engine;
        engine = new FdHestonBarrierEngine(new HestonModel(process), 200, 400, 100);
        let option = new BarrierOption(Barrier.Type.DownOut, 95.0, 3.0, payoff, exercise);
        option.setPricingEngine(engine);
        let calculated = option.NPV();
        let expected = 9.0246;
        let error = Math.abs(calculated - expected);
        expect(error).toBeLessThan(1.0e-3);
        option =
            new BarrierOption(Barrier.Type.DownIn, 95.0, 3.0, payoff, exercise);
        option.setPricingEngine(engine);
        calculated = option.NPV();
        expected = 7.7627;
        error = Math.abs(calculated - expected);
        expect(error).toBeLessThan(1.0e-3);
        backup.dispose();
    });

    xit('Testing FD vanilla Heston engine against cached values...', () => {
        const backup = new SavedSettings();
        const settlementDate = new Date('27-December-2004');
        Settings.evaluationDate.set(settlementDate);
        const dayCounter = new ActualActual();
        let exerciseDate = new Date('28-March-2005');
        let payoff = new PlainVanillaPayoff(Option.Type.Put, 1.05);
        let exercise = new EuropeanExercise(exerciseDate);
        let riskFreeTS = new Handle(flatRate4(0.7, dayCounter));
        let dividendTS = new Handle(flatRate4(0.4, dayCounter));
        let s0 = new Handle(new SimpleQuote(1.05));
        let option = new VanillaOption(payoff, exercise);
        let process = new HestonProcess(riskFreeTS, dividendTS, s0, 0.3, 1.16, 0.2, 0.8, 0.8);
        let engine;
        engine = new FdHestonVanillaEngine(new HestonModel(process), 100, 200, 100);
        option.setPricingEngine(engine);
        let expected = 0.06325;
        let calculated = option.NPV();
        let error = Math.abs(calculated - expected);
        let tolerance = 1.0e-4;
        expect(error).toBeLessThan(tolerance);
        payoff = new PlainVanillaPayoff(Option.Type.Call, 95.0);
        s0 = new Handle(new SimpleQuote(100.0));
        riskFreeTS = new Handle(flatRate4(0.05, dayCounter));
        dividendTS = new Handle(flatRate4(0.0, dayCounter));
        exerciseDate = new Date('28-March-2006');
        exercise = new EuropeanExercise(exerciseDate);
        const dividendDates = [];
        const dividends = [];
        for (let d = DateExt.advance(settlementDate, 3, TimeUnit.Months); d.valueOf() < exercise.lastDate().valueOf(); d = DateExt.advance(d, 6, TimeUnit.Months)) {
            dividendDates.push(d);
            dividends.push(1.0);
        }
        const divOption = new DividendVanillaOption(payoff, exercise, dividendDates, dividends);
        process = new HestonProcess(riskFreeTS, dividendTS, s0, 0.04, 1.0, 0.04, 0.001, 0.0);
        engine = new FdHestonVanillaEngine(new HestonModel(process), 200, 400, 100);
        divOption.setPricingEngine(engine);
        calculated = divOption.NPV();
        expected = 12.946;
        error = Math.abs(calculated - expected);
        tolerance = 5.0e-3;
        expect(error).toBeLessThan(tolerance);
        dividendTS = new Handle(flatRate4(0.03, dayCounter));
        process = new HestonProcess(riskFreeTS, dividendTS, s0, 0.04, 1.0, 0.04, 0.001, 0.0);
        engine = new FdHestonVanillaEngine(new HestonModel(process), 200, 400, 100);
        payoff = new PlainVanillaPayoff(Option.Type.Put, 95.0);
        exercise = new AmericanExercise().init1(settlementDate, exerciseDate);
        option = new VanillaOption(payoff, exercise);
        option.setPricingEngine(engine);
        calculated = option.NPV();
        const volTS = new Handle(flatVol2(settlementDate, 0.2, dayCounter));
        const ref_process = new BlackScholesMertonProcess(s0, dividendTS, riskFreeTS, volTS);
        const ref_engine = new FDAmericanEngine(new CrankNicolson())
            .fdmaeInit(ref_process, 200, 400);
        option.setPricingEngine(ref_engine);
        expected = option.NPV();
        error = Math.abs(calculated - expected);
        tolerance = 1.0e-3;
        expect(error).toBeLessThan(tolerance);
        backup.dispose();
    });

    it('Testing MC and FD Heston engines for the Kahl-Jaeckel example...', () => {
        const backup = new SavedSettings();
        const settlementDate = new Date('30-March-2007');
        Settings.evaluationDate.set(settlementDate);
        const dayCounter = new ActualActual();
        const exerciseDate = new Date('30-March-2017');
        const payoff = new PlainVanillaPayoff(Option.Type.Call, 200);
        const exercise = new EuropeanExercise(exerciseDate);
        const option = new VanillaOption(payoff, exercise);
        const riskFreeTS = new Handle(flatRate4(0.0, dayCounter));
        const dividendTS = new Handle(flatRate4(0.0, dayCounter));
        const s0 = new Handle(new SimpleQuote(100));
        const v0 = 0.16;
        const theta = v0;
        const kappa = 1.0;
        const sigma = 2.0;
        const rho = -0.8;
        const descriptions = [
            new HestonProcessDiscretizationDesc(HestonProcess.Discretization.NonCentralChiSquareVariance, 10, 'NonCentralChiSquareVariance'),
            new HestonProcessDiscretizationDesc(HestonProcess.Discretization.QuadraticExponentialMartingale, 100, 'QuadraticExponentialMartingale'),
        ];
        const tolerance = 0.2;
        const expected = 4.95212;
        for (let i = 0; i < descriptions.length; ++i) {
            const process = new HestonProcess(riskFreeTS, dividendTS, s0, v0, kappa, theta, sigma, rho, descriptions[i].discretization);
            const engine = new MakeMCEuropeanHestonEngine(new PseudoRandom())
                .mmceheInit(process)
                .withSteps(descriptions[i].nSteps)
                .withAntitheticVariate()
                .withAbsoluteTolerance(tolerance)
                .withSeed(1234)
                .f();
            option.setPricingEngine(engine);
            const calculated = option.NPV();
            const errorEstimate = option.errorEstimate();
            expect(Math.abs(calculated - expected))
                .toBeLessThan(2.34 * errorEstimate);
            expect(errorEstimate).toBeLessThan(tolerance);
        }
        option.setPricingEngine(new MakeMCEuropeanHestonEngine(new LowDiscrepancy())
            .mmceheInit(new HestonProcess(riskFreeTS, dividendTS, s0, v0, kappa, theta, sigma, rho, HestonProcess.Discretization.BroadieKayaExactSchemeLaguerre))
            .withSteps(1)
            .withSamples(1023)
            .f());
        let calculated = option.NPV();
        expect(Math.abs(calculated - expected)).toBeLessThan(0.5 * tolerance);
        const hestonModel = new HestonModel(new HestonProcess(riskFreeTS, dividendTS, s0, v0, kappa, theta, sigma, rho));
        option.setPricingEngine(new FdHestonVanillaEngine(hestonModel, 200, 401, 101));
        calculated = option.NPV();
        let error = Math.abs(calculated - expected);
        expect(error).toBeLessThan(5.0e-2);
        option.setPricingEngine(new AnalyticHestonEngine().aheInit1(hestonModel, 1e-6, 1000));
        calculated = option.NPV();
        error = Math.abs(calculated - expected);
        expect(error).toBeLessThan(0.00002);
        option.setPricingEngine(new COSHestonEngine(hestonModel, 16, 400));
        calculated = option.NPV();
        error = Math.abs(calculated - expected);
        expect(error).toBeLessThan(0.00002);
        backup.dispose();
    });

    it('Testing different numerical Heston integration algorithms...', () => {
        const backup = new SavedSettings();
        const settlementDate = new Date('27-December-2004');
        Settings.evaluationDate.set(settlementDate);
        const dayCounter = new ActualActual();
        const riskFreeTS = new Handle(flatRate4(0.05, dayCounter));
        const dividendTS = new Handle(flatRate4(0.03, dayCounter));
        const strikes = [0.5, 0.7, 1.0, 1.25, 1.5, 2.0];
        const maturities = [1, 2, 3, 12, 60, 120, 360];
        const types = [Option.Type.Put, Option.Type.Call];
        const equityfx = new HestonParameter(0.07, 2.0, 0.04, 0.55, -0.8);
        const highCorr = new HestonParameter(0.07, 1.0, 0.04, 0.55, 0.995);
        const lowVolOfVol = new HestonParameter(0.07, 1.0, 0.04, 0.025, -0.75);
        const highVolOfVol = new HestonParameter(0.07, 1.0, 0.04, 5.0, -0.75);
        const kappaEqSigRho = new HestonParameter(0.07, 0.4, 0.04, 0.5, 0.8);
        const params = [];
        params.push(equityfx);
        params.push(highCorr);
        params.push(lowVolOfVol);
        params.push(highVolOfVol);
        params.push(kappaEqSigRho);
        const tol = [1e-3, 1e-3, 0.2, 0.01, 1e-3];
        for (let iter = 0; iter < params.length; ++iter) {
            const s0 = new Handle(new SimpleQuote(1.0));
            const process = new HestonProcess(riskFreeTS, dividendTS, s0, params[iter].v0, params[iter].kappa, params[iter].theta, params[iter].sigma, params[iter].rho);
            const model = new HestonModel(process);
            const lobattoEngine = new AnalyticHestonEngine().aheInit1(model, 1e-10, 1000000);
            const laguerreEngine = new AnalyticHestonEngine().aheInit2(model, 128);
            const legendreEngine = new AnalyticHestonEngine().aheInit3(model, AnalyticHestonEngine.ComplexLogFormula.Gatheral, AnalyticHestonEngine.Integration.gaussLegendre(512));
            const chebyshevEngine = new AnalyticHestonEngine().aheInit3(model, AnalyticHestonEngine.ComplexLogFormula.Gatheral, AnalyticHestonEngine.Integration.gaussChebyshev(512));
            const chebyshev2ndEngine = new AnalyticHestonEngine().aheInit3(model, AnalyticHestonEngine.ComplexLogFormula.Gatheral, AnalyticHestonEngine.Integration.gaussChebyshev2nd(512));
            let maxLegendreDiff = 0.0;
            let maxChebyshevDiff = 0.0;
            let maxChebyshev2ndDiff = 0.0;
            let maxLaguerreDiff = 0.0;
            for (let i = 0; i < maturities.length; ++i) {
                const exercise = new EuropeanExercise(DateExt.advance(settlementDate, maturities[i], TimeUnit.Months));
                for (let j = 0; j < strikes.length; ++j) {
                    for (let k = 0; k < types.length; ++k) {
                        const payoff = new PlainVanillaPayoff(types[k], strikes[j]);
                        const option = new VanillaOption(payoff, exercise);
                        option.setPricingEngine(lobattoEngine);
                        const lobattoNPV = option.NPV();
                        option.setPricingEngine(laguerreEngine);
                        const laguerre = option.NPV();
                        option.setPricingEngine(legendreEngine);
                        const legendre = option.NPV();
                        option.setPricingEngine(chebyshevEngine);
                        const chebyshev = option.NPV();
                        option.setPricingEngine(chebyshev2ndEngine);
                        const chebyshev2nd = option.NPV();
                        maxLaguerreDiff =
                            Math.max(maxLaguerreDiff, Math.abs(lobattoNPV - laguerre));
                        maxLegendreDiff =
                            Math.max(maxLegendreDiff, Math.abs(lobattoNPV - legendre));
                        maxChebyshevDiff =
                            Math.max(maxChebyshevDiff, Math.abs(lobattoNPV - chebyshev));
                        maxChebyshev2ndDiff = Math.max(maxChebyshev2ndDiff, Math.abs(lobattoNPV - chebyshev2nd));
                    }
                }
            }
            const maxDiff = Math.max(Math.max(Math.max(maxLaguerreDiff, maxLegendreDiff), maxChebyshevDiff), maxChebyshev2ndDiff);
            const tr = tol[iter];
            expect(maxDiff).toBeLessThan(tr);
        }
        backup.dispose();
    });

    xit('Testing multiple-strikes FD Heston engine...', () => {
        const backup = new SavedSettings();
        const settlementDate = new Date('27-December-2004');
        Settings.evaluationDate.set(settlementDate);
        const dayCounter = new ActualActual();
        const exerciseDate = new Date('28-March-2006');
        const exercise = new EuropeanExercise(exerciseDate);
        const riskFreeTS = new Handle(flatRate4(0.06, dayCounter));
        const dividendTS = new Handle(flatRate4(0.02, dayCounter));
        const s0 = new Handle(new SimpleQuote(1.05));
        const process = new HestonProcess(riskFreeTS, dividendTS, s0, 0.16, 2.5, 0.09, 0.8, -0.8);
        const model = new HestonModel(process);
        const strikes = [];
        strikes.push(1.0);
        strikes.push(0.5);
        strikes.push(0.75);
        strikes.push(1.5);
        strikes.push(2.0);
        const singleStrikeEngine = new FdHestonVanillaEngine(model, 20, 400, 50);
        const multiStrikeEngine = new FdHestonVanillaEngine(model, 20, 400, 50);
        multiStrikeEngine.enableMultipleStrikesCaching(strikes);
        const relTol = 5e-3;
        for (let i = 0; i < strikes.length; ++i) {
            const payoff = new PlainVanillaPayoff(Option.Type.Put, strikes[i]);
            const aOption = new VanillaOption(payoff, exercise);
            aOption.setPricingEngine(multiStrikeEngine);
            const npvCalculated = aOption.NPV();
            const deltaCalculated = aOption.delta();
            const gammaCalculated = aOption.gamma();
            const thetaCalculated = aOption.theta();
            aOption.setPricingEngine(singleStrikeEngine);
            const npvExpected = aOption.NPV();
            const deltaExpected = aOption.delta();
            const gammaExpected = aOption.gamma();
            const thetaExpected = aOption.theta();
            expect(Math.abs(npvCalculated - npvExpected) / npvExpected)
                .toBeLessThan(relTol);
            expect(Math.abs(deltaCalculated - deltaExpected) / deltaExpected)
                .toBeLessThan(relTol);
            expect(Math.abs(gammaCalculated - gammaExpected) / gammaExpected)
                .toBeLessThan(relTol);
            expect(Math.abs(thetaCalculated - thetaExpected) / thetaExpected)
                .toBeLessThan(relTol);
        }
        backup.dispose();
    });

    it('Testing analytic piecewise time dependent Heston prices...', () => {
        const backup = new SavedSettings();
        const settlementDate = new Date('27-December-2004');
        Settings.evaluationDate.set(settlementDate);
        const dayCounter = new ActualActual();
        const exerciseDate = new Date('28-March-2005');
        const payoff = new PlainVanillaPayoff(Option.Type.Call, 1.0);
        const exercise = new EuropeanExercise(exerciseDate);
        const dates = [];
        dates.push(settlementDate);
        dates.push(new Date('01-January-2007'));
        const irates = [];
        irates.push(0.0);
        irates.push(0.2);
        const riskFreeTS = new Handle(new ZeroCurve().curveInit1(dates, irates, dayCounter));
        const qrates = [];
        qrates.push(0.0);
        qrates.push(0.3);
        const dividendTS = new Handle(new ZeroCurve().curveInit1(dates, qrates, dayCounter));
        const v0 = 0.1;
        const s0 = new Handle(new SimpleQuote(1.0));
        const theta = new ConstantParameter().cpInit2(0.09, new PositiveConstraint());
        const kappa = new ConstantParameter().cpInit2(3.16, new PositiveConstraint());
        const sigma = new ConstantParameter().cpInit2(4.40, new PositiveConstraint());
        const rho = new ConstantParameter().cpInit2(-0.8, new BoundaryConstraint(-1.0, 1.0));
        const model = new PiecewiseTimeDependentHestonModel(riskFreeTS, dividendTS, s0, v0, theta, kappa, sigma, rho, new TimeGrid().init1(20.0, 2));
        const option = new VanillaOption(payoff, exercise);
        const hestonProcess = new HestonProcess(riskFreeTS, dividendTS, s0, v0, kappa.f(0.0), theta.f(0.0), sigma.f(0.0), rho.f(0.0));
        const hestonModel = new HestonModel(hestonProcess);
        option.setPricingEngine(new AnalyticHestonEngine().aheInit2(hestonModel));
        const expected = option.NPV();
        option.setPricingEngine(new AnalyticPTDHestonEngine().aptdheInit2(model));
        const calculatedGatheral = option.NPV();
        expect(Math.abs(calculatedGatheral - expected)).toBeLessThan(1e-12);
        option.setPricingEngine(new AnalyticPTDHestonEngine().aptdheInit3(model, AnalyticPTDHestonEngine.ComplexLogFormula.AndersenPiterbarg, AnalyticHestonEngine.Integration.gaussLaguerre(164)));
        const calculatedAndersenPiterbarg = option.NPV();
        expect(Math.abs(calculatedAndersenPiterbarg - expected)).toBeLessThan(1e-8);
        backup.dispose();
    });

    it('Testing time-dependent Heston model calibration...', () => {
        const backup = new SavedSettings();
        const settlementDate = new Date('5-July-2002');
        Settings.evaluationDate.set(settlementDate);
        const marketData = getDAXCalibrationMarketData();
        const riskFreeTS = marketData.riskFreeTS;
        const dividendTS = marketData.dividendYield;
        const s0 = marketData.s0;
        const options = marketData.options;
        const modelTimes = [];
        modelTimes.push(0.25);
        modelTimes.push(10.0);
        const modelGrid = new TimeGrid().init2(modelTimes, 0, modelTimes.length);
        const v0 = 0.1;
        const sigma = new ConstantParameter().cpInit2(0.5, new PositiveConstraint());
        const theta = new ConstantParameter().cpInit2(0.1, new PositiveConstraint());
        const rho = new ConstantParameter().cpInit2(-0.5, new BoundaryConstraint(-1.0, 1.0));
        const pTimes = [0.25];
        const kappa = new PiecewiseConstantParameter(pTimes, new PositiveConstraint());
        for (let i = 0; i < pTimes.length + 1; ++i) {
            kappa.setParam(i, 10.0);
        }
        const model = new PiecewiseTimeDependentHestonModel(riskFreeTS, dividendTS, s0, v0, theta, kappa, sigma, rho, modelGrid);
        const engines = [
            new AnalyticPTDHestonEngine().aptdheInit2(model),
            new AnalyticPTDHestonEngine().aptdheInit3(model, AnalyticPTDHestonEngine.ComplexLogFormula.AndersenPiterbarg, AnalyticHestonEngine.Integration.gaussLaguerre(64)),
            new AnalyticPTDHestonEngine().aptdheInit3(model, AnalyticPTDHestonEngine.ComplexLogFormula.AndersenPiterbarg, AnalyticHestonEngine.Integration.discreteTrapezoid(72))
        ];
        for (let j = 0; j < engines.length; ++j) {
            const engine = engines[j];
            for (let i = 0; i < options.length; ++i) {
                options[i].setPricingEngine(engine);
            }
            const om = new LevenbergMarquardt(1e-8, 1e-8, 1e-8);
            model.calibrate(options, om, new EndCriteria(400, 40, 1.0e-8, 1.0e-8, 1.0e-8));
            let sse = 0;
            for (let i = 0; i < 13 * 8; ++i) {
                const diff = options[i].calibrationError() * 100.0;
                sse += diff * diff;
            }
            const expected = 74.4;
            expect(Math.abs(sse - expected)).toBeLessThan(1.0);
        }
        backup.dispose();
    });

    it('Testing Alan Lewis reference prices...', () => {
        const backup = new SavedSettings();
        const settlementDate = new Date('5-July-2002');
        Settings.evaluationDate.set(settlementDate);
        const maturityDate = new Date('5-July-2003');
        const exercise = new EuropeanExercise(maturityDate);
        const dayCounter = new Actual365Fixed();
        const riskFreeTS = new Handle(flatRate4(0.01, dayCounter));
        const dividendTS = new Handle(flatRate4(0.02, dayCounter));
        const s0 = new Handle(new SimpleQuote(100.0));
        const v0 = 0.04;
        const rho = -0.5;
        const sigma = 1.0;
        const kappa = 4.0;
        const theta = 0.25;
        const process = new HestonProcess(riskFreeTS, dividendTS, s0, v0, kappa, theta, sigma, rho);
        const model = new HestonModel(process);
        const laguerreEngine = new AnalyticHestonEngine().aheInit2(model, 128);
        const gaussLobattoEngine = new AnalyticHestonEngine().aheInit1(model, QL_EPSILON, 100000);
        const cosEngine = new COSHestonEngine(model, 20, 400);
        const andersenPiterbargEngine = new AnalyticHestonEngine().aheInit3(model, AnalyticHestonEngine.ComplexLogFormula.AndersenPiterbarg, AnalyticHestonEngine.Integration.discreteTrapezoid(92), QL_EPSILON);
        const strikes = [80, 90, 100, 110, 120];
        const types = [Option.Type.Put, Option.Type.Call];
        const engines = [
            laguerreEngine, gaussLobattoEngine, cosEngine, andersenPiterbargEngine
        ];
        const expectedResults = [
            [
                7.958878113256768285213263077598987193482161301733,
                26.774758743998854221382195325726949201687074848341
            ],
            [
                12.017966707346304987709573290236471654992071308187,
                20.933349000596710388139445766564068085476194042256
            ],
            [
                17.055270961270109413522653999411000974895436309183,
                16.070154917028834278213466703938231827658768230714
            ],
            [
                23.017825898442800538908781834822560777763225722188,
                12.132211516709844867860534767549426052805766831181
            ],
            [
                29.811026202682471843340682293165857439167301370697,
                9.024913483457835636553375454092357136489051667150
            ]
        ];
        const tol = 1e-12;
        for (let i = 0; i < strikes.length; ++i) {
            const strike = strikes[i];
            for (let j = 0; j < types.length; ++j) {
                const type = types[j];
                for (let k = 0; k < engines.length; ++k) {
                    const engine = engines[k];
                    const payoff = new PlainVanillaPayoff(type, strike);
                    const option = new VanillaOption(payoff, exercise);
                    option.setPricingEngine(engine);
                    const expected = expectedResults[i][j];
                    const calculated = option.NPV();
                    const relError = Math.abs(calculated - expected) / expected;
                    expect(relError).toBeLessThan(tol);
                    expect(calculated).not.toBeNaN();
                }
            }
        }
        backup.dispose();
    });

    it('Testing expansion on Alan Lewis reference prices...', () => {
        const backup = new SavedSettings();
        const settlementDate = new Date('5-July-2002');
        Settings.evaluationDate.set(settlementDate);
        const maturityDate = new Date('5-July-2003');
        const exercise = new EuropeanExercise(maturityDate);
        const dayCounter = new Actual365Fixed();
        const riskFreeTS = new Handle(flatRate4(0.01, dayCounter));
        const dividendTS = new Handle(flatRate4(0.02, dayCounter));
        const s0 = new Handle(new SimpleQuote(100.0));
        const v0 = 0.04;
        const rho = -0.5;
        const sigma = 1.0;
        const kappa = 4.0;
        const theta = 0.25;
        const process = new HestonProcess(riskFreeTS, dividendTS, s0, v0, kappa, theta, sigma, rho);
        const model = new HestonModel(process);
        const lpp2Engine = new HestonExpansionEngine(model, HestonExpansionEngine.HestonExpansionFormula.LPP2);
        const lpp3Engine = new HestonExpansionEngine(model, HestonExpansionEngine.HestonExpansionFormula.LPP3);
        const strikes = [80, 90, 100, 110, 120];
        const types = [Option.Type.Put, Option.Type.Call];
        const engines = [lpp2Engine, lpp3Engine];
        const expectedResults = [
            [
                7.958878113256768285213263077598987193482161301733,
                26.774758743998854221382195325726949201687074848341
            ],
            [
                12.017966707346304987709573290236471654992071308187,
                20.933349000596710388139445766564068085476194042256
            ],
            [
                17.055270961270109413522653999411000974895436309183,
                16.070154917028834278213466703938231827658768230714
            ],
            [
                23.017825898442800538908781834822560777763225722188,
                12.132211516709844867860534767549426052805766831181
            ],
            [
                29.811026202682471843340682293165857439167301370697,
                9.024913483457835636553375454092357136489051667150
            ]
        ];
        const tol = [1.003e-2, 3.645e-3];
        for (let i = 0; i < strikes.length; ++i) {
            const strike = strikes[i];
            for (let j = 0; j < types.length; ++j) {
                const type = types[j];
                for (let k = 0; k < engines.length; ++k) {
                    const engine = engines[k];
                    const payoff = new PlainVanillaPayoff(type, strike);
                    const option = new VanillaOption(payoff, exercise);
                    option.setPricingEngine(engine);
                    const expected = expectedResults[i][j];
                    const calculated = option.NPV();
                    const relError = Math.abs(calculated - expected) / expected;
                    expect(relError).toBeLessThan(tol[k]);
                }
            }
        }
        backup.dispose();
    });

    it('Testing expansion on Forde reference prices...', () => {
        const backup = new SavedSettings();
        const forward = 100.0;
        const v0 = 0.04;
        const rho = -0.4;
        const sigma = 0.2;
        const kappa = 1.15;
        const theta = 0.04;
        const terms = [0.1, 1.0, 5.0, 10.0];
        const strikes = [60, 80, 90, 100, 110, 120, 140];
        const referenceVols = [
            [
                0.27284673574924445, 0.22360758200372477, 0.21023988547031242,
                0.1990674789471587, 0.19118230678920461, 0.18721342919371017,
                0.1899869903378507
            ],
            [
                0.25200775151345, 0.2127275920953156, 0.20286528150874591,
                0.19479398358151515, 0.18872591728967686, 0.18470857955411824,
                0.18204457060905446
            ],
            [
                0.21637821506229973, 0.20077227130455172, 0.19721753043236154,
                0.1942233023784151, 0.191693211401571, 0.18955229722896752,
                0.18491727548069495
            ],
            [
                0.20672925973965342, 0.198583062164427, 0.19668274423922746,
                0.1950420231354201, 0.193610364344706, 0.1923502827886502,
                0.18934360917857015
            ]
        ];
        const tol = [
            [0.06, 0.03, 0.03, 0.02], [0.15, 0.08, 0.04, 0.02],
            [0.06, 0.08, 1.0, 1.0]
        ];
        const tolAtm = [
            [4e-6, 7e-4, 2e-3, 9e-4], [7e-6, 4e-4, 9e-4, 4e-4],
            [4e-4, 3e-2, 0.28, 1.0]
        ];
        for (let j = 0; j < terms.length; ++j) {
            const term = terms[j];
            const lpp2 = new LPP2HestonExpansion(kappa, theta, sigma, v0, rho, term);
            const lpp3 = new LPP3HestonExpansion(kappa, theta, sigma, v0, rho, term);
            const forde = new FordeHestonExpansion(kappa, theta, sigma, v0, rho, term);
            const expansions = [lpp2, lpp3, forde];
            for (let i = 0; i < strikes.length; ++i) {
                const strike = strikes[i];
                for (let k = 0; k < expansions.length; ++k) {
                    const expansion = expansions[k];
                    const expected = referenceVols[j][i];
                    const calculated = expansion.impliedVolatility(strike, forward);
                    const relError = Math.abs(calculated - expected) / expected;
                    const refTol = strike === forward ? tolAtm[k][j] : tol[k][j];
                    expect(relError).toBeLessThan(refTol);
                }
            }
        }
        backup.dispose();
    });

    it('Testing semi-analytic Heston pricing with all integration methods...', () => {
        const backup = new SavedSettings();
        const settlementDate = new Date('7-February-2017');
        Settings.evaluationDate.set(settlementDate);
        const dayCounter = new Actual365Fixed();
        const riskFreeTS = new Handle(flatRate4(0.05, dayCounter));
        const dividendTS = new Handle(flatRate4(0.075, dayCounter));
        const s0 = new Handle(new SimpleQuote(100.0));
        const v0 = 0.1;
        const rho = -0.75;
        const sigma = 0.4;
        const kappa = 4.0;
        const theta = 0.05;
        const model = new HestonModel(new HestonProcess(riskFreeTS, dividendTS, s0, v0, kappa, theta, sigma, rho));
        const payoff = new PlainVanillaPayoff(Option.Type.Put, s0.currentLink().value());
        const maturityDate = DateExt.advance(settlementDate, 1, TimeUnit.Years);
        const exercise = new EuropeanExercise(maturityDate);
        const option = new VanillaOption(payoff, exercise);
        const tol = 1e-8;
        const expected = 10.147041515497;
        reportOnIntegrationMethodTest(option, model, AnalyticHestonEngine.Integration.gaussLaguerre(), AnalyticHestonEngine.ComplexLogFormula.Gatheral, false, expected, tol, 256, 'Gauss-Laguerre with Gatheral logarithm');
        reportOnIntegrationMethodTest(option, model, AnalyticHestonEngine.Integration.gaussLaguerre(), AnalyticHestonEngine.ComplexLogFormula.BranchCorrection, false, expected, tol, 256, 'Gauss-Laguerre with branch correction');
        reportOnIntegrationMethodTest(option, model, AnalyticHestonEngine.Integration.gaussLaguerre(), AnalyticHestonEngine.ComplexLogFormula.AndersenPiterbarg, false, expected, tol, 128, 'Gauss-Laguerre with Andersen Piterbarg control variate');
        reportOnIntegrationMethodTest(option, model, AnalyticHestonEngine.Integration.gaussLegendre(), AnalyticHestonEngine.ComplexLogFormula.Gatheral, false, expected, tol, 256, 'Gauss-Legendre with Gatheral logarithm');
        reportOnIntegrationMethodTest(option, model, AnalyticHestonEngine.Integration.gaussLegendre(), AnalyticHestonEngine.ComplexLogFormula.BranchCorrection, false, expected, tol, 256, 'Gauss-Legendre with branch correction');
        reportOnIntegrationMethodTest(option, model, AnalyticHestonEngine.Integration.gaussLegendre(256), AnalyticHestonEngine.ComplexLogFormula.AndersenPiterbarg, false, expected, 1e-4, 256, 'Gauss-Legendre with Andersen Piterbarg control variate');
        reportOnIntegrationMethodTest(option, model, AnalyticHestonEngine.Integration.gaussChebyshev(512), AnalyticHestonEngine.ComplexLogFormula.Gatheral, false, expected, 1e-4, 1024, 'Gauss-Chebyshev with Gatheral logarithm');
        reportOnIntegrationMethodTest(option, model, AnalyticHestonEngine.Integration.gaussChebyshev(512), AnalyticHestonEngine.ComplexLogFormula.BranchCorrection, false, expected, 1e-4, 1024, 'Gauss-Chebyshev with branch correction');
        reportOnIntegrationMethodTest(option, model, AnalyticHestonEngine.Integration.gaussChebyshev(512), AnalyticHestonEngine.ComplexLogFormula.AndersenPiterbarg, false, expected, 1e-4, 512, 'Gauss-Laguerre with Andersen Piterbarg control variate');
        reportOnIntegrationMethodTest(option, model, AnalyticHestonEngine.Integration.gaussChebyshev2nd(512), AnalyticHestonEngine.ComplexLogFormula.Gatheral, false, expected, 2e-4, 1024, 'Gauss-Chebyshev2nd with Gatheral logarithm');
        reportOnIntegrationMethodTest(option, model, AnalyticHestonEngine.Integration.gaussChebyshev2nd(512), AnalyticHestonEngine.ComplexLogFormula.BranchCorrection, false, expected, 2e-4, 1024, 'Gauss-Chebyshev2nd with branch correction');
        reportOnIntegrationMethodTest(option, model, AnalyticHestonEngine.Integration.gaussChebyshev2nd(512), AnalyticHestonEngine.ComplexLogFormula.AndersenPiterbarg, false, expected, 2e-4, 512, 'Gauss-Chebyshev2nd with Andersen Piterbarg control variate');
        reportOnIntegrationMethodTest(option, model, AnalyticHestonEngine.Integration.discreteSimpson(512), AnalyticHestonEngine.ComplexLogFormula.Gatheral, false, expected, tol, 1024, 'Discrete Simpson rule with Gatheral logarithm');
        reportOnIntegrationMethodTest(option, model, AnalyticHestonEngine.Integration.discreteSimpson(64), AnalyticHestonEngine.ComplexLogFormula.AndersenPiterbarg, false, expected, tol, 64, 'Discrete Simpson rule with Andersen Piterbarg control variate');
        reportOnIntegrationMethodTest(option, model, AnalyticHestonEngine.Integration.discreteTrapezoid(512), AnalyticHestonEngine.ComplexLogFormula.Gatheral, false, expected, 2e-4, 1024, 'Discrete Trapezoid rule with Gatheral logarithm');
        reportOnIntegrationMethodTest(option, model, AnalyticHestonEngine.Integration.discreteTrapezoid(64), AnalyticHestonEngine.ComplexLogFormula.AndersenPiterbarg, false, expected, tol, 64, 'Discrete Trapezoid rule with Andersen Piterbarg control variate');
        reportOnIntegrationMethodTest(option, model, AnalyticHestonEngine.Integration.gaussLobatto(tol, QL_NULL_REAL), AnalyticHestonEngine.ComplexLogFormula.Gatheral, true, expected, tol, QL_NULL_INTEGER, 'Gauss-Lobatto with Gatheral logarithm');
        reportOnIntegrationMethodTest(option, model, AnalyticHestonEngine.Integration.gaussLobatto(tol, QL_NULL_REAL), AnalyticHestonEngine.ComplexLogFormula.AndersenPiterbarg, true, expected, tol, QL_NULL_INTEGER, 'Gauss-Lobatto with Andersen Piterbarg control variate');
        reportOnIntegrationMethodTest(option, model, AnalyticHestonEngine.Integration.gaussKronrod(tol), AnalyticHestonEngine.ComplexLogFormula.Gatheral, true, expected, tol, QL_NULL_INTEGER, 'Gauss-Konrod with Gatheral logarithm');
        reportOnIntegrationMethodTest(option, model, AnalyticHestonEngine.Integration.gaussKronrod(tol), AnalyticHestonEngine.ComplexLogFormula.AndersenPiterbarg, true, expected, tol, QL_NULL_INTEGER, 'Gauss-Konrod with Andersen Piterbarg control variate');
        reportOnIntegrationMethodTest(option, model, AnalyticHestonEngine.Integration.simpson(tol), AnalyticHestonEngine.ComplexLogFormula.Gatheral, true, expected, 1e-6, QL_NULL_INTEGER, 'Simpson with Gatheral logarithm');
        reportOnIntegrationMethodTest(option, model, AnalyticHestonEngine.Integration.simpson(tol), AnalyticHestonEngine.ComplexLogFormula.AndersenPiterbarg, true, expected, 1e-6, QL_NULL_INTEGER, 'Simpson with Andersen Piterbarg control variate');
        reportOnIntegrationMethodTest(option, model, AnalyticHestonEngine.Integration.trapezoid(tol), AnalyticHestonEngine.ComplexLogFormula.Gatheral, true, expected, 1e-6, QL_NULL_INTEGER, 'Trapezoid with Gatheral logarithm');
        reportOnIntegrationMethodTest(option, model, AnalyticHestonEngine.Integration.trapezoid(tol), AnalyticHestonEngine.ComplexLogFormula.AndersenPiterbarg, true, expected, 1e-6, QL_NULL_INTEGER, 'Trapezoid with Andersen Piterbarg control variate');
        backup.dispose();
    });

    it('Testing Heston COS cumulants...', () => {
        const backup = new SavedSettings();
        const settlementDate = new Date('7-February-2017');
        Settings.evaluationDate.set(settlementDate);
        const dayCounter = new Actual365Fixed();
        const riskFreeTS = new Handle(flatRate4(0.15, dayCounter));
        const dividendTS = new Handle(flatRate4(0.075, dayCounter));
        const s0 = new Handle(new SimpleQuote(100.0));
        const v0 = 0.1;
        const rho = -0.75;
        const sigma = 0.4;
        const kappa = 4.0;
        const theta = 0.25;
        const model = new HestonModel(new HestonProcess(riskFreeTS, dividendTS, s0, v0, kappa, theta, sigma, rho));
        const cosEngine = new COSHestonEngine(model);
        const tol = 1e-7;
        const central = NumericalDifferentiation.Scheme.Central;
        for (let t = 0.01; t < 41.0; t += t) {
            const nc1 = new NumericalDifferentiation()
                .init2(new LogCharacteristicFunction(1, t, cosEngine), 1, 1e-5, 5, central)
                .f(0.0);
            const c1 = cosEngine.c1(t);
            expect(Math.abs(nc1 - c1)).toBeLessThan(tol);
            const nc2 = new NumericalDifferentiation()
                .init2(new LogCharacteristicFunction(2, t, cosEngine), 2, 1e-2, 5, central)
                .f(0.0);
            const c2 = cosEngine.c2(t);
            expect(Math.abs(nc2 - c2)).toBeLessThan(tol);
            const nc3 = new NumericalDifferentiation()
                .init2(new LogCharacteristicFunction(3, t, cosEngine), 3, 5e-3, 7, central)
                .f(0.0);
            const c3 = cosEngine.c3(t);
            expect(Math.abs(nc3 - c3)).toBeLessThan(tol);
            const nc4 = new NumericalDifferentiation()
                .init2(new LogCharacteristicFunction(4, t, cosEngine), 4, 5e-2, 9, central)
                .f(0.0);
            const c4 = cosEngine.c4(t);
            expect(Math.abs(nc4 - c4)).toBeLessThan(10 * tol);
        }
        backup.dispose();
    });

    it('Testing Heston pricing via COS method...', () => {
        const backup = new SavedSettings();
        const settlementDate = new Date('7-February-2017');
        Settings.evaluationDate.set(settlementDate);
        const dayCounter = new Actual365Fixed();
        const riskFreeTS = new Handle(flatRate4(0.15, dayCounter));
        const dividendTS = new Handle(flatRate4(0.07, dayCounter));
        const s0 = new Handle(new SimpleQuote(100.0));
        const v0 = 0.1;
        const rho = -0.75;
        const sigma = 1.8;
        const kappa = 4.0;
        const theta = 0.22;
        const model = new HestonModel(new HestonProcess(riskFreeTS, dividendTS, s0, v0, kappa, theta, sigma, rho));
        const maturityDate = DateExt.advance(settlementDate, 1, TimeUnit.Years);
        const exercise = new EuropeanExercise(maturityDate);
        const cosEngine = new COSHestonEngine(model, 25, 600);
        const payoffs = [
            new PlainVanillaPayoff(Option.Type.Call, s0.currentLink().value() + 20),
            new PlainVanillaPayoff(Option.Type.Call, s0.currentLink().value() + 150),
            new PlainVanillaPayoff(Option.Type.Put, s0.currentLink().value() - 20),
            new PlainVanillaPayoff(Option.Type.Put, s0.currentLink().value() - 90)
        ];
        const expected = [
            9.364410588426075, 0.01036797658132471, 5.319092971836708,
            0.01032681906278383
        ];
        const tol = 1e-10;
        for (let i = 0; i < payoffs.length; ++i) {
            const option = new VanillaOption(payoffs[i], exercise);
            option.setPricingEngine(cosEngine);
            const calculated = option.NPV();
            const error = Math.abs(expected[i] - calculated);
            expect(error).toBeLessThan(tol);
        }
        backup.dispose();
    });

    it('Testing Heston characteristic function...', () => {
        const backup = new SavedSettings();
        const settlementDate = new Date('30-March-2017');
        Settings.evaluationDate.set(settlementDate);
        const dayCounter = new Actual365Fixed();
        const riskFreeTS = new Handle(flatRate4(0.35, dayCounter));
        const dividendTS = new Handle(flatRate4(0.17, dayCounter));
        const s0 = new Handle(new SimpleQuote(100.0));
        const v0 = 0.1;
        const rho = -0.85;
        const sigma = 0.8;
        const kappa = 2.0;
        const theta = 0.15;
        const model = new HestonModel(new HestonProcess(riskFreeTS, dividendTS, s0, v0, kappa, theta, sigma, rho));
        const u = [1.0, 0.45, 3, 4];
        const t = [0.01, 23.2, 3.2];
        const cosEngine = new COSHestonEngine(model);
        const analyticEngine = new AnalyticHestonEngine().aheInit2(model);
        const tol = 100 * QL_EPSILON;
        for (let i = 0; i < u.length; ++i) {
            for (let j = 0; j < t.length; ++j) {
                const c = cosEngine.chF(u[i], t[j]);
                const a = analyticEngine.chF(new Complex(u[i]), t[j]);
                const error = Complex.abs(a.sub(c));
                expect(error).toBeLessThan(tol);
            }
        }
        backup.dispose();
    });

    it('Testing Andersen-Piterbarg method to price under the Heston model...', () => {
        const backup = new SavedSettings();
        const settlementDate = new Date('30-March-2017');
        Settings.evaluationDate.set(settlementDate);
        const dayCounter = new Actual365Fixed();
        const riskFreeTS = new Handle(flatRate4(0.10, dayCounter));
        const dividendTS = new Handle(flatRate4(0.06, dayCounter));
        const s0 = new Handle(new SimpleQuote(100.0));
        const v0 = 0.1;
        const rho = 0.80;
        const sigma = 0.75;
        const kappa = 1.0;
        const theta = 0.1;
        const model = new HestonModel(new HestonProcess(riskFreeTS, dividendTS, s0, v0, kappa, theta, sigma, rho));
        const andersenPiterbargLaguerreEngine = new AnalyticHestonEngine().aheInit3(model, AnalyticHestonEngine.ComplexLogFormula.AndersenPiterbarg, AnalyticHestonEngine.Integration.gaussLaguerre());
        const andersenPiterbargLobattoEngine = new AnalyticHestonEngine().aheInit3(model, AnalyticHestonEngine.ComplexLogFormula.AndersenPiterbarg, AnalyticHestonEngine.Integration.gaussLobatto(QL_NULL_REAL, 1e-9, 10000), 1e-9);
        const andersenPiterbargSimpsonEngine = new AnalyticHestonEngine().aheInit3(model, AnalyticHestonEngine.ComplexLogFormula.AndersenPiterbarg, AnalyticHestonEngine.Integration.discreteSimpson(256), 1e-8);
        const andersenPiterbargTrapezoidEngine = new AnalyticHestonEngine().aheInit3(model, AnalyticHestonEngine.ComplexLogFormula.AndersenPiterbarg, AnalyticHestonEngine.Integration.discreteTrapezoid(164), 1e-8);
        const andersenPiterbargTrapezoidEngine2 = new AnalyticHestonEngine().aheInit3(model, AnalyticHestonEngine.ComplexLogFormula.AndersenPiterbarg, AnalyticHestonEngine.Integration.trapezoid(1e-8, 256), 1e-8);
        const engines = [
            andersenPiterbargLaguerreEngine, andersenPiterbargLobattoEngine,
            andersenPiterbargSimpsonEngine, andersenPiterbargTrapezoidEngine,
            andersenPiterbargTrapezoidEngine2
        ];
        const analyticEngine = new AnalyticHestonEngine().aheInit2(model, 178);
        const maturityDates = [
            DateExt.advance(settlementDate, 1, TimeUnit.Days),
            DateExt.advance(settlementDate, 1, TimeUnit.Weeks),
            DateExt.advance(settlementDate, 1, TimeUnit.Years),
            DateExt.advance(settlementDate, 10, TimeUnit.Years)
        ];
        const optionTypes = [Option.Type.Call, Option.Type.Put];
        const strikes = [50, 75, 90, 100, 110, 130, 150, 200];
        const tol = 1e-7;
        for (let u = 0; u < maturityDates.length; ++u) {
            const exercise = new EuropeanExercise(maturityDates[u]);
            for (let i = 0; i < optionTypes.length; ++i) {
                for (let j = 0; j < strikes.length; ++j) {
                    const option = new VanillaOption(new PlainVanillaPayoff(optionTypes[i], strikes[j]), exercise);
                    option.setPricingEngine(analyticEngine);
                    const expected = option.NPV();
                    for (let k = 0; k < engines.length; ++k) {
                        option.setPricingEngine(engines[k]);
                        const calculated = option.NPV();
                        const error = Math.abs(calculated - expected);
                        expect(error).toBeLessThan(tol);
                    }
                }
            }
        }
        backup.dispose();
    });

    it('Testing Andersen-Piterbarg Integrand with control variate...', () => {
        const backup = new SavedSettings();
        const settlementDate = new Date('17-April-2017');
        Settings.evaluationDate.set(settlementDate);
        const dayCounter = new Actual365Fixed();
        const rTS = new Handle(flatRate4(0.075, dayCounter));
        const qTS = new Handle(flatRate4(0.05, dayCounter));
        const s0 = new Handle(new SimpleQuote(100.0));
        const maturity = 2.0;
        const sx = Math.log(200.0);
        const dd = Math.log(s0.currentLink().value() * qTS.currentLink().discount2(maturity) /
            rTS.currentLink().discount2(maturity));
        const v0 = 0.08;
        const rho = -0.80;
        const sigma = 0.5;
        const kappa = 4.0;
        const theta = 0.05;
        const hestonModel = new HestonModel(new HestonProcess(rTS, qTS, s0, v0, kappa, theta, sigma, rho));
        const cosEngine = new COSHestonEngine(hestonModel);
        const engine = new AnalyticHestonEngine().aheInit3(hestonModel, AnalyticHestonEngine.ComplexLogFormula.AndersenPiterbarg, AnalyticHestonEngine.Integration.gaussLaguerre());
        const variances = [
            v0 * maturity,
            ((1 - Math.exp(-kappa * maturity)) * (v0 - theta) / (kappa * maturity) +
                theta) *
                maturity,
            cosEngine.c2(maturity)
        ];
        for (let i = 0; i < variances.length; ++i) {
            const sigmaBS = Math.sqrt(variances[i] / maturity);
            for (let u = 0.001; u < 10; u *= 1.05) {
                const z = new Complex(u, -0.5);
                const phiBS = Complex.exp(Complex.add(z.mul(z), new Complex(-z.imag(), z.real()))
                    .mulScalar(-0.5 * sigmaBS * sigmaBS * maturity));
                const ex = Complex.exp(new Complex(0.0, u * (dd - sx)));
                const chf = engine.chF(z, maturity);
                const cv = ex.mul(phiBS.sub(chf)).divScalar((u * u + 0.25)).real();
                expect(Math.abs(cv)).toBeLessThan(0.03);
            }
        }
        backup.dispose();
    });

    it('Testing Andersen-Piterbarg pricing convergence...', () => {
        const backup = new SavedSettings();
        const settlementDate = new Date('5-July-2002');
        Settings.evaluationDate.set(settlementDate);
        const maturityDate = new Date('5-July-2003');
        const dayCounter = new Actual365Fixed();
        const rTS = new Handle(flatRate4(0.01, dayCounter));
        const qTS = new Handle(flatRate4(0.02, dayCounter));
        const s0 = new Handle(new SimpleQuote(100.0));
        const v0 = 0.04;
        const rho = -0.5;
        const sigma = 1.0;
        const kappa = 4.0;
        const theta = 0.25;
        const hestonModel = new HestonModel(new HestonProcess(rTS, qTS, s0, v0, kappa, theta, sigma, rho));
        const option = new VanillaOption(new PlainVanillaPayoff(Option.Type.Call, s0.currentLink().value()), new EuropeanExercise(maturityDate));
        const reference = 16.070154917028834278213466703938231827658768230714;
        const diffs = [
            0.0892433814611486298, 0.00013096156482816923, 1.34107015270501506e-07,
            1.22913235145460931e-10, 1.24344978758017533e-13
        ];
        for (let n = 10; n <= 50; n += 10) {
            option.setPricingEngine(new AnalyticHestonEngine().aheInit3(hestonModel, AnalyticHestonEngine.ComplexLogFormula.AndersenPiterbarg, AnalyticHestonEngine.Integration.discreteTrapezoid(n), 1e-13));
            const calculatedDiff = Math.abs(option.NPV() - reference);
            expect(calculatedDiff).toBeLessThan(1.25 * diffs[n / 10 - 1]);
        }
        backup.dispose();
    });

    it('Testing piecewise time dependent ChF vs Heston ChF...', () => {
        const backup = new SavedSettings();
        const settlementDate = new Date('5-July-2017');
        Settings.evaluationDate.set(settlementDate);
        const maturityDate = new Date('5-July-2018');
        const dayCounter = new Actual365Fixed();
        const rTS = new Handle(flatRate4(0.01, dayCounter));
        const qTS = new Handle(flatRate4(0.02, dayCounter));
        const s0 = new Handle(new SimpleQuote(100.0));
        const v0 = 0.04;
        const rho = -0.5;
        const sigma = 1.0;
        const kappa = 4.0;
        const theta = 0.25;
        const thetaP = new ConstantParameter().cpInit2(theta, new PositiveConstraint());
        const kappaP = new ConstantParameter().cpInit2(kappa, new PositiveConstraint());
        const sigmaP = new ConstantParameter().cpInit2(sigma, new PositiveConstraint());
        const rhoP = new ConstantParameter().cpInit2(rho, new BoundaryConstraint(-1.0, 1.0));
        const analyticEngine = new AnalyticHestonEngine().aheInit2(new HestonModel(new HestonProcess(rTS, qTS, s0, v0, kappa, theta, sigma, rho)));
        const ptdHestonEngine = new AnalyticPTDHestonEngine().aptdheInit2(new PiecewiseTimeDependentHestonModel(rTS, qTS, s0, v0, thetaP, kappaP, sigmaP, rhoP, new TimeGrid().init1(dayCounter.yearFraction(settlementDate, maturityDate), 10)));
        const tol = 100 * QL_EPSILON;
        for (let r = 0.1; r < 4; r += 0.25) {
            for (let phi = 0; phi < 360; phi += 60) {
                for (let t = 0.1; t <= 1.0; t += 0.3) {
                    const z = Complex.exp(new Complex(0, phi)).mulScalar(r);
                    const a = analyticEngine.chF(z, t);
                    const b = ptdHestonEngine.chF(z, t);
                    expect(Complex.abs(a.sub(b))).toBeLessThan(tol);
                }
            }
        }
        backup.dispose();
    });

    it('Testing piecewise time dependent comparison...', () => {
        const backup = new SavedSettings();
        const settlementDate = new Date('5-July-2017');
        Settings.evaluationDate.set(settlementDate);
        const dc = new Actual365Fixed();
        const maturityDate = new Date('5-July-2018');
        const maturity = dc.yearFraction(settlementDate, maturityDate);
        const rTS = new Handle(flatRate4(0.05, dc));
        const qTS = new Handle(flatRate4(0.08, dc));
        const s0 = new Handle(new SimpleQuote(100.0));
        const modelTimes = [];
        modelTimes.push(0.25);
        modelTimes.push(0.75);
        modelTimes.push(10.0);
        const modelGrid = new TimeGrid().init2(modelTimes, 0, modelTimes.length);
        const v0 = 0.1;
        const theta = new ConstantParameter().cpInit2(0.1, new PositiveConstraint());
        const kappa = new ConstantParameter().cpInit2(1.0, new PositiveConstraint());
        const rho = new ConstantParameter().cpInit2(-0.75, new BoundaryConstraint(-1.0, 1.0));
        const pTimes = new Array(2);
        pTimes[0] = 0.25;
        pTimes[1] = 0.75;
        const sigma = new PiecewiseConstantParameter(pTimes, new PositiveConstraint());
        sigma.setParam(0, 0.30);
        sigma.setParam(1, 0.15);
        sigma.setParam(2, 1.25);
        const option = new VanillaOption(new PlainVanillaPayoff(Option.Type.Call, s0.currentLink().value()), new EuropeanExercise(maturityDate));
        const ptdModel = new PiecewiseTimeDependentHestonModel(rTS, qTS, s0, v0, theta, kappa, sigma, rho, modelGrid);
        const ptdHestonEngine = new AnalyticPTDHestonEngine().aptdheInit2(ptdModel);
        option.setPricingEngine(ptdHestonEngine);
        const calculatedGatheral = option.NPV();
        const ptdAPEngine = new AnalyticPTDHestonEngine().aptdheInit3(ptdModel, AnalyticPTDHestonEngine.ComplexLogFormula.AndersenPiterbarg, AnalyticHestonEngine.Integration.discreteTrapezoid(128), 1e-12);
        option.setPricingEngine(ptdAPEngine);
        const calculatedAndersenPiterbarg = option.NPV();
        expect(Math.abs(calculatedGatheral - calculatedAndersenPiterbarg))
            .toBeLessThan(1e-10);
        const firstPartProcess = new HestonProcess(rTS, qTS, s0, v0, 1.0, 0.1, 0.30, -0.75, HestonProcess.Discretization.QuadraticExponentialMartingale);
        const firstPathGen = new MultiPathGenerator(firstPartProcess, new TimeGrid().init1(pTimes[0], 6), new PseudoRandom().make_sequence_generator(12, 1234));
        const urng = new MersenneTwisterUniformRng().init1(5678);
        const stat = new RiskStatistics();
        const df = rTS.currentLink().discount1(maturityDate);
        const nSims = 10000;
        for (let i = 0; i < nSims; ++i) {
            let priceS = 0.0;
            for (let j = 0; j < 2; ++j) {
                const path1 = (j & 1) ? firstPathGen.antithetic() : firstPathGen.next();
                const spot1 = path1.value.at(0).back;
                const v1 = path1.value.at(1).back;
                const secondPathGen = new MultiPathGenerator(new HestonProcess(rTS, qTS, new Handle(new SimpleQuote(spot1)), v1, 1.0, 0.1, 0.15, -0.75, HestonProcess.Discretization.QuadraticExponentialMartingale), new TimeGrid().init1(pTimes[1] - pTimes[0], 12), new PseudoRandom().make_sequence_generator(24, urng.nextInt32()));
                const path2 = secondPathGen.next();
                const spot2 = path2.value.at(0).back;
                const v2 = path2.value.at(1).back;
                const thirdPathGen = new MultiPathGenerator(new HestonProcess(rTS, qTS, new Handle(new SimpleQuote(spot2)), v2, 1.0, 0.1, 1.25, -0.75, HestonProcess.Discretization.QuadraticExponentialMartingale), new TimeGrid().init1(maturity - pTimes[1], 6), new PseudoRandom().make_sequence_generator(12, urng.nextInt32()));
                const path3 = thirdPathGen.next();
                const spot3 = path3.value.at(0).back;
                priceS += 0.5 * option.payoff().f(spot3);
            }
            stat.add(priceS * df);
        }
        const calculatedMC = stat.mean();
        const errorEstimate = stat.errorEstimate();
        expect(Math.abs(calculatedMC - calculatedGatheral))
            .toBeLessThan(3.0 * errorEstimate);
        backup.dispose();
    });
    
    it('Testing piecewise time dependent ChF Asymtotic...', () => {
        const backup = new SavedSettings();
        const settlementDate = new Date('5-July-2017');
        Settings.evaluationDate.set(settlementDate);
        const maturityDate = DateExt.advance(settlementDate, 13, TimeUnit.Months);
        const dc = new Actual365Fixed();
        const maturity = dc.yearFraction(settlementDate, maturityDate);
        const rTS = new Handle(flatRate4(0.0, dc));
        const modelTimes = [];
        modelTimes.push(0.01);
        modelTimes.push(0.5);
        modelTimes.push(2.0);
        const modelGrid = new TimeGrid().init2(modelTimes, 0, modelTimes.length);
        const v0 = 0.1;
        const pTimes = modelTimes.slice(0, modelTimes.length - 1);
        const sigma = new PiecewiseConstantParameter(pTimes, new PositiveConstraint());
        const theta = new PiecewiseConstantParameter(pTimes, new PositiveConstraint());
        const kappa = new PiecewiseConstantParameter(pTimes, new PositiveConstraint());
        const rho = new PiecewiseConstantParameter(pTimes, new BoundaryConstraint(-1.0, 1.0));
        const sigmas = [0.01, 0.2, 0.6];
        const thetas = [0.16, 0.06, 0.36];
        const kappas = [1.0, 0.3, 4.0];
        const rhos = [0.5, -0.75, -0.25];
        for (let i = 0; i < 3; ++i) {
            sigma.setParam(i, sigmas[i]);
            theta.setParam(i, thetas[i]);
            kappa.setParam(i, kappas[i]);
            rho.setParam(i, rhos[i]);
        }
        const s0 = new Handle(new SimpleQuote(100.0));
        const ptdModel = new PiecewiseTimeDependentHestonModel(rTS, rTS, s0, v0, theta, kappa, sigma, rho, modelGrid);
        const eps = 1e-8;
        const ptdHestonEngine = new AnalyticPTDHestonEngine().aptdheInit3(ptdModel, AnalyticPTDHestonEngine.ComplexLogFormula.AndersenPiterbarg, AnalyticHestonEngine.Integration.discreteTrapezoid(128), eps);
        const D_u_inf = new Complex(Math.sqrt(1 - rhos[0] * rhos[0]), rhos[0])
            .divScalar(-sigmas[0]);
        const dd = new Complex(kappas[0], (2 * kappas[0] * rhos[0] - sigmas[0]) /
            (2 * Math.sqrt(1 - rhos[0] * rhos[0])))
            .divScalar(sigmas[0] * sigmas[0]);
        let C_u_inf = new Complex(0.0, 0.0), cc = new Complex(0.0, 0.0), clog = new Complex(0.0, 0.0);
        for (let i = 0; i < 3; ++i) {
            const kappa = kappas[i];
            const theta = thetas[i];
            const sigma = sigmas[i];
            const rho = rhos[i];
            const tau = Math.min(maturity, modelGrid.at(i + 1)) - modelGrid.at(i);
            C_u_inf = Complex.add(C_u_inf, new Complex(Math.sqrt(1 - rho * rho), rho)
                .mulScalar(-kappa * theta * tau / sigma));
            cc = Complex.add(cc, new Complex(2 * kappa, (2 * kappa * rho - sigma) / Math.sqrt(1 - rho * rho))
                .mulScalar(kappa * tau * theta / (2 * sigma * sigma)));
            const Di = (i < 2) ?
                new Complex(Math.sqrt(1 - rhos[i + 1] * rhos[i + 1]), rhos[i + 1])
                    .mulScalar(sigma / sigmas[i + 1]) :
                new Complex(0.0, 0.0);
            clog = Complex.add(clog, Complex
                .log(Complex
                .div(Di.sub(new Complex(Math.sqrt(1 - rho * rho), rho)), Di.add(new Complex(Math.sqrt(1 - rho * rho), -rho)))
                .mulScalar(-1)
                .addScalar(1.0))
                .mulScalar(2 * kappa * theta / (sigma * sigma)));
        }
        const epsilon = eps * M_PI / s0.currentLink().value();
        const uM = AnalyticHestonEngine.Integration.andersenPiterbargIntegrationLimit(-Complex.add(C_u_inf, D_u_inf.mulScalar(v0)).real(), epsilon, v0, maturity);
        const expectedUM = 18.6918883427;
        expect(Math.abs(uM - expectedUM) > 1e-5);
        const u = 1e8;
        const expectedlnChF = ptdHestonEngine.lnChF(new Complex(u), maturity);
        const calculatedAsympotic = Complex.add(Complex.add(Complex.add(D_u_inf.mulScalar(u).add(dd).mulScalar(v0), C_u_inf.mulScalar(u)), cc), clog);
        expect(Complex.abs(expectedlnChF.sub(calculatedAsympotic)))
            .toBeLessThan(0.01);
        const option = new VanillaOption(new PlainVanillaPayoff(Option.Type.Call, s0.currentLink().value()), new EuropeanExercise(maturityDate));
        option.setPricingEngine(ptdHestonEngine);
        const expectedNPV = 17.43851162589377;
        const calculatedNPV = option.NPV();
        const diffNPV = Math.abs(expectedNPV - calculatedNPV);
        expect(diffNPV).toBeLessThan(1e-9);
        backup.dispose();
    });
});

describe(`Heston model experimental tests ${version}`, () => {
    it('Testing analytic PDF Heston engine...', () => {
        const backup = new SavedSettings();
        const settlementDate = new Date('5-January-2014');
        Settings.evaluationDate.set(settlementDate);
        const dayCounter = new Actual365Fixed();
        const riskFreeTS = new Handle(flatRate4(0.07, dayCounter));
        const dividendTS = new Handle(flatRate4(0.185, dayCounter));
        const s0 = new Handle(new SimpleQuote(100.0));
        const v0 = 0.1;
        const rho = -0.5;
        const sigma = 1.0;
        const kappa = 4.0;
        const theta = 0.05;
        const model = new HestonModel(new HestonProcess(riskFreeTS, dividendTS, s0, v0, kappa, theta, sigma, rho));
        const tol = 1e-6;
        const pdfEngine = new AnalyticPDFHestonEngine(model, tol);
        const analyticEngine = new AnalyticHestonEngine().aheInit2(model, 178);
        const maturityDate = new Date('5-July-2014');
        const maturity = dayCounter.yearFraction(settlementDate, maturityDate);
        const exercise = new EuropeanExercise(maturityDate);
        for (let strike = 40; strike < 190; strike += 20) {
            const vanillaPayoff = new PlainVanillaPayoff(Option.Type.Call, strike);
            const planVanillaOption = new VanillaOption(vanillaPayoff, exercise);
            planVanillaOption.setPricingEngine(pdfEngine);
            const calculated = planVanillaOption.NPV();
            planVanillaOption.setPricingEngine(analyticEngine);
            const expected = planVanillaOption.NPV();
            expect(Math.abs(calculated - expected)).toBeLessThan(3 * tol);
        }
        for (let strike = 40; strike < 190; strike += 10) {
            const digitalOption = new VanillaOption(new CashOrNothingPayoff(Option.Type.Call, strike, 1.0), exercise);
            digitalOption.setPricingEngine(pdfEngine);
            const calculated = digitalOption.NPV();
            const eps = 0.01;
            const longCall = new VanillaOption(new PlainVanillaPayoff(Option.Type.Call, strike - eps), exercise);
            longCall.setPricingEngine(analyticEngine);
            const shortCall = new VanillaOption(new PlainVanillaPayoff(Option.Type.Call, strike + eps), exercise);
            shortCall.setPricingEngine(analyticEngine);
            const expected = (longCall.NPV() - shortCall.NPV()) / (2 * eps);
            expect(Math.abs(calculated - expected)).toBeLessThan(tol);
            const d = riskFreeTS.currentLink().discount1(maturityDate);
            const expectedCDF = 1.0 - expected / d;
            const calculatedCDF = pdfEngine.cdf(strike, maturity);
            expect(Math.abs(expectedCDF - calculatedCDF)).toBeLessThan(tol);
        }
        backup.dispose();
    });
});