import { Actual360, AmericanExercise, AnalyticAmericanMargrabeEngine, AnalyticEuropeanMargrabeEngine, Array2D, BlackScholesMertonProcess, DateExt, EuropeanExercise, Handle, MargrabeOption, SavedSettings, Settings, SimpleQuote } from '/ql.mjs';
import { flatRate1, flatRate3, flatVol1, flatVol3, relativeError } from '/test-suite/utilities.mjs';

const first = 0;

class MargrabeOptionTwoData {
    constructor(s1, s2, Q1, Q2, q1, q2, r, t, v1, v2, rho, result, delta1, delta2, gamma1, gamma2, theta, rho_greek, tol) {
        this.s1 = s1;
        this.s2 = s2;
        this.Q1 = Q1;
        this.Q2 = Q2;
        this.q1 = q1;
        this.q2 = q2;
        this.r = r;
        this.t = t;
        this.v1 = v1;
        this.v2 = v2;
        this.rho = rho;
        this.result = result;
        this.delta1 = delta1;
        this.delta2 = delta2;
        this.gamma1 = gamma1;
        this.gamma2 = gamma2;
        this.theta = theta;
        this.rho_greek = rho_greek;
        this.tol = tol;
    }
}
class MargrabeAmericanOptionTwoData {
    constructor(s1, s2, Q1, Q2, q1, q2, r, t, v1, v2, rho, result, tol) {
        this.s1 = s1;
        this.s2 = s2;
        this.Q1 = Q1;
        this.Q2 = Q2;
        this.q1 = q1;
        this.q2 = q2;
        this.r = r;
        this.t = t;
        this.v1 = v1;
        this.v2 = v2;
        this.rho = rho;
        this.result = result;
        this.tol = tol;
    }
}

function timeToDays(t) {
    return Math.floor(t * 360 + 0.5);
}

describe('Exchange option tests', () => {
    it('Testing European one-asset-for-another option...', () => {
        const values = [
            new MargrabeOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.10, 0.20, 0.15, -0.50, 2.125, 0.841, -0.818, 0.112, 0.135, -2.043, 0.0, 1.0e-3),
            new MargrabeOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.10, 0.20, 0.20, -0.50, 2.199, 0.813, -0.784, 0.109, 0.132, -2.723, 0.0, 1.0e-3),
            new MargrabeOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.10, 0.20, 0.25, -0.50, 2.283, 0.788, -0.753, 0.105, 0.126, -3.419, 0.0, 1.0e-3),
            new MargrabeOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.10, 0.20, 0.15, 0.00, 2.045, 0.883, -0.870, 0.108, 0.131, -1.168, 0.0, 1.0e-3),
            new MargrabeOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.10, 0.20, 0.20, 0.00, 2.091, 0.857, -0.838, 0.112, 0.135, -1.698, 0.0, 1.0e-3),
            new MargrabeOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.10, 0.20, 0.25, 0.00, 2.152, 0.830, -0.805, 0.111, 0.134, -2.302, 0.0, 1.0e-3),
            new MargrabeOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.10, 0.20, 0.15, 0.50, 1.974, 0.946, -0.942, 0.079, 0.096, -0.126, 0.0, 1.0e-3),
            new MargrabeOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.10, 0.20, 0.20, 0.50, 1.989, 0.929, -0.922, 0.092, 0.111, -0.398, 0.0, 1.0e-3),
            new MargrabeOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.10, 0.20, 0.25, 0.50, 2.019, 0.902, -0.891, 0.104, 0.125, -0.838, 0.0, 1.0e-3),
            new MargrabeOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.50, 0.20, 0.15, -0.50, 2.762, 0.672, -0.602, 0.072, 0.087, -1.207, 0.0, 1.0e-3),
            new MargrabeOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.50, 0.20, 0.20, -0.50, 2.989, 0.661, -0.578, 0.064, 0.078, -1.457, 0.0, 1.0e-3),
            new MargrabeOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.50, 0.20, 0.25, -0.50, 3.228, 0.653, -0.557, 0.058, 0.070, -1.712, 0.0, 1.0e-3),
            new MargrabeOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.50, 0.20, 0.15, 0.00, 2.479, 0.695, -0.640, 0.085, 0.102, -0.874, 0.0, 1.0e-3),
            new MargrabeOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.50, 0.20, 0.20, 0.00, 2.650, 0.680, -0.616, 0.077, 0.093, -1.078, 0.0, 1.0e-3),
            new MargrabeOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.50, 0.20, 0.25, 0.00, 2.847, 0.668, -0.592, 0.069, 0.083, -1.302, 0.0, 1.0e-3),
            new MargrabeOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.50, 0.20, 0.15, 0.50, 2.138, 0.746, -0.713, 0.106, 0.128, -0.416, 0.0, 1.0e-3),
            new MargrabeOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.50, 0.20, 0.20, 0.50, 2.231, 0.728, -0.689, 0.099, 0.120, -0.550, 0.0, 1.0e-3),
            new MargrabeOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.50, 0.20, 0.25, 0.50, 2.374, 0.707, -0.659, 0.090, 0.109, -0.741, 0.0, 1.0e-3),
            new MargrabeOptionTwoData(22.0, 10.0, 1, 2, 0.06, 0.04, 0.10, 0.50, 0.20, 0.15, 0.50, 2.138, 0.746, -1.426, 0.106, 0.255, -0.987, 0.0, 1.0e-3),
            new MargrabeOptionTwoData(11.0, 20.0, 2, 1, 0.06, 0.04, 0.10, 0.50, 0.20, 0.20, 0.50, 2.231, 1.455, -0.689, 0.198, 0.120, 0.410, 0.0, 1.0e-3),
            new MargrabeOptionTwoData(11.0, 10.0, 2, 2, 0.06, 0.04, 0.10, 0.50, 0.20, 0.25, 0.50, 2.374, 1.413, -1.317, 0.181, 0.219, -0.336, 0.0, 1.0e-3)
        ];
        const dc = new Actual360();
        const today = Settings.evaluationDate.f();
        const spot1 = new SimpleQuote(0.0);
        const spot2 = new SimpleQuote(0.0);
        const qRate1 = new SimpleQuote(0.0);
        const qTS1 = flatRate1(today, qRate1, dc);
        const qRate2 = new SimpleQuote(0.0);
        const qTS2 = flatRate1(today, qRate2, dc);
        const rRate = new SimpleQuote(0.0);
        const rTS = flatRate1(today, rRate, dc);
        const vol1 = new SimpleQuote(0.0);
        const volTS1 = flatVol1(today, vol1, dc);
        const vol2 = new SimpleQuote(0.0);
        const volTS2 = flatVol1(today, vol2, dc);
        for (let i = 0; i < values.length; i++) {
            const exDate = DateExt.add(today, Math.floor(values[i].t * 360 + 0.5));
            const exercise = new EuropeanExercise(exDate);
            spot1.setValue(values[i].s1);
            spot2.setValue(values[i].s2);
            qRate1.setValue(values[i].q1);
            qRate2.setValue(values[i].q2);
            rRate.setValue(values[i].r);
            vol1.setValue(values[i].v1);
            vol2.setValue(values[i].v2);
            const stochProcess1 = new BlackScholesMertonProcess(new Handle(spot1), new Handle(qTS1), new Handle(rTS), new Handle(volTS1));
            const stochProcess2 = new BlackScholesMertonProcess(new Handle(spot2), new Handle(qTS2), new Handle(rTS), new Handle(volTS2));
            const procs = [];
            procs.push(stochProcess1);
            procs.push(stochProcess2);
            const correlationMatrix = Array2D.newMatrix(2, 2, values[i].rho);
            for (let j = 0; j < 2; j++) {
                correlationMatrix[j][j] = 1.0;
            }
            const engine = new AnalyticEuropeanMargrabeEngine(stochProcess1, stochProcess2, values[i].rho);
            const margrabeOption = new MargrabeOption(values[i].Q1, values[i].Q2, exercise);
            margrabeOption.setPricingEngine(engine);
            let calculated = margrabeOption.NPV();
            let expected = values[i].result;
            let error = Math.abs(calculated - expected);
            const tolerance = values[i].tol;
            expect(error).toBeLessThan(tolerance);
            calculated = margrabeOption.delta1();
            expected = values[i].delta1;
            error = Math.abs(calculated - expected);
            expect(error).toBeLessThan(tolerance);
            calculated = margrabeOption.delta2();
            expected = values[i].delta2;
            error = Math.abs(calculated - expected);
            expect(error).toBeLessThan(tolerance);
            calculated = margrabeOption.gamma1();
            expected = values[i].gamma1;
            error = Math.abs(calculated - expected);
            expect(error).toBeLessThan(tolerance);
            calculated = margrabeOption.gamma2();
            expected = values[i].gamma2;
            error = Math.abs(calculated - expected);
            expect(error).toBeLessThan(tolerance);
            calculated = margrabeOption.theta();
            expected = values[i].theta;
            error = Math.abs(calculated - expected);
            expect(error).toBeLessThan(tolerance);
            calculated = margrabeOption.rho();
            expected = values[i].rho_greek;
            error = Math.abs(calculated - expected);
            expect(error).toBeLessThan(tolerance);
        }
    });
    it('Testing analytic European exchange option greeks...', () => {
        const backup = new SavedSettings();
        const calculated = new Map(), expected = new Map(), tolerance = new Map();
        tolerance.set('delta1', 1.0e-5);
        tolerance.set('delta2', 1.0e-5);
        tolerance.set('gamma1', 1.0e-5);
        tolerance.set('gamma2', 1.0e-5);
        tolerance.set('theta', 1.0e-5);
        tolerance.set('rho', 1.0e-5);
        const underlyings1 = [22.0];
        const underlyings2 = [20.0];
        const qRates1 = [0.06, 0.16, 0.04];
        const qRates2 = [0.04, 0.14, 0.02];
        const rRates = [0.1, 0.2, 0.08];
        const residualTimes = [0.1, 0.5];
        const vols1 = [0.20];
        const vols2 = [0.15, 0.20, 0.25];
        const dc = new Actual360();
        const today = new Date();
        Settings.evaluationDate.set(today);
        const spot1 = new SimpleQuote(0.0);
        const spot2 = new SimpleQuote(0.0);
        const qRate1 = new SimpleQuote(0.0);
        const qTS1 = flatRate3(qRate1, dc);
        const qRate2 = new SimpleQuote(0.0);
        const qTS2 = flatRate3(qRate2, dc);
        const rRate = new SimpleQuote(0.0);
        const rTS = flatRate3(rRate, dc);
        const vol1 = new SimpleQuote(0.0);
        const volTS1 = flatVol3(vol1, dc);
        const vol2 = new SimpleQuote(0.0);
        const volTS2 = flatVol3(vol2, dc);
        for (let k = 0; k < residualTimes.length; k++) {
            const exDate = DateExt.add(today, timeToDays(residualTimes[k]));
            const exercise = new EuropeanExercise(exDate);
            const stochProcess1 = new BlackScholesMertonProcess(new Handle(spot1), new Handle(qTS1), new Handle(rTS), new Handle(volTS1));
            const stochProcess2 = new BlackScholesMertonProcess(new Handle(spot2), new Handle(qTS2), new Handle(rTS), new Handle(volTS2));
            const procs = [];
            procs.push(stochProcess1);
            procs.push(stochProcess2);
            const correlation = -0.5;
            const correlationMatrix = Array2D.newMatrix(2, 2, correlation);
            for (let j = 0; j < 2; j++) {
                correlationMatrix[j][j] = 1.0;
                const engine = new AnalyticEuropeanMargrabeEngine(stochProcess1, stochProcess2, correlation);
                const margrabeOption = new MargrabeOption(1, 1, exercise);
                margrabeOption.setPricingEngine(engine);
                for (let l = 0; l < underlyings1.length; l++) {
                    for (let m = 0; m < qRates1.length; m++) {
                        for (let n = 0; n < rRates.length; n++) {
                            for (let p = 0; p < vols1.length; p++) {
                                const u1 = underlyings1[l], u2 = underlyings2[l];
                                let u;
                                const q1 = qRates1[m], q2 = qRates2[m], r = rRates[n];
                                const v1 = vols1[p], v2 = vols2[p];
                                spot1.setValue(u1);
                                spot2.setValue(u2);
                                qRate1.setValue(q1);
                                qRate2.setValue(q2);
                                rRate.setValue(r);
                                vol1.setValue(v1);
                                vol2.setValue(v2);
                                const value = margrabeOption.NPV();
                                calculated.set('delta1', margrabeOption.delta1());
                                calculated.set('delta2', margrabeOption.delta2());
                                calculated.set('gamma1', margrabeOption.gamma1());
                                calculated.set('gamma2', margrabeOption.gamma2());
                                calculated.set('theta', margrabeOption.theta());
                                calculated.set('rho', margrabeOption.rho());
                                if (value > spot1.value() * 1.0e-5) {
                                    u = u1;
                                    const du = u * 1.0e-4;
                                    spot1.setValue(u + du);
                                    let value_p = margrabeOption.NPV(), delta_p = margrabeOption.delta1();
                                    spot1.setValue(u - du);
                                    let value_m = margrabeOption.NPV(), delta_m = margrabeOption.delta1();
                                    spot1.setValue(u);
                                    expected.set('delta1', (value_p - value_m) / (2 * du));
                                    expected.set('gamma1', (delta_p - delta_m) / (2 * du));
                                    u = u2;
                                    spot2.setValue(u + du);
                                    value_p = margrabeOption.NPV();
                                    delta_p = margrabeOption.delta2();
                                    spot2.setValue(u - du);
                                    value_m = margrabeOption.NPV();
                                    delta_m = margrabeOption.delta2();
                                    spot2.setValue(u);
                                    expected.set('delta2', (value_p - value_m) / (2 * du));
                                    expected.set('gamma2', (delta_p - delta_m) / (2 * du));
                                    const dr = r * 1.0e-4;
                                    rRate.setValue(r + dr);
                                    value_p = margrabeOption.NPV();
                                    rRate.setValue(r - dr);
                                    value_m = margrabeOption.NPV();
                                    rRate.setValue(r);
                                    expected.set('rho', (value_p - value_m) / (2 * dr));
                                    const dT = dc.yearFraction(DateExt.sub(today, 1), DateExt.add(today, 1));
                                    Settings.evaluationDate.set(DateExt.sub(today, 1));
                                    value_m = margrabeOption.NPV();
                                    Settings.evaluationDate.set(DateExt.add(today, 1));
                                    value_p = margrabeOption.NPV();
                                    Settings.evaluationDate.set(today);
                                    expected.set('theta', (value_p - value_m) / dT);
                                    let it;
                                    const calculatedArray = Array.from(calculated);
                                    for (it = 0; it < calculatedArray.length; ++it) {
                                        const greek = calculatedArray[it][first];
                                        const expct = expected.get(greek), calcl = calculated.get(greek), tol = tolerance.get(greek);
                                        const error = relativeError(expct, calcl, u1);
                                        expect(error).toBeLessThan(tol);
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
    it('Testing American one-asset-for-another option...', () => {
        const values = [
            new MargrabeAmericanOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.10, 0.20, 0.15, -0.50, 2.1357, 1.0e-3),
            new MargrabeAmericanOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.10, 0.20, 0.20, -0.50, 2.2074, 1.0e-3),
            new MargrabeAmericanOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.10, 0.20, 0.25, -0.50, 2.2902, 1.0e-3),
            new MargrabeAmericanOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.10, 0.20, 0.15, 0.00, 2.0592, 1.0e-3),
            new MargrabeAmericanOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.10, 0.20, 0.20, 0.00, 2.1032, 1.0e-3),
            new MargrabeAmericanOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.10, 0.20, 0.25, 0.00, 2.1618, 1.0e-3),
            new MargrabeAmericanOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.10, 0.20, 0.15, 0.50, 2.0001, 1.0e-3),
            new MargrabeAmericanOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.10, 0.20, 0.20, 0.50, 2.0110, 1.0e-3),
            new MargrabeAmericanOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.10, 0.20, 0.25, 0.50, 2.0359, 1.0e-3),
            new MargrabeAmericanOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.50, 0.20, 0.15, -0.50, 2.8051, 1.0e-3),
            new MargrabeAmericanOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.50, 0.20, 0.20, -0.50, 3.0288, 1.0e-3),
            new MargrabeAmericanOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.50, 0.20, 0.25, -0.50, 3.2664, 1.0e-3),
            new MargrabeAmericanOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.50, 0.20, 0.15, 0.00, 2.5282, 1.0e-3),
            new MargrabeAmericanOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.50, 0.20, 0.20, 0.00, 2.6945, 1.0e-3),
            new MargrabeAmericanOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.50, 0.20, 0.25, 0.00, 2.8893, 1.0e-3),
            new MargrabeAmericanOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.50, 0.20, 0.15, 0.50, 2.2053, 1.0e-3),
            new MargrabeAmericanOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.50, 0.20, 0.20, 0.50, 2.2906, 1.0e-3),
            new MargrabeAmericanOptionTwoData(22.0, 20.0, 1, 1, 0.06, 0.04, 0.10, 0.50, 0.20, 0.25, 0.50, 2.4261, 1.0e-3)
        ];
        const today = Settings.evaluationDate.f();
        const dc = new Actual360();
        const spot1 = new SimpleQuote(0.0);
        const spot2 = new SimpleQuote(0.0);
        const qRate1 = new SimpleQuote(0.0);
        const qTS1 = flatRate1(today, qRate1, dc);
        const qRate2 = new SimpleQuote(0.0);
        const qTS2 = flatRate1(today, qRate2, dc);
        const rRate = new SimpleQuote(0.0);
        const rTS = flatRate1(today, rRate, dc);
        const vol1 = new SimpleQuote(0.0);
        const volTS1 = flatVol1(today, vol1, dc);
        const vol2 = new SimpleQuote(0.0);
        const volTS2 = flatVol1(today, vol2, dc);
        for (let i = 0; i < values.length; i++) {
            const exDate = DateExt.add(today, Math.floor(values[i].t * 360 + 0.5));
            const exercise = new AmericanExercise().init1(today, exDate);
            spot1.setValue(values[i].s1);
            spot2.setValue(values[i].s2);
            qRate1.setValue(values[i].q1);
            qRate2.setValue(values[i].q2);
            rRate.setValue(values[i].r);
            vol1.setValue(values[i].v1);
            vol2.setValue(values[i].v2);
            const stochProcess1 = new BlackScholesMertonProcess(new Handle(spot1), new Handle(qTS1), new Handle(rTS), new Handle(volTS1));
            const stochProcess2 = new BlackScholesMertonProcess(new Handle(spot2), new Handle(qTS2), new Handle(rTS), new Handle(volTS2));
            const procs = [];
            procs.push(stochProcess1);
            procs.push(stochProcess2);
            const correlationMatrix = Array2D.newMatrix(2, 2, values[i].rho);
            for (let j = 0; j < 2; j++) {
                correlationMatrix[j][j] = 1.0;
            }
            const engine = new AnalyticAmericanMargrabeEngine(stochProcess1, stochProcess2, values[i].rho);
            const margrabeOption = new MargrabeOption(values[i].Q1, values[i].Q2, exercise);
            margrabeOption.setPricingEngine(engine);
            const calculated = margrabeOption.NPV();
            const expected = values[i].result;
            const error = Math.abs(calculated - expected);
            const tolerance = values[i].tol;
            expect(error).toBeLessThan(tolerance);
        }
    });
});