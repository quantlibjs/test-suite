import { Actual365Fixed, ActualActual, AnalyticGJRGARCHEngine, BlackCalibrationHelper, CumulativeNormalDistribution, DateExt, EndCriteria, EuropeanExercise, GJRGARCHModel, GJRGARCHProcess, Handle, HestonModelHelper, M_PI, MakeMCEuropeanGJRGARCHEngine, Option, Period, PlainVanillaPayoff, PseudoRandom, SavedSettings, Settings, SimpleQuote, Simplex, TARGET, TimeUnit, VanillaOption, ZeroCurve } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate2 } from '/test-suite/utilities.mjs';

describe('GJR-GARCH model tests', () => {
    it('Testing Monte Carlo GJR-GARCH engine' +
        ' against analytic GJR-GARCH engine...', () => {
        const dayCounter = new ActualActual();
        const today = new Date();
        const riskFreeTS = new Handle(flatRate2(today, 0.05, dayCounter));
        const dividendTS = new Handle(flatRate2(today, 0.0, dayCounter));
        const s0 = 50.0;
        const omega = 2.0e-6;
        const alpha = 0.024;
        const beta = 0.93;
        const gamma = 0.059;
        const daysPerYear = 365.0;
        const maturity = [90, 180];
        const strike = [35, 40, 45, 50, 55, 60];
        const Lambda = [0.0, 0.1, 0.2];
        const analytic = new Array(3);
        for (let i = 0; i < analytic.length; i++) {
            analytic[i] = new Array(2);
            for (let j = 0; j < analytic[i].length; j++) {
                analytic[i][j] = new Array(6);
            }
        }
        analytic[0][0][0] = 15.4315;
        analytic[0][0][1] = 10.5552;
        analytic[0][0][2] = 5.9625;
        analytic[0][0][3] = 2.3282;
        analytic[0][0][4] = 0.5408;
        analytic[0][0][5] = 0.0835;
        analytic[0][1][0] = 15.8969;
        analytic[0][1][1] = 11.2173;
        analytic[0][1][2] = 6.9112;
        analytic[0][1][3] = 3.4788;
        analytic[0][1][4] = 1.3769;
        analytic[0][1][5] = 0.4357;
        analytic[1][0][0] = 15.4556;
        analytic[1][0][1] = 10.6929;
        analytic[1][0][2] = 6.2381;
        analytic[1][0][3] = 2.6831;
        analytic[1][0][4] = 0.7822;
        analytic[1][0][5] = 0.1738;
        analytic[1][1][0] = 16.0587;
        analytic[1][1][1] = 11.5338;
        analytic[1][1][2] = 7.3170;
        analytic[1][1][3] = 3.9074;
        analytic[1][1][4] = 1.7279;
        analytic[1][1][5] = 0.6568;
        analytic[2][0][0] = 15.8000;
        analytic[2][0][1] = 11.2734;
        analytic[2][0][2] = 7.0376;
        analytic[2][0][3] = 3.6767;
        analytic[2][0][4] = 1.5871;
        analytic[2][0][5] = 0.5934;
        analytic[2][1][0] = 16.9286;
        analytic[2][1][1] = 12.3170;
        analytic[2][1][2] = 8.0405;
        analytic[2][1][3] = 4.6348;
        analytic[2][1][4] = 2.3429;
        analytic[2][1][5] = 1.0590;
        const mcValues = new Array(3);
        for (let i = 0; i < analytic.length; i++) {
            analytic[i] = new Array(2);
            for (let j = 0; j < analytic[i].length; j++) {
                analytic[i][j] = new Array(6);
            }
        }
        mcValues[0][0][0] = 15.4332;
        mcValues[0][0][1] = 10.5453;
        mcValues[0][0][2] = 5.9351;
        mcValues[0][0][3] = 2.3521;
        mcValues[0][0][4] = 0.5597;
        mcValues[0][0][5] = 0.0776;
        mcValues[0][1][0] = 15.8910;
        mcValues[0][1][1] = 11.1772;
        mcValues[0][1][2] = 6.8827;
        mcValues[0][1][3] = 3.5096;
        mcValues[0][1][4] = 1.4196;
        mcValues[0][1][5] = 0.4502;
        mcValues[1][0][0] = 15.4580;
        mcValues[1][0][1] = 10.6433;
        mcValues[1][0][2] = 6.2019;
        mcValues[1][0][3] = 2.7513;
        mcValues[1][0][4] = 0.8374;
        mcValues[1][0][5] = 0.1706;
        mcValues[1][1][0] = 15.9884;
        mcValues[1][1][1] = 11.4139;
        mcValues[1][1][2] = 7.3103;
        mcValues[1][1][3] = 4.0497;
        mcValues[1][1][4] = 1.8862;
        mcValues[1][1][5] = 0.7322;
        mcValues[2][0][0] = 15.6619;
        mcValues[2][0][1] = 11.1263;
        mcValues[2][0][2] = 7.0968;
        mcValues[2][0][3] = 3.9152;
        mcValues[2][0][4] = 1.8133;
        mcValues[2][0][5] = 0.7010;
        mcValues[2][1][0] = 16.5195;
        mcValues[2][1][1] = 12.3181;
        mcValues[2][1][2] = 8.6085;
        mcValues[2][1][3] = 5.5700;
        mcValues[2][1][4] = 3.3103;
        mcValues[2][1][5] = 1.8053;
        for (let k = 0; k < 3; ++k) {
            const lambda = Lambda[k];
            const m1 = beta +
                (alpha + gamma * new CumulativeNormalDistribution().f(lambda)) *
                    (1.0 + lambda * lambda) +
                gamma * lambda * Math.exp(-lambda * lambda / 2.0) /
                    Math.sqrt(2.0 * M_PI);
            const v0 = omega / (1.0 - m1);
            const q = new Handle(new SimpleQuote(s0));
            const process = new GJRGARCHProcess(riskFreeTS, dividendTS, q, v0, omega, alpha, beta, gamma, lambda, daysPerYear);
            const engine1 = new MakeMCEuropeanGJRGARCHEngine(new PseudoRandom())
                .mmcegeInit(process)
                .withStepsPerYear(20)
                .withAbsoluteTolerance(0.02)
                .withSeed(1234)
                .f();
            const engine2 = new AnalyticGJRGARCHEngine(new GJRGARCHModel(process));
            for (let i = 0; i < 2; ++i) {
                for (let j = 0; j < 6; ++j) {
                    const x = strike[j];
                    const payoff = new PlainVanillaPayoff(Option.Type.Call, x);
                    const exDate = DateExt.add(today, maturity[i]);
                    const exercise = new EuropeanExercise(exDate);
                    const option = new VanillaOption(payoff, exercise);
                    option.setPricingEngine(engine1);
                    const calculated = option.NPV();
                    option.setPricingEngine(engine2);
                    const expected = option.NPV();
                    const tolerance = 7.5e-2;
                    expect(Math.abs(expected - analytic[k][i][j]))
                        .toBeLessThan(2.0 * tolerance);
                    expect(Math.abs(calculated - mcValues[k][i][j]))
                        .toBeLessThan(2.0 * tolerance);
                }
            }
        }
    });
    it('Testing GJR-GARCH model calibration using DAX volatility data...', () => {
        const backup = new SavedSettings();
        const settlementDate = new Date('5-July-2002');
        Settings.evaluationDate.set(settlementDate);
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
        const dividendTS = new Handle(flatRate2(settlementDate, 0.0, dayCounter));
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
            3400, 3600, 3800, 4000, 4200, 4400, 4500, 4600, 4800, 5000, 5200, 5400,
            5600
        ];
        const options = [];
        for (let s = 3; s < 10; ++s) {
            for (let m = 0; m < 3; ++m) {
                const vol = new Handle(new SimpleQuote(v[s * 8 + m]));
                const maturity = new Period().init1(Math.floor((t[m] + 3) / 7.), TimeUnit.Weeks);
                options.push(new HestonModelHelper().hmhInit1(maturity, calendar, s0.currentLink().value(), strike[s], vol, riskFreeTS, dividendTS, BlackCalibrationHelper.CalibrationErrorType.ImpliedVolError));
            }
        }
        const omega = 2.0e-6;
        const alpha = 0.024;
        const beta = 0.93;
        const gamma = 0.059;
        const lambda = 0.1;
        const daysPerYear = 365.0;
        const m1 = beta +
            (alpha + gamma * new CumulativeNormalDistribution().f(lambda)) *
                (1.0 + lambda * lambda) +
            gamma * lambda * Math.exp(-lambda * lambda / 2.0) /
                Math.sqrt(2.0 * M_PI);
        const v0 = omega / (1.0 - m1);
        const process = new GJRGARCHProcess(riskFreeTS, dividendTS, s0, v0, omega, alpha, beta, gamma, lambda, daysPerYear);
        const model = new GJRGARCHModel(process);
        const engine = new AnalyticGJRGARCHEngine(model);
        for (i = 0; i < options.length; ++i) {
            options[i].setPricingEngine(engine);
        }
        const om = new Simplex(0.05);
        model.calibrate(options, om, new EndCriteria(400, 40, 1.0e-8, 1.0e-8, 1.0e-8));
        let sse = 0;
        for (i = 0; i < options.length; ++i) {
            const diff = options[i].calibrationError() * 100.0;
            sse += diff * diff;
        }
        const maxExpected = 15;
        expect(sse).toBeLessThan(maxExpected);
        backup.dispose();
    });
});