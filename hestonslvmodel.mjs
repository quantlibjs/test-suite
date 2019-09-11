import { ActualActual, AnalyticEuropeanEngine, Array1D, Comparison, CubicNaturalSpline, DateExt, DouglasScheme, EuropeanExercise, FdmBlackScholesFwdOp, FdmBlackScholesMesher, FdmMesherComposite, FdmSchemeDesc, GammaFunction, GaussLobattoIntegral, GeneralizedBlackScholesProcess, Handle, Option, PlainVanillaPayoff, Predefined1dMesher, QL_EPSILON, QL_NULL_REAL, SavedSettings, Settings, SimpleQuote, SquareRootProcessRNDCalculator, TimeUnit, VanillaOption, std } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql/ql.mjs';
import { flatRate4, flatVol4 } from '/test-suite/utilities.mjs';

function fokkerPlanckPrice1D(mesher, op, payoff, x0, maturity, tGrid) {
    const x = mesher.locations(0);
    const p = Array1D.fromSizeValue(x.length, 0.0);
    if (x.length <= 3 || x[1] > x0 || x[x.length - 2] < x0) {
        throw new Error('insufficient mesher');
    }
    const upperb = std.upper_bound(x, x0, (x1, x2) => x1 - x2);
    const lowerb = upperb - 1;
    if (Comparison.close_enough(x[upperb], x0)) {
        const idx = upperb;
        const dx = (x[idx + 1] - x[idx - 1]) / 2.0;
        p[idx] = 1.0 / dx;
    }
    else if (Comparison.close_enough(x[lowerb], x0)) {
        const idx = lowerb;
        const dx = (x[idx + 1] - x[idx - 1]) / 2.0;
        p[idx] = 1.0 / dx;
    }
    else {
        const dx = x[upperb] - x[lowerb];
        const lowerP = (x[upperb] - x0) / dx;
        const upperP = (x0 - x[lowerb]) / dx;
        const lowerIdx = lowerb;
        const upperIdx = upperb;
        const lowerDx = (x[lowerIdx + 1] - x[lowerIdx - 1]) / 2.0;
        const upperDx = (x[upperIdx + 1] - x[upperIdx - 1]) / 2.0;
        p[lowerIdx] = lowerP / lowerDx;
        p[upperIdx] = upperP / upperDx;
    }
    const evolver = new DouglasScheme(FdmSchemeDesc.Douglas().theta, op);
    const dt = maturity / tGrid;
    evolver.setStep(dt);
    for (let t = dt; t <= maturity + 20 * QL_EPSILON; t += dt) {
        evolver.step(p, t);
    }
    const payoffTimesDensity = new Array(x.length);
    for (let i = 0; i < x.length; ++i) {
        payoffTimesDensity[i] = payoff.f(Math.exp(x[i])) * p[i];
    }
    const f = new CubicNaturalSpline(x, 0, x.length, payoffTimesDensity, 0);
    f.enableExtrapolation();
    return new GaussLobattoIntegral(1000, 1e-6).f(f, x[0], x[x.length - 1]);
}

function stationaryLogProbabilityFct(kappa, theta, sigma, z) {
    const alpha = 2 * kappa * theta / (sigma * sigma);
    const beta = alpha / theta;
    return Math.pow(beta, alpha) * Math.exp(z * alpha) *
        Math.exp(-beta * Math.exp(z) - new GammaFunction().logValue(alpha));
}

function createStationaryDistributionMesher(kappa, theta, sigma, vGrid) {
    const qMin = 0.01;
    const qMax = 0.99;
    const dq = (qMax - qMin) / (vGrid - 1);
    const rnd = new SquareRootProcessRNDCalculator(theta, kappa, theta, sigma);
    const v = new Array(vGrid);
    for (let i = 0; i < vGrid; ++i) {
        v[i] = rnd.stationary_invcdf(qMin + i * dq);
    }
    return new FdmMesherComposite().cInit3(new Predefined1dMesher(v));
}

describe('Heston Stochastic Local Volatility tests', () => {
    it('Testing Fokker-Planck forward equation for BS process...', () => {
        const backup = new SavedSettings();
        const dc = new ActualActual();
        const todaysDate = new Date('28-Dec-2012');
        Settings.evaluationDate.set(todaysDate);
        const maturityDate = DateExt.advance(todaysDate, 2, TimeUnit.Years);
        const maturity = dc.yearFraction(todaysDate, maturityDate);
        const s0 = 100;
        const x0 = Math.log(s0);
        const r = 0.035;
        const q = 0.01;
        const v = 0.35;
        const xGrid = 2 * 100 + 1;
        const tGrid = 400;
        const spot = new Handle(new SimpleQuote(s0));
        const qTS = new Handle(flatRate4(q, dc));
        const rTS = new Handle(flatRate4(r, dc));
        const vTS = new Handle(flatVol4(v, dc));
        const process = new GeneralizedBlackScholesProcess().init1(spot, qTS, rTS, vTS);
        const engine = new AnalyticEuropeanEngine().init1(process);
        const uniformMesher = new FdmMesherComposite().cInit3(new FdmBlackScholesMesher(xGrid, process, maturity, s0));
        const uniformBSFwdOp = new FdmBlackScholesFwdOp(uniformMesher, process, s0, false);
        const concentratedMesher = new FdmMesherComposite().cInit3(new FdmBlackScholesMesher(xGrid, process, maturity, s0, QL_NULL_REAL, QL_NULL_REAL, 0.0001, 1.5, [s0, 0.1]));
        const concentratedBSFwdOp = new FdmBlackScholesFwdOp(concentratedMesher, process, s0, false);
        const shiftedMesher = new FdmMesherComposite().cInit3(new FdmBlackScholesMesher(xGrid, process, maturity, s0, QL_NULL_REAL, QL_NULL_REAL, 0.0001, 1.5, [s0 * 1.1, 0.2]));
        const shiftedBSFwdOp = new FdmBlackScholesFwdOp(shiftedMesher, process, s0, false);
        const exercise = new EuropeanExercise(maturityDate);
        const strikes = [50, 80, 100, 130, 150];
        for (let i = 0; i < strikes.length; ++i) {
            const payoff = new PlainVanillaPayoff(Option.Type.Call, strikes[i]);
            const option = new VanillaOption(payoff, exercise);
            option.setPricingEngine(engine);
            const expected = option.NPV() / rTS.currentLink().discount1(maturityDate);
            const calcUniform = fokkerPlanckPrice1D(uniformMesher, uniformBSFwdOp, payoff, x0, maturity, tGrid);
            const calcConcentrated = fokkerPlanckPrice1D(concentratedMesher, concentratedBSFwdOp, payoff, x0, maturity, tGrid);
            const calcShifted = fokkerPlanckPrice1D(shiftedMesher, shiftedBSFwdOp, payoff, x0, maturity, tGrid);
            const tol = 0.02;
            expect(Math.abs(expected - calcUniform)).toBeLessThan(tol);
            expect(Math.abs(expected - calcConcentrated)).toBeLessThan(tol);
            expect(Math.abs(expected - calcShifted)).toBeLessThan(tol);
        }
        backup.dispose();
    });
    it('Testing zero-flow BC for the square root process...', () => {
        const backup = new SavedSettings();
        const kappa = 1.0;
        const theta = 0.4;
        const sigma = 0.8;
        const v_0 = 0.1;
        const t = 1.0;
        const vmin = 0.0005;
        const h = 0.0001;
        const expected = [
            [0.000548, -0.000245, -0.005657, -0.001167, -0.000024],
            [-0.000595, -0.000701, -0.003296, -0.000883, -0.000691],
            [-0.001277, -0.001320, -0.003128, -0.001399, -0.001318],
            [-0.001979, -0.002002, -0.003425, -0.002047, -0.002001],
            [-0.002715, -0.002730, -0.003920, -0.002760, -0.002730]
        ];
        for (let i = 0; i < 5; ++i) {
            const v = vmin + i * 0.001;
            const vm2 = v - 2 * h;
            const vm1 = v - h;
            const v0 = v;
            const v1 = v + h;
            const v2 = v + 2 * h;
            const rndCalculator = new SquareRootProcessRNDCalculator(v_0, kappa, theta, sigma);
            const pm2 = rndCalculator.pdf(vm2, t);
            const pm1 = rndCalculator.pdf(vm1, t);
            const p0 = rndCalculator.pdf(v0, t);
            const p1 = rndCalculator.pdf(v1, t);
            const p2 = rndCalculator.pdf(v2, t);
            const flowSym2Order = sigma * sigma * v0 / (4 * h) * (p1 - pm1) +
                (kappa * (v0 - theta) + sigma * sigma / 2) * p0;
            const flowSym4Order = sigma * sigma * v0 / (24 * h) * (-p2 + 8 * p1 - 8 * pm1 + pm2) +
                (kappa * (v0 - theta) + sigma * sigma / 2) * p0;
            const fwd1Order = sigma * sigma * v0 / (2 * h) * (p1 - p0) +
                (kappa * (v0 - theta) + sigma * sigma / 2) * p0;
            const fwd2Order = sigma * sigma * v0 / (4 * h) * (4 * p1 - 3 * p0 - p2) +
                (kappa * (v0 - theta) + sigma * sigma / 2) * p0;
            const fwd3Order = sigma * sigma * v0 / (12 * h) * (-p2 + 6 * p1 - 3 * p0 - 2 * pm1) +
                (kappa * (v0 - theta) + sigma * sigma / 2) * p0;
            const tol = 0.000002;
            expect(Math.abs(expected[i][0] - flowSym2Order)).toBeLessThan(tol);
            expect(Math.abs(expected[i][1] - flowSym4Order)).toBeLessThan(tol);
            expect(Math.abs(expected[i][2] - fwd1Order)).toBeLessThan(tol);
            expect(Math.abs(expected[i][3] - fwd2Order)).toBeLessThan(tol);
            expect(Math.abs(expected[i][4] - fwd3Order)).toBeLessThan(tol);
        }
        backup.dispose();
    });
    it('Testing zero-flow BC for transformed Fokker-Planck forward equation...', () => {
    });
    it('Testing Fokker-Planck forward equation for ' +
        'the square root process with stationary density...', () => {
    });
    it('Testing Fokker-Planck forward equation for ' +
        'the square root log process with stationary density...', () => {
    });
    it('Testing Fokker-Planck forward equation for ' +
        'the square root process with Dirac start...', () => {
    });
    it('Testing Fokker-Planck forward equation for the Heston process...', () => {
    });
    it('Testing Fokker-Planck forward equation for the Heston process' +
        ' Log Transformation with leverage LV limiting case...', () => {
    });
    it('Testing Fokker-Planck forward equation for BS Local Vol process...', () => {
    });
    it('Testing local volatility vs SLV model...', () => {
    });
    it('Testing calibration via vanilla options...', () => {
    });
    it('Testing Barrier pricing with mixed models...', () => {
    });
    it('Testing Monte-Carlo vs FDM Pricing for Heston SLV models...', () => {
    });
    it('Testing Monte-Carlo Calibration...', () => {
    });
    it('Testing the implied volatility skew of ' +
        'forward starting options in SLV model...', () => {
    });
    it('Testing double no touch pricing with SLV and mixing...', () => {
    });
});