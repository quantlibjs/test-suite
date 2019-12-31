/**
 * Copyright 2019 - 2020 Jin Yang. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import { ArrayExt, ActualActual, Array1D, Array2D, AverageBasketPayoff, BasketOption, BermudanExercise, constant, DateExt, DynProgVPPIntrinsicValueEngine, EuropeanExercise, ExponentialJump1dMesher, ExtendedOrnsteinUhlenbeckProcess, ExtOUWithJumpsProcess, FdKlugeExtOUSpreadEngine, FdmInnerValueCalculator, FdmKlugeExtOUOp, FdmMesherComposite, FdmSimpleProcess1dMesher, FdmVPPStepConditionFactory, FdmVPPStepConditionMesher, FdSimpleExtOUStorageEngine, FdSimpleKlugeExtOUVPPEngine, GemanRoncoroniProcess, GeneralLinearLeastSquares, GeneralStatistics, KlugeExtOUProcess, LsmBasisSystem, MersenneTwisterUniformRng, MultiPathGenerator, Option, PlainVanillaPayoff, PseudoRandom, QL_EPSILON, SavedSettings, Settings, StochasticProcessArray, SwingExercise, TimeGrid, TimeUnit, VanillaStorageOption, VanillaVPPOption, first, second, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate2, flatRate4 } from '/test-suite/utilities.mjs';

function createKlugeProcess() {
    const x0 = new Array(2);
    x0[0] = 3.0;
    x0[1] = 0.0;
    const beta = 5.0;
    const eta = 2.0;
    const jumpIntensity = 1.0;
    const speed = 1.0;
    const volatility = 2.0;
    const ouProcess = new ExtendedOrnsteinUhlenbeckProcess(speed, volatility, x0[0], new constant(x0[0]));
    return new ExtOUWithJumpsProcess(ouProcess, x0[1], beta, jumpIntensity, eta);
}

class linear {
    constructor(alpha, beta) {
        this.alpha = alpha;
        this.beta = beta;
    }
    f(x) {
        return this.alpha + this.beta * x;
    }
}

const fuelPrices = [
    20.74, 21.65, 20.78, 21.58, 21.43, 20.82, 22.02, 21.52, 21.02, 21.46, 21.75,
    20.69, 22.16, 20.38, 20.82, 20.68, 20.57, 21.92, 22.04, 20.45, 20.75, 21.92,
    20.53, 20.67, 20.88, 21.02, 20.82, 21.67, 21.82, 22.12, 20.45, 20.74, 22.39,
    20.95, 21.71, 20.70, 20.94, 21.59, 22.33, 21.13, 21.50, 21.42, 20.56, 21.23,
    21.37, 21.90, 20.62, 21.17, 21.86, 22.04, 22.05, 21.00, 20.70, 21.12, 21.26,
    22.40, 21.31, 22.24, 21.96, 21.02, 21.71, 20.48, 21.36, 21.75, 21.90, 20.44,
    21.26, 22.29, 20.34, 21.79, 21.66, 21.50, 20.76, 20.27, 20.84, 20.24, 21.97,
    20.52, 20.98, 21.40, 20.39, 20.71, 20.78, 20.30, 21.56, 21.72, 20.27, 21.57,
    21.82, 20.57, 21.33, 20.51, 22.32, 21.99, 20.57, 22.11, 21.56, 22.24, 20.62,
    21.70, 21.11, 21.19, 21.79, 20.46, 22.21, 20.82, 20.52, 22.29, 20.71, 21.45,
    22.40, 20.63, 20.95, 21.97, 22.20, 20.67, 21.01, 22.25, 20.76, 21.33, 20.49,
    20.33, 21.94, 20.64, 20.99, 21.09, 20.97, 22.17, 20.72, 22.06, 20.86, 21.40,
    21.75, 20.78, 21.79, 20.47, 21.19, 21.60, 20.75, 21.36, 21.61, 20.37, 21.67,
    20.28, 22.33, 21.37, 21.33, 20.87, 21.25, 22.01, 22.08, 20.81, 20.70, 21.84,
    21.82, 21.68, 21.24, 22.36, 20.83, 20.64, 21.03, 20.57, 22.34, 20.96, 21.54,
    21.26, 21.43, 22.39
];

const powerPrices = [
    40.40, 36.71, 31.87, 25.81, 31.61, 35.00, 46.22, 60.68, 42.45, 38.01, 33.84,
    29.79, 31.84, 38.53, 49.23, 59.92, 43.85, 37.47, 34.89, 29.99, 30.85, 29.19,
    29.25, 38.67, 36.90, 25.93, 22.12, 20.19, 17.19, 19.29, 13.51, 18.14, 33.76,
    30.48, 25.63, 18.01, 23.86, 32.41, 48.56, 64.69, 38.42, 39.31, 32.73, 29.97,
    31.41, 35.02, 46.85, 58.12, 39.14, 35.42, 32.61, 28.76, 29.41, 35.83, 46.73,
    61.41, 61.01, 59.43, 60.43, 66.29, 62.79, 62.66, 57.66, 51.63, 62.18, 60.53,
    61.94, 64.86, 59.57, 58.15, 53.74, 48.36, 45.64, 51.21, 51.54, 50.79, 54.50,
    49.92, 41.58, 39.81, 28.86, 37.42, 39.78, 42.36, 45.67, 36.84, 33.91, 28.75,
    62.97, 63.84, 62.91, 68.77, 64.33, 61.95, 59.12, 54.89, 63.62, 60.90, 66.57,
    69.51, 64.71, 59.89, 57.28, 57.10, 65.09, 63.82, 67.52, 70.51, 65.59, 59.36,
    58.22, 54.64, 52.17, 53.02, 57.12, 53.50, 53.16, 49.21, 52.21, 40.96, 49.01,
    47.94, 49.89, 53.83, 52.96, 50.33, 51.72, 46.99, 39.06, 47.99, 47.91, 52.35,
    48.51, 47.39, 50.45, 43.66, 25.62, 35.76, 42.76, 46.51, 45.62, 46.79, 48.76,
    41.00, 52.65, 55.57, 57.67, 56.79, 55.15, 54.74, 50.31, 47.49, 53.72, 55.62,
    55.89, 58.11, 54.46, 52.92, 49.61, 44.68, 51.59, 57.44, 56.50, 55.12, 57.22,
    54.61, 49.92, 45.20
];

class PathFuelPrice extends FdmInnerValueCalculator {
    constructor(path, shape) {
        super();
        this._path = path;
        this._shape = shape;
    }
    innerValue(iter, t) {
        if (t - Math.sqrt(QL_EPSILON) > Array1D.back(this._shape)[first]) {
            throw new Error('invalid time');
        }
        const i = Math.floor(t * 365 * 24);
        const it = ArrayExt.lowerBound(this._shape.map(s => s[first]), t - Math.sqrt(QL_EPSILON), (t1, t2) => t1 - t2);
        const index = this._shape.map(s => s[first]).indexOf(it);
        const f = this._shape[index][second];
        return Math.exp(this._path.at(2).at(i) + f);
    }
    avgInnerValue(iter, t) {
        return this.innerValue(iter, t);
    }
}

class PathSparkSpreadPrice extends FdmInnerValueCalculator {
    constructor(heatRate, path, fuelShape, powerShape) {
        super();
        this._heatRate = heatRate;
        this._path = path;
        this._fuelShape = fuelShape;
        this._powerShape = powerShape;
    }
    innerValue(iter, t) {
        if (t - Math.sqrt(QL_EPSILON) > Array1D.back(this._powerShape)[first]) {
            throw new Error('invalid time');
        }
        const i = Math.floor(t * 365 * 24);
        const it1 = ArrayExt.lowerBound(this._powerShape.map(s => s[first]), t - Math.sqrt(QL_EPSILON), (t1, t2) => t1 - t2);
        const index1 = this._powerShape.map(s => s[first]).indexOf(it1);
        const f = this._powerShape[index1][second];
        const it2 = ArrayExt.lowerBound(this._fuelShape.map(s => s[first]), t - Math.sqrt(QL_EPSILON), (t1, t2) => t1 - t2);
        const index2 = this._fuelShape.map(s => s[first]).indexOf(it2);
        const g = this._fuelShape[index2][second];
        return Math.exp(f + this._path.at(0).at(i) + this._path.at(1).at(i)) -
            this._heatRate * Math.exp(g + this._path.at(2).at(i));
    }
    avgInnerValue(iter, t) {
        return this.innerValue(iter, t);
    }
}

function createKlugeExtOUProcess() {
    const beta = 200;
    const eta = 1.0 / 0.2;
    const lambda = 4.0;
    const alpha = 7.0;
    const volatility_x = 1.4;
    const kappa = 4.45;
    const volatility_u = Math.sqrt(1.3);
    const rho = 0.7;
    const x0 = new Array(2);
    x0[0] = 0.0;
    x0[1] = 0.0;
    const ouProcess = new ExtendedOrnsteinUhlenbeckProcess(alpha, volatility_x, x0[0], new constant(x0[0]));
    const lnPowerProcess = new ExtOUWithJumpsProcess(ouProcess, x0[1], beta, lambda, eta);
    const u = 0.0;
    const lnGasProcess = new ExtendedOrnsteinUhlenbeckProcess(kappa, volatility_u, u, new constant(u));
    const klugeOUProcess = new KlugeExtOUProcess(rho, lnPowerProcess, lnGasProcess);
    return klugeOUProcess;
}

describe(`VPP tests ${version}`, () => {
    it('Testing Geman-Roncoroni process...', () => {
        const backup = new SavedSettings();
        const today = DateExt.UTC('18,December,2011');
        Settings.evaluationDate.set(today);
        const dc = new ActualActual();
        const rTS = flatRate2(today, 0.03, dc);
        const x0 = 3.3;
        const beta = 0.05;
        const alpha = 3.1;
        const gamma = -0.09;
        const delta = 0.07;
        const eps = -0.40;
        const zeta = -0.40;
        const d = 1.6;
        const k = 1.0;
        const tau = 0.5;
        const sig2 = 10.0;
        const a = -7.0;
        const b = -0.3;
        const theta1 = 35.0;
        const theta2 = 9.0;
        const theta3 = 0.10;
        const psi = 1.9;
        const grProcess = new GemanRoncoroniProcess(x0, alpha, beta, gamma, delta, eps, zeta, d, k, tau, sig2, a, b, theta1, theta2, theta3, psi);
        const speed = 5.0;
        const vol = Math.sqrt(1.4);
        const betaG = 0.08;
        const alphaG = 1.0;
        const x0G = 1.1;
        const f = new linear(alphaG, betaG);
        const eouProcess = new ExtendedOrnsteinUhlenbeckProcess(speed, vol, x0G, f, ExtendedOrnsteinUhlenbeckProcess.Discretization.Trapezodial);
        const processes = [];
        processes.push(grProcess);
        processes.push(eouProcess);
        const correlation = Array2D.newMatrix(2, 2, 1.0);
        correlation[0][1] = correlation[1][0] = 0.25;
        const pArray = new StochasticProcessArray(processes, correlation);
        const T = 10.0;
        const stepsPerYear = 250;
        const steps = Math.floor(T * stepsPerYear);
        const grid = new TimeGrid().init1(T, steps);
        const rsg = new PseudoRandom().make_sequence_generator(pArray.size() * (grid.size() - 1), 421);
        const npv = new GeneralStatistics(), onTime = new GeneralStatistics();
        const generator = new MultiPathGenerator(pArray, grid, rsg, false);
        const heatRate = 8.0;
        const nrTrails = 250;
        for (let n = 0; n < nrTrails; ++n) {
            let plantValue = 0.0;
            const path = generator.next();
            for (let i = 1; i <= steps; ++i) {
                const t = i / stepsPerYear;
                const df = rTS.discount2(t);
                const fuelPrice = Math.exp(path.value.at(1).at(i));
                const electricityPrice = Math.exp(path.value.at(0).at(i));
                const sparkSpread = electricityPrice - heatRate * fuelPrice;
                plantValue += Math.max(0.0, sparkSpread) * df;
                onTime.add((sparkSpread > 0.0) ? 1.0 : 0.0);
            }
            npv.add(plantValue);
        }
        const expectedNPV = 12500;
        const calculatedNPV = npv.mean();
        const errorEstimateNPV = npv.errorEstimate();
        expect(Math.abs(calculatedNPV - expectedNPV))
            .toBeLessThan(3.0 * errorEstimateNPV);
        const expectedOnTime = 0.43;
        const calculatedOnTime = onTime.mean();
        const errorEstimateOnTime = Math.sqrt(calculatedOnTime * (1 - calculatedOnTime)) / nrTrails;
        expect(Math.abs(calculatedOnTime - expectedOnTime))
            .toBeLessThan(3.0 * errorEstimateOnTime);
        backup.dispose();
    });

    it('Testing simple-storage option based on ext. OU model...', () => {
        const backup = new SavedSettings();
        const settlementDate = DateExt.UTC('18,December,2011');
        Settings.evaluationDate.set(settlementDate);
        const dayCounter = new ActualActual();
        const maturityDate = DateExt.advance(settlementDate, 12, TimeUnit.Months);
        const exerciseDates = [DateExt.advance(settlementDate, 1, TimeUnit.Days)];
        while (Array1D.back(exerciseDates).valueOf() < maturityDate.valueOf()) {
            exerciseDates.push(DateExt.advance(Array1D.back(exerciseDates), 1, TimeUnit.Days));
        }
        const bermudanExercise = new BermudanExercise().beInit(exerciseDates);
        const x0 = 3.0;
        const speed = 1.0;
        const volatility = 0.5;
        const irRate = 0.1;
        const ouProcess = new ExtendedOrnsteinUhlenbeckProcess(speed, volatility, x0, new constant(x0));
        const rTS = flatRate2(settlementDate, irRate, dayCounter);
        const storageEngine = new FdSimpleExtOUStorageEngine(ouProcess, rTS, 1, 25);
        const storageOption = new VanillaStorageOption(bermudanExercise, 50, 0, 1);
        storageOption.setPricingEngine(storageEngine);
        const expected = 69.5755;
        const calculated = storageOption.NPV();
        expect(Math.abs(expected - calculated)).toBeLessThan(5e-2);
        backup.dispose();
    });

    it('Testing simple Kluge ext-Ornstein-Uhlenbeck spread option...', () => {
        const backup = new SavedSettings();
        const settlementDate = DateExt.UTC('18,December,2011');
        Settings.evaluationDate.set(settlementDate);
        const dayCounter = new ActualActual();
        const maturityDate = DateExt.advance(settlementDate, 1, TimeUnit.Years);
        const maturity = dayCounter.yearFraction(settlementDate, maturityDate);
        const speed = 1.0;
        const vol = Math.sqrt(1.4);
        const betaG = 0.0;
        const alphaG = 3.0;
        const x0G = 3.0;
        const irRate = 0.0;
        const heatRate = 2.0;
        const rho = 0.5;
        const klugeProcess = createKlugeProcess();
        const f = new linear(alphaG, betaG);
        const extOUProcess = new ExtendedOrnsteinUhlenbeckProcess(speed, vol, x0G, f, ExtendedOrnsteinUhlenbeckProcess.Discretization.Trapezodial);
        const rTS = flatRate2(settlementDate, irRate, dayCounter);
        const klugeOUProcess = new KlugeExtOUProcess(rho, klugeProcess, extOUProcess);
        const payoff = new PlainVanillaPayoff(Option.Type.Call, 0.0);
        const spreadFactors = new Array(2);
        spreadFactors[0] = 1.0;
        spreadFactors[1] = -heatRate;
        const basketPayoff = new AverageBasketPayoff().abpInit1(payoff, spreadFactors);
        const exercise = new EuropeanExercise(maturityDate);
        const option = new BasketOption(basketPayoff, exercise);
        option.setPricingEngine(new FdKlugeExtOUSpreadEngine(klugeOUProcess, rTS, 5, 200, 50, 20));
        const grid = new TimeGrid().init1(maturity, 50);
        const rsg = new PseudoRandom().make_sequence_generator(klugeOUProcess.factors() * (grid.size() - 1), 1234);
        const generator = new MultiPathGenerator(klugeOUProcess, grid, rsg, false);
        const npv = new GeneralStatistics();
        const nTrails = 20000;
        for (let i = 0; i < nTrails; ++i) {
            const path = generator.next();
            const p = new Array(2);
            p[0] = path.value.at(0).back + path.value.at(1).back;
            p[1] = path.value.at(2).back;
            npv.add(basketPayoff.f1(Array1D.Exp(p)));
        }
        const calculated = option.NPV();
        const expectedMC = npv.mean();
        const mcError = npv.errorEstimate();
        expect(Math.abs(expectedMC - calculated)).toBeLessThan(3 * mcError);
        backup.dispose();
    });

    it('Testing VPP step condition...', () => {
        const backup = new SavedSettings();
        const today = DateExt.UTC('18,December,2011');
        const dc = new ActualActual();
        Settings.evaluationDate.set(today);
        const pMin = 8;
        const pMax = 40;
        const tMinUp = 2;
        const tMinDown = 2;
        const startUpFuel = 20;
        const startUpFixCost = 100;
        const fuelCostAddon = 3.0;
        const exercise = new SwingExercise().seInit2(today, DateExt.add(today, 6), 3600);
        const efficiency = [0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.9];
        const expected = [
            0.0, 2056.04, 11145.577778, 26452.04, 44512.461818, 62000.626667,
            137591.911111
        ];
        for (let i = 0; i < efficiency.length; ++i) {
            const heatRate = 1.0 / efficiency[i];
            const option = new VanillaVPPOption(heatRate, pMin, pMax, tMinUp, tMinDown, startUpFuel, startUpFixCost, exercise);
            option.setPricingEngine(new DynProgVPPIntrinsicValueEngine(fuelPrices, powerPrices, fuelCostAddon, flatRate4(0.0, dc)));
            const calculated = option.NPV();
            expect(Math.abs(expected[i] - calculated)).toBeLessThan(1e-4);
            backup.dispose();
        }
    });

    it('Testing VPP pricing using perfect foresight or FDM...', () => {
        const backup = new SavedSettings();
        const today = DateExt.UTC('18,December,2011');
        const dc = new ActualActual();
        Settings.evaluationDate.set(today);
        const heatRate = 2.5;
        const pMin = 8;
        const pMax = 40;
        const tMinUp = 6;
        const tMinDown = 2;
        const startUpFuel = 20;
        const startUpFixCost = 100;
        const exercise = new SwingExercise().seInit2(today, DateExt.add(today, 6), 3600);
        const vppOption = new VanillaVPPOption(heatRate, pMin, pMax, tMinUp, tMinDown, startUpFuel, startUpFixCost, exercise);
        const klugeOUProcess = createKlugeExtOUProcess();
        const lnPowerProcess = klugeOUProcess.getKlugeProcess();
        const ouProcess = lnPowerProcess.getExtendedOrnsteinUhlenbeckProcess();
        const lnGasProcess = klugeOUProcess.getExtOUProcess();
        const beta = lnPowerProcess.beta();
        const eta = lnPowerProcess.eta();
        const lambda = lnPowerProcess.jumpIntensity();
        const alpha = ouProcess.speed();
        const volatility_x = ouProcess.volatility();
        const kappa = lnGasProcess.speed();
        const volatility_u = lnGasProcess.volatility();
        const irRate = 0.00;
        const fuelCostAddon = 3.0;
        const rTS = flatRate2(today, irRate, dc);
        const nHours = powerPrices.length;
        const fuelShape = new Array(nHours);
        const powerShape = new Array(nHours);
        for (let i = 0; i < nHours; ++i) {
            const t = (i + 1) / (365 * 24.);
            const fuelPrice = fuelPrices[i];
            const gs = Math.log(fuelPrice) -
                (volatility_u * volatility_u) / (4 * kappa) *
                    (1 - Math.exp(-2 * kappa * t));
            fuelShape[i] = [t, gs];
            const powerPrice = powerPrices[i];
            const ps = Math.log(powerPrice) -
                (volatility_x * volatility_x) / (4 * alpha) *
                    (1 - Math.exp(-2 * alpha * t)) -
                lambda / beta * Math.log((eta - Math.exp(-beta * t)) / (eta - 1.0));
            powerShape[i] = [t, ps];
        }
        vppOption.setPricingEngine(new DynProgVPPIntrinsicValueEngine(fuelPrices, powerPrices, fuelCostAddon, flatRate4(0.0, dc)));
        const intrinsic = vppOption.NPV();
        const expectedIntrinsic = 2056.04;
        expect(Math.abs(intrinsic - expectedIntrinsic)).toBeLessThan(0.1);
        const engine = new FdSimpleKlugeExtOUVPPEngine(klugeOUProcess, rTS, fuelShape, powerShape, fuelCostAddon, 1, 25, 11, 10);
        vppOption.setPricingEngine(engine);
        const fdmPrice = vppOption.NPV();
        const expectedFdmPrice = 5217.68;
        expect(Math.abs(fdmPrice - expectedFdmPrice)).toBeLessThan(0.1);
        const args = new VanillaVPPOption.Arguments();
        vppOption.setupArguments(args);
        const stepConditionFactory = new FdmVPPStepConditionFactory(args);
        const oneDimMesher = new FdmMesherComposite().cInit3(stepConditionFactory.stateMesher());
        const nStates = oneDimMesher.layout().dim()[0];
        const vppMesh = new FdmVPPStepConditionMesher(0, oneDimMesher);
        const grid = new TimeGrid().init1(dc.yearFraction(today, DateExt.add(exercise.lastDate(), 1)), exercise.dates().length);
        const rsg = new PseudoRandom().make_sequence_generator(klugeOUProcess.factors() * (grid.size() - 1), 1234);
        const generator = new MultiPathGenerator(klugeOUProcess, grid, rsg, false);
        const npv = new GeneralStatistics();
        const nTrails = 2500;
        for (let i = 0; i < nTrails; ++i) {
            const path = generator.next();
            const stepCondition = stepConditionFactory.build(vppMesh, fuelCostAddon, new PathFuelPrice(path.value, fuelShape), new PathSparkSpreadPrice(heatRate, path.value, fuelShape, powerShape));
            let state = Array1D.fromSizeValue(nStates, 0.0);
            for (let j = exercise.dates().length; j > 0; --j) {
                stepCondition.applyTo(state, grid.at(j));
                state = Array1D.mulScalar(state, rTS.discount2(grid.at(j)) / rTS.discount2(grid.at(j - 1)));
            }
            npv.add(Array1D.back(state));
        }
        let npvMC = npv.mean();
        let errorMC = npv.errorEstimate();
        const expectedMC = 5250.0;
        expect(Math.abs(npvMC - expectedMC)).toBeLessThan(3 * errorMC);
        npv.reset();
        const nCalibrationTrails = 1000;
        const calibrationPaths = [];
        const stepConditions = [];
        const sparkSpreads = [];
        for (let i = 0; i < nCalibrationTrails; ++i) {
            calibrationPaths.push(generator.next());
            sparkSpreads.push(new PathSparkSpreadPrice(heatRate, Array1D.back(calibrationPaths).value, fuelShape, powerShape));
            stepConditions.push(stepConditionFactory.build(vppMesh, fuelCostAddon, new PathFuelPrice(Array1D.back(calibrationPaths).value, fuelShape), Array1D.back(sparkSpreads)));
        }
        const iter = oneDimMesher.layout().begin();
        const prices = new Array(nCalibrationTrails);
        for (let i = 0; i < nCalibrationTrails; ++i) {
            prices[i] = Array1D.fromSizeValue(nStates, 0.0);
        }
        const coeff = new Array(nStates);
        for (let i = 0; i < nStates; ++i) {
            coeff[i] = new Array(exercise.dates().length);
            for (let j = 0; j < coeff[i].length; ++j) {
                coeff[i][j] = [];
            }
        }
        const dim = 1;
        const v = LsmBasisSystem.multiPathBasisSystem(dim, 5, LsmBasisSystem.PolynomType.Monomial);
        for (let i = exercise.dates().length; i > 0; --i) {
            const t = grid.at(i);
            const x = new Array(nCalibrationTrails);
            for (let i = 0; i < x.length; ++i) {
                x[i] = new Array(dim);
            }
            for (let j = 0; j < nCalibrationTrails; ++j) {
                x[j][0] = sparkSpreads[j].innerValue(iter, t);
            }
            for (let k = 0; k < nStates; ++k) {
                const y = new Array(nCalibrationTrails);
                for (let j = 0; j < nCalibrationTrails; ++j) {
                    y[j] = prices[j][k];
                }
                coeff[k][i - 1] =
                    new GeneralLinearLeastSquares().init(x, y, v).coefficients();
                for (let j = 0; j < nCalibrationTrails; ++j) {
                    prices[j][k] = 0.0;
                    for (let l = 0; l < v.length; ++l) {
                        prices[j][k] += coeff[k][i - 1][l] * v[l].f(x[j]);
                    }
                }
            }
            for (let j = 0; j < nCalibrationTrails; ++j) {
                stepConditions[j].applyTo(prices[j], grid.at(i));
            }
        }
        let tmpValue = 0.0;
        for (let i = 0; i < nTrails; ++i) {
            const x = new Array(dim);
            let state = Array1D.fromSizeValue(nStates, 0.0);
            const contState = Array1D.fromSizeValue(nStates, 0.0);
            const path = (i % 2) ? generator.antithetic() : generator.next();
            const fuelPrices = new PathFuelPrice(path.value, fuelShape);
            const sparkSpreads = new PathSparkSpreadPrice(heatRate, path.value, fuelShape, powerShape);
            for (let j = exercise.dates().length; j > 0; --j) {
                const t = grid.at(j);
                const fuelPrice = fuelPrices.innerValue(iter, t);
                const sparkSpread = sparkSpreads.innerValue(iter, t);
                const startUpCost = startUpFixCost + (fuelPrice + fuelCostAddon) * startUpFuel;
                x[0] = sparkSpread;
                for (let k = 0; k < nStates; ++k) {
                    contState[k] = 0.0;
                    for (let l = 0; l < v.length; ++l) {
                        contState[k] += coeff[k][j - 1][l] * v[l].f(x);
                    }
                }
                const pMinFlow = pMin * (sparkSpread - heatRate * fuelCostAddon);
                const pMaxFlow = pMax * (sparkSpread - heatRate * fuelCostAddon);
                for (let i = 0; i < 2 * tMinUp; ++i) {
                    if (i < tMinUp) {
                        state[i] += pMinFlow;
                        contState[i] += pMinFlow;
                    }
                    else {
                        state[i] += pMaxFlow;
                        contState[i] += pMaxFlow;
                    }
                }
                const retVal = new Array(nStates);
                for (let i = 0; i < tMinUp - 1; ++i) {
                    retVal[i] = retVal[tMinUp + i] =
                        (contState[i + 1] > contState[tMinUp + i + 1]) ?
                            state[i + 1] :
                            state[tMinUp + i + 1];
                }
                if (contState[2 * tMinUp] >=
                    Math.max(contState[tMinUp - 1], contState[2 * tMinUp - 1])) {
                    retVal[tMinUp - 1] = retVal[2 * tMinUp - 1] = state[2 * tMinUp];
                }
                else if (contState[tMinUp - 1] >= contState[2 * tMinUp - 1]) {
                    retVal[tMinUp - 1] = retVal[2 * tMinUp - 1] = state[tMinUp - 1];
                }
                else {
                    retVal[tMinUp - 1] = retVal[2 * tMinUp - 1] = state[2 * tMinUp - 1];
                }
                for (let i = 0; i < tMinDown - 1; ++i) {
                    retVal[2 * tMinUp + i] = state[2 * tMinUp + i + 1];
                }
                if (Array1D.back(contState) >=
                    Math.max(contState[0], contState[tMinUp]) - startUpCost) {
                    retVal[retVal.length - 1] = Array1D.back(state);
                }
                else if (contState[0] > contState[tMinUp]) {
                    retVal[retVal.length - 1] = state[0] - startUpCost;
                }
                else {
                    retVal[retVal.length - 1] = state[tMinUp] - startUpCost;
                }
                state = retVal;
            }
            tmpValue += 0.5 * Array1D.back(state);
            if ((i % 2)) {
                npv.add(tmpValue, 1.0);
                tmpValue = 0.0;
            }
        }
        npvMC = npv.mean();
        errorMC = npv.errorEstimate();
        expect(Math.abs(npvMC - fdmPrice)).toBeLessThan(3 * errorMC);
        backup.dispose();
    });

    it('Testing KlugeExtOU matrix decomposition...', () => {
        const backup = new SavedSettings();
        const today = DateExt.UTC('18,December,2011');
        Settings.evaluationDate.set(today);
        const klugeOUProcess = createKlugeExtOUProcess();
        const xGrid = 50;
        const yGrid = 20;
        const uGrid = 20;
        const maturity = 1;
        const klugeProcess = klugeOUProcess.getKlugeProcess();
        const ouProcess = klugeProcess.getExtendedOrnsteinUhlenbeckProcess();
        const mesher = new FdmMesherComposite().cInit5(new FdmSimpleProcess1dMesher(xGrid, ouProcess, maturity), new ExponentialJump1dMesher(yGrid, klugeProcess.beta(), klugeProcess.jumpIntensity(), klugeProcess.eta()), new FdmSimpleProcess1dMesher(uGrid, klugeOUProcess.getExtOUProcess(), maturity));
        const op = new FdmKlugeExtOUOp(mesher, klugeOUProcess, flatRate2(today, 0.0, new ActualActual()), [], 16);
        op.setTime(0.1, 0.2);
        const x = new Array(mesher.layout().size());
        const rng = new MersenneTwisterUniformRng().init1(12345);
        for (let i = 0; i < x.length; ++i) {
            x[i] = rng.next().value;
        }
        const tol = 1e-9;
        const applyExpected = op.apply(x);
        const applyExpectedMixed = op.apply_mixed(x);
        const matrixDecomp = op.toMatrixDecomp();
        const applyCalculated = op.toMatrix().mulVector(x);
        const applyCalculatedMixed = Array1D.back(matrixDecomp).mulVector(x);
        for (let i = 0; i < x.length; ++i) {
            const diffApply = Math.abs(applyExpected[i] - applyCalculated[i]);
            expect(diffApply).toBeLessThan(tol);
            expect(diffApply).toBeLessThan(Math.abs(applyExpected[i]) * tol);
            const diffMixed = Math.abs(applyExpectedMixed[i] - applyCalculatedMixed[i]);
            expect(diffMixed).toBeLessThan(tol);
            expect(diffMixed).toBeLessThan(Math.abs(applyExpected[i]) * tol);
        }
        for (let i = 0; i < 3; ++i) {
            const applyExpectedDir = op.apply_direction(i, x);
            const applyCalculatedDir = matrixDecomp[i].mulVector(x);
            for (let j = 0; j < x.length; ++j) {
                const diff = Math.abs((applyExpectedDir[j] - applyCalculatedDir[j]));
                expect(diff).toBeLessThan(tol);
                expect(diff).toBeLessThan(Math.abs(applyExpectedDir[j] * tol));
            }
        }
        backup.dispose();
    });
});
