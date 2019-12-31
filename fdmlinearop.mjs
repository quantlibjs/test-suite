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
import { Actual360, Actual365Fixed, AnalyticEuropeanEngine, Array1D, Array2D, BiCGstab, BicubicSpline, BilinearInterpolation, BlackScholesMertonProcess, CashOrNothingPayoff, Concentrating1dMesher, DateExt, DiscreteSimpsonIntegral, DiscreteTrapezoidIntegral, EuropeanExercise, Fdm3DimSolver, FdmAmericanStepCondition, FdmBackwardSolver, FdmBlackScholesMesher, FdmBlackScholesOp, FdmDirichletBoundary, FdmDividendHandler, FdmHestonHullWhiteOp, FdmHestonOp, FdmHestonSolver, FdmHestonVarianceMesher, FdmLinearOpLayout, FdmLogInnerValue, FdmMesherComposite, FdmMesherIntegral, FdmNdimSolver, FdmSchemeDesc, FdmSolverDesc, FdmStepConditionComposite, FiniteDifferenceModel, FirstDerivativeOp, FixedDividend, GeneralizedBlackScholesProcess, GMRES, Handle, HestonProcess, HullWhiteForwardProcess, HullWhiteProcess, HundsdorferScheme, HybridHestonHullWhiteProcess, MakeMCHestonHullWhiteEngine, MersenneTwisterUniformRng, MonotonicCubicNaturalSpline, NumericalDifferentiation, Option, Payoff, PlainVanillaPayoff, PseudoRandom, QL_EPSILON, QL_NULL_REAL, SavedSettings, SecondDerivativeOp, SecondOrderMixedDerivativeOp, Settings, SimpleQuote, SparseILUPreconditioner, SparseMatrix, StepCondition, TimeUnit, Uniform1dMesher, UniformGridMesher, VanillaOption, ZeroCurve, first, second, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate2, flatRate4, flatVol2 } from '/test-suite/utilities.mjs';

class FdmHestonExpressCondition extends StepCondition {
    constructor(redemptions, triggerLevels, exerciseTimes, mesher) {
        super();
        this._redemptions = redemptions;
        this._triggerLevels = triggerLevels;
        this._exerciseTimes = exerciseTimes;
        this._mesher = mesher;
    }
    applyTo(a, t) {
        const iter = this._exerciseTimes.findIndex((x) => {
            return x === t;
        });
        if (iter !== -1) {
            const index = iter - 0;
            const layout = this._mesher.layout();
            const endIter = layout.end();
            for (const iter = layout.begin(); iter.notEqual(endIter); iter.plusplus()) {
                const s = Math.exp(this._mesher.location(iter, 0));
                if (s > this._triggerLevels[index]) {
                    a[iter.index()] = this._redemptions[index];
                }
            }
        }
    }
}

class ExpressPayoff extends Payoff {
    name() {
        return 'ExpressPayoff';
    }
    description() {
        return 'ExpressPayoff';
    }
    f(s) {
        return ((s >= 100.0) ? 108.0 : 100.0) - ((s <= 75.0) ? 100.0 - s : 0.0);
    }
}

function createHestonHullWhite(maturity) {
    const dc = new Actual365Fixed();
    const today = Settings.evaluationDate.f();
    const s0 = new Handle(new SimpleQuote(100.0));
    const dates = [];
    const rates = [], divRates = [];
    for (let i = 0; i <= 25; ++i) {
        dates.push(DateExt.advance(today, i, TimeUnit.Years));
        rates.push(0.05);
        divRates.push(0.02);
    }
    const rTS = new Handle(new ZeroCurve().curveInit1(dates, rates, dc));
    const qTS = new Handle(new ZeroCurve().curveInit1(dates, divRates, dc));
    const v0 = 0.04;
    const hestonProcess = new HestonProcess(rTS, qTS, s0, v0, 1.0, v0 * 0.75, 0.4, -0.7);
    const hwFwdProcess = new HullWhiteForwardProcess(rTS, 0.00883, 0.01);
    hwFwdProcess.setForwardMeasureTime(maturity);
    const equityShortRateCorr = -0.7;
    return new HybridHestonHullWhiteProcess(hestonProcess, hwFwdProcess, equityShortRateCorr);
}

function createSolverDesc(dim, process) {
    const maturity = process.hullWhiteProcess().getForwardMeasureTime();
    const mesher1d = [];
    mesher1d.push(new Uniform1dMesher(Math.log(22.0), Math.log(440.0), dim[0]));
    mesher1d.push(new FdmHestonVarianceMesher(dim[1], process.hestonProcess(), maturity));
    mesher1d.push(new Uniform1dMesher(-0.15, 0.15, dim[2]));
    const mesher = new FdmMesherComposite().cInit2(mesher1d);
    const boundaries = [];
    const conditions = new FdmStepConditionComposite([], []);
    const payoff = new PlainVanillaPayoff(Option.Type.Call, 160.0);
    const calculator = new FdmLogInnerValue(payoff, mesher, 0);
    const tGrid = 100;
    const dampingSteps = 0;
    const desc = new FdmSolverDesc(mesher, boundaries, conditions, calculator, maturity, tGrid, dampingSteps);
    return desc;
}

function createTestMatrix(n, m, theta) {
    const a = new SparseMatrix().smInit1(n * m, n * m);
    for (let i = 0; i < n; ++i) {
        for (let j = 0; j < m; ++j) {
            const k = i * m + j;
            a.set(k, k, 1.0);
            if (i > 0 && j > 0 && i < n - 1 && j < m - 1) {
                const im1 = i - 1;
                const ip1 = i + 1;
                const jm1 = j - 1;
                const jp1 = j + 1;
                const delta = theta / ((ip1 - im1) * (jp1 - jm1));
                a.set(k, im1 * m + jm1, delta);
                a.set(k, im1 * m + jp1, -delta);
                a.set(k, ip1 * m + jm1, -delta);
                a.set(k, ip1 * m + jp1, delta);
            }
        }
    }
    return a;
}

describe(`Linear operator tests ${version}`, () => {
    it('Testing indexing of a linear operator...', () => {
        const dims = [5, 7, 8];
        const dim = Array.from(dims);
        const layout = new FdmLinearOpLayout(dim);
        const calculatedDim = layout.dim().length;
        const expectedDim = dim.length;
        expect(calculatedDim).toEqual(expectedDim);
        const calculatedSize = layout.size();
        const expectedSize = dim.reduce((p, c) => p * c, 1);
        expect(calculatedSize).toEqual(expectedSize);
        for (let k = 0; k < dim[0]; ++k) {
            for (let l = 0; l < dim[1]; ++l) {
                for (let m = 0; m < dim[2]; ++m) {
                    const tmp = new Array(3);
                    tmp[0] = k;
                    tmp[1] = l;
                    tmp[2] = m;
                    const calculatedIndex = layout.index(tmp);
                    const expectedIndex = k + l * dim[0] + m * dim[0] * dim[1];
                    expect(calculatedIndex).toEqual(expectedIndex);
                }
            }
        }
        const iter = layout.begin();
        for (let m = 0; m < dim[2]; ++m) {
            for (let l = 0; l < dim[1]; ++l) {
                for (let k = 0; k < dim[0]; ++k, iter.plusplus()) {
                    for (let n = 1; n < 4; ++n) {
                        const nn = layout.neighbourhood1(iter, 1, n);
                        const calculatedIndex = k + m * dim[0] * dim[1] +
                            ((l < dim[1] - n) ? l + n :
                                dim[1] - 1 - (l + n - (dim[1] - 1))) *
                                dim[0];
                        expect(nn).toEqual(calculatedIndex);
                    }
                    for (let n = 1; n < 7; ++n) {
                        const nn = layout.neighbourhood1(iter, 2, -n);
                        const calculatedIndex = k + l * dim[0] + ((m < n) ? n - m : m - n) * dim[0] * dim[1];
                        expect(nn).toEqual(calculatedIndex);
                    }
                }
            }
        }
    });

    it('Testing uniform grid mesher...', () => {
        const dims = [5, 7, 8];
        const dim = Array.from(dims);
        const layout = new FdmLinearOpLayout(dim);
        const boundaries = [];
        boundaries.push([-5, 10]);
        boundaries.push([5, 100]);
        boundaries.push([10, 20]);
        const mesher = new UniformGridMesher(layout, boundaries);
        const dx1 = 15.0 / (dim[0] - 1);
        const dx2 = 95.0 / (dim[1] - 1);
        const dx3 = 10.0 / (dim[2] - 1);
        const tol = 100 * QL_EPSILON;
        expect(Math.abs(dx1 - mesher.dminus(layout.begin(), 0))).toBeLessThan(tol);
        expect(Math.abs(dx1 - mesher.dplus(layout.begin(), 0))).toBeLessThan(tol);
        expect(Math.abs(dx2 - mesher.dminus(layout.begin(), 1))).toBeLessThan(tol);
        expect(Math.abs(dx2 - mesher.dplus(layout.begin(), 1))).toBeLessThan(tol);
        expect(Math.abs(dx3 - mesher.dminus(layout.begin(), 2))).toBeLessThan(tol);
        expect(Math.abs(dx3 - mesher.dplus(layout.begin(), 2))).toBeLessThan(tol);
    });

    xit('Testing application of first-derivatives map...', () => {
        const dims = [400, 100, 50];
        const dim = Array.from(dims);
        const index = new FdmLinearOpLayout(dim);
        const boundaries = [];
        boundaries.push([-5, 5]);
        boundaries.push([0, 10]);
        boundaries.push([5, 15]);
        const mesher = new UniformGridMesher(index, boundaries);
        const map = new FirstDerivativeOp(2, mesher);
        const r = new Array(mesher.layout().size());
        const endIter = index.end();
        for (const iter = index.begin(); iter.notEqual(endIter); iter.plusplus()) {
            r[iter.index()] = Math.sin(mesher.location(iter, 0)) +
                Math.cos(mesher.location(iter, 2));
        }
        const t = map.apply(r);
        const dz = (boundaries[2][second] - boundaries[2][first]) / (dims[2] - 1);
        for (const iter = index.begin(); iter.notEqual(endIter); iter.plusplus()) {
            const z = iter.coordinates()[2];
            const z0 = (z > 0) ? z - 1 : 1;
            const z2 = (z < dims[2] - 1) ? z + 1 : dims[2] - 2;
            const lz0 = boundaries[2][first] + z0 * dz;
            const lz2 = boundaries[2][first] + z2 * dz;
            let expected;
            if (z === 0) {
                expected = (Math.cos(boundaries[2][first] + dz) -
                    Math.cos(boundaries[2][first])) /
                    dz;
            }
            else if (z === dim[2] - 1) {
                expected = (Math.cos(boundaries[2][second]) -
                    Math.cos(boundaries[2][second] - dz)) /
                    dz;
            }
            else {
                expected = (Math.cos(lz2) - Math.cos(lz0)) / (2 * dz);
            }
            const calculated = t[iter.index()];
            expect(Math.abs(calculated - expected)).toBeLessThan(1e-10);
        }
    });

    xit('Testing application of second-derivatives map...', () => {
        const dims = [50, 50, 50];
        const dim = Array.from(dims);
        const index = new FdmLinearOpLayout(dim);
        const boundaries = [];
        boundaries.push([0, 0.5]);
        boundaries.push([0, 0.5]);
        boundaries.push([0, 0.5]);
        const mesher = new UniformGridMesher(index, boundaries);
        const r = new Array(mesher.layout().size());
        const endIter = index.end();
        for (const iter = index.begin(); iter.notEqual(endIter); iter.plusplus()) {
            const x = mesher.location(iter, 0);
            const y = mesher.location(iter, 1);
            const z = mesher.location(iter, 2);
            r[iter.index()] = Math.sin(x) * Math.cos(y) * Math.exp(z);
        }
        let t = new SecondDerivativeOp(0, mesher).apply(r);
        const tol = 5e-2;
        for (const iter = index.begin(); iter.notEqual(endIter); iter.plusplus()) {
            const i = iter.index();
            const x = mesher.location(iter, 0);
            const y = mesher.location(iter, 1);
            const z = mesher.location(iter, 2);
            let d = -Math.sin(x) * Math.cos(y) * Math.exp(z);
            if (iter.coordinates()[0] === 0 ||
                iter.coordinates()[0] === dims[0] - 1) {
                d = 0;
            }
            expect(Math.abs(d - t[i])).toBeLessThan(tol);
        }
        t = new SecondDerivativeOp(1, mesher).apply(r);
        for (const iter = index.begin(); iter.notEqual(endIter); iter.plusplus()) {
            const i = iter.index();
            const x = mesher.location(iter, 0);
            const y = mesher.location(iter, 1);
            const z = mesher.location(iter, 2);
            let d = -Math.sin(x) * Math.cos(y) * Math.exp(z);
            if (iter.coordinates()[1] === 0 ||
                iter.coordinates()[1] === dims[1] - 1) {
                d = 0;
            }
            expect(Math.abs(d - t[i])).toBeLessThan(tol);
        }
        t = new SecondDerivativeOp(2, mesher).apply(r);
        for (const iter = index.begin(); iter.notEqual(endIter); iter.plusplus()) {
            const i = iter.index();
            const x = mesher.location(iter, 0);
            const y = mesher.location(iter, 1);
            const z = mesher.location(iter, 2);
            let d = Math.sin(x) * Math.cos(y) * Math.exp(z);
            if (iter.coordinates()[2] === 0 ||
                iter.coordinates()[2] === dims[2] - 1) {
                d = 0;
            }
            expect(Math.abs(d - t[i])).toBeLessThan(tol);
        }
    });

    xit('Testing finite differences coefficients...', () => {
        const mesherX = new Concentrating1dMesher().init1(-2.0, 3.0, 50, [0.5, 0.01]);
        const mesherY = new Concentrating1dMesher().init1(0.5, 5.0, 25, [0.5, 0.1]);
        const mesherZ = new Concentrating1dMesher().init1(-1.0, 2.0, 31, [1.5, 0.01]);
        const meshers = new FdmMesherComposite().cInit5(mesherX, mesherY, mesherZ);
        const layout = meshers.layout();
        const endIter = layout.end();
        const tol = 1e-13;
        for (let direction = 0; direction < 3; ++direction) {
            const dfdx = new FirstDerivativeOp(direction, meshers).toMatrix();
            const d2fdx2 = new SecondDerivativeOp(direction, meshers).toMatrix();
            const gridPoints = meshers.locations(direction);
            for (const iter = layout.begin(); iter.notEqual(endIter); iter.plusplus()) {
                const c = iter.coordinates()[direction];
                const index = iter.index();
                const indexM1 = layout.neighbourhood1(iter, direction, -1);
                const indexP1 = layout.neighbourhood1(iter, direction, +1);
                if (c === 0) {
                    const twoPoints = new Array(2);
                    twoPoints[0] = 0.0;
                    twoPoints[1] = gridPoints[indexP1] - gridPoints[index];
                    const ndWeights1st = new NumericalDifferentiation()
                        .init1(null, 1, twoPoints)
                        .weights();
                    const beta1 = dfdx.f(index, index);
                    const gamma1 = dfdx.f(index, indexP1);
                    expect(Math.abs((beta1 - ndWeights1st[0]) / beta1)).toBeLessThan(tol);
                    expect(Math.abs((gamma1 - ndWeights1st[1]) / gamma1))
                        .toBeLessThan(tol);
                    const beta2 = d2fdx2.f(index, index);
                    const gamma2 = d2fdx2.f(index, indexP1);
                    expect(Math.abs(beta2)).toBeLessThan(QL_EPSILON);
                    expect(Math.abs(gamma2)).toBeLessThan(QL_EPSILON);
                }
                else if (c === layout.dim()[direction] - 1) {
                    const twoPoints = new Array(2);
                    twoPoints[0] = gridPoints[indexM1] - gridPoints[index];
                    twoPoints[1] = 0.0;
                    const ndWeights1st = new NumericalDifferentiation()
                        .init1(null, 1, twoPoints)
                        .weights();
                    const alpha1 = dfdx.f(index, indexM1);
                    const beta1 = dfdx.f(index, index);
                    expect(Math.abs((alpha1 - ndWeights1st[0]) / alpha1))
                        .toBeLessThan(tol);
                    expect(Math.abs((beta1 - ndWeights1st[1]) / beta1)).toBeLessThan(tol);
                    const alpha2 = d2fdx2.f(index, indexM1);
                    const beta2 = d2fdx2.f(index, index);
                    expect(Math.abs(alpha2)).toBeLessThan(QL_EPSILON);
                    expect(Math.abs(beta2)).toBeLessThan(QL_EPSILON);
                }
                else {
                    const threePoints = new Array(3);
                    threePoints[0] = gridPoints[indexM1] - gridPoints[index];
                    threePoints[1] = 0.0;
                    threePoints[2] = gridPoints[indexP1] - gridPoints[index];
                    const ndWeights1st = new NumericalDifferentiation()
                        .init1(null, 1, threePoints)
                        .weights();
                    const alpha1 = dfdx.f(index, indexM1);
                    const beta1 = dfdx.f(index, index);
                    const gamma1 = dfdx.f(index, indexP1);
                    expect(Math.abs((alpha1 - ndWeights1st[0]) / alpha1))
                        .toBeLessThan(tol);
                    expect(Math.abs((beta1 - ndWeights1st[1]) / beta1)).toBeLessThan(tol);
                    expect(Math.abs((gamma1 - ndWeights1st[2]) / gamma1))
                        .toBeLessThan(tol);
                    const ndWeights2nd = new NumericalDifferentiation()
                        .init1(null, 2, threePoints)
                        .weights();
                    const alpha2 = d2fdx2.f(index, indexM1);
                    const beta2 = d2fdx2.f(index, index);
                    const gamma2 = d2fdx2.f(index, indexP1);
                    expect(Math.abs((alpha2 - ndWeights2nd[0]) / alpha2))
                        .toBeLessThan(tol);
                    expect(Math.abs((beta2 - ndWeights2nd[1]) / beta2)).toBeLessThan(tol);
                    expect(Math.abs((gamma2 - ndWeights2nd[2]) / gamma2))
                        .toBeLessThan(tol);
                }
            }
        }
    });

    it('Testing application of second-order mixed-derivatives map...', () => {
        const dims = [50, 50, 50];
        const dim = Array.from(dims);
        const index = new FdmLinearOpLayout(dim);
        const boundaries = [];
        boundaries.push([0, 0.5]);
        boundaries.push([0, 0.5]);
        boundaries.push([0, 0.5]);
        const mesher = new UniformGridMesher(index, boundaries);
        const r = new Array(mesher.layout().size());
        const endIter = index.end();
        for (const iter = index.begin(); iter.notEqual(endIter); iter.plusplus()) {
            const x = mesher.location(iter, 0);
            const y = mesher.location(iter, 1);
            const z = mesher.location(iter, 2);
            r[iter.index()] = Math.sin(x) * Math.cos(y) * Math.exp(z);
        }
        let t = new SecondOrderMixedDerivativeOp(0, 1, mesher).apply(r);
        let u = new SecondOrderMixedDerivativeOp(1, 0, mesher).apply(r);
        const tol = 5e-2;
        for (const iter = index.begin(); iter.notEqual(endIter); iter.plusplus()) {
            const i = iter.index();
            const x = mesher.location(iter, 0);
            const y = mesher.location(iter, 1);
            const z = mesher.location(iter, 2);
            const d = -Math.cos(x) * Math.sin(y) * Math.exp(z);
            expect(Math.abs(d - t[i])).toBeLessThan(tol);
            expect(Math.abs(t[i] - u[i])).toBeLessThan(1e5 * QL_EPSILON);
        }
        t = new SecondOrderMixedDerivativeOp(0, 2, mesher).apply(r);
        u = new SecondOrderMixedDerivativeOp(2, 0, mesher).apply(r);
        for (const iter = index.begin(); iter.notEqual(endIter); iter.plusplus()) {
            const i = iter.index();
            const x = mesher.location(iter, 0);
            const y = mesher.location(iter, 1);
            const z = mesher.location(iter, 2);
            const d = Math.cos(x) * Math.cos(y) * Math.exp(z);
            expect(Math.abs(d - t[i])).toBeLessThan(tol);
            expect(Math.abs(t[i] - u[i])).toBeLessThan(1e5 * QL_EPSILON);
        }
        t = new SecondOrderMixedDerivativeOp(1, 2, mesher).apply(r);
        u = new SecondOrderMixedDerivativeOp(2, 1, mesher).apply(r);
        for (const iter = index.begin(); iter.notEqual(endIter); iter.plusplus()) {
            const i = iter.index();
            const x = mesher.location(iter, 0);
            const y = mesher.location(iter, 1);
            const z = mesher.location(iter, 2);
            const d = -Math.sin(x) * Math.sin(y) * Math.exp(z);
            expect(Math.abs(d - t[i])).toBeLessThan(tol);
            expect(Math.abs(t[i] - u[i])).toBeLessThan(1e5 * QL_EPSILON);
        }
    });

    it('Testing triple-band map solution...', () => {
        const dims = [100, 400];
        const dim = Array.from(dims);
        const layout = new FdmLinearOpLayout(dim);
        const boundaries = [];
        boundaries.push([0, 1.0]);
        boundaries.push([0, 1.0]);
        const mesher = new UniformGridMesher(layout, boundaries);
        const dy = new FirstDerivativeOp(1, mesher);
        dy.axpyb([2.0], dy, dy, [1.0]);
        const copyOfDy = new FirstDerivativeOp(1, mesher).tblopInit2(dy);
        const u = new Array(layout.size());
        for (let i = 0; i < layout.size(); ++i) {
            u[i] = Math.sin(0.1 * i) + Math.cos(0.35 * i);
        }
        let t = dy.solve_splitting(copyOfDy.apply(u), 1.0, 0.0);
        for (let i = 0; i < u.length; ++i) {
            expect(Math.abs(u[i] - t[i])).toBeLessThan(1e-6);
        }
        const dx = new FirstDerivativeOp(0, mesher);
        dx.axpyb([], dx, dx, [1.0]);
        let copyOfDx = new FirstDerivativeOp(0, mesher);
        copyOfDx = dx;
        t = dx.solve_splitting(copyOfDx.apply(u), 1.0, 0.0);
        for (let i = 0; i < u.length; ++i) {
            expect(Math.abs(u[i] - t[i])).toBeLessThan(1e-6);
        }
        const dxx = new SecondDerivativeOp(0, mesher);
        dxx.axpyb([0.5], dxx, dx, [1.0]);
        let copyOfDxx = dxx.tblopInit2(dxx);
        t = dxx.solve_splitting(copyOfDxx.apply(u), 1.0, 0.0);
        for (let i = 0; i < u.length; ++i) {
            expect(Math.abs(u[i] - t[i]) > 1e-6);
        }
        copyOfDxx.add1(new SecondDerivativeOp(1, mesher));
        copyOfDxx = dxx;
        t = dxx.solve_splitting(copyOfDxx.apply(u), 1.0, 0.0);
        for (let i = 0; i < u.length; ++i) {
            expect(Math.abs(u[i] - t[i])).toBeLessThan(1e-6);
        }
    });

    it('Testing FDM with barrier option in Heston model...', () => {
        const backup = new SavedSettings();
        const dims = [200, 100];
        const dim = Array.from(dims);
        const index = new FdmLinearOpLayout(dim);
        const boundaries = [];
        boundaries.push([3.8, 4.905274778]);
        boundaries.push([0.000, 1.0]);
        const mesher = new UniformGridMesher(index, boundaries);
        const s0 = new Handle(new SimpleQuote(100.0));
        const rTS = new Handle(flatRate4(0.05, new Actual365Fixed()));
        const qTS = new Handle(flatRate4(0.0, new Actual365Fixed()));
        const hestonProcess = new HestonProcess(rTS, qTS, s0, 0.04, 2.5, 0.04, 0.66, -0.8);
        Settings.evaluationDate.set(DateExt.UTC('28,March,2004'));
        const hestonOp = new FdmHestonOp(mesher, hestonProcess);
        const rhs = new Array(mesher.layout().size());
        const endIter = mesher.layout().end();
        for (const iter = mesher.layout().begin(); iter.notEqual(endIter); iter.plusplus()) {
            rhs[iter.index()] =
                Math.max(Math.exp(mesher.location(iter, 0)) - 100, 0.0);
        }
        const bcSet = [];
        bcSet.push(new FdmDirichletBoundary(mesher, 0.0, 0, FdmDirichletBoundary.Side.Upper));
        const theta = 0.5 + Math.sqrt(3.0) / 6.;
        const hsEvolver = new HundsdorferScheme(theta, 0.5, hestonOp, bcSet);
        const hsModel = new FiniteDifferenceModel(hsEvolver);
        hsModel.rollback(rhs, 1.0, 0.0, 50);
        const ret = Array2D.newMatrix(dims[0], dims[1]);
        for (let i = 0; i < dims[0]; ++i) {
            for (let j = 0; j < dims[1]; ++j) {
                ret[i][j] = rhs[i + j * dims[0]];
            }
        }
        const tx = [], ty = [];
        for (const iter = mesher.layout().begin(); iter.notEqual(endIter); iter.plusplus()) {
            if (iter.coordinates()[1] === 0) {
                tx.push(mesher.location(iter, 0));
            }
            if (iter.coordinates()[0] === 0) {
                ty.push(mesher.location(iter, 1));
            }
        }
        const interpolate = new BilinearInterpolation(ty, 0, ty.length, tx, 0, tx.length, ret);
        const x = 100;
        const v0 = 0.04;
        const npv = interpolate.f(v0, Math.log(x));
        const delta = 0.5 *
            (interpolate.f(v0, Math.log(x + 1)) -
                interpolate.f(v0, Math.log(x - 1)));
        const gamma = interpolate.f(v0, Math.log(x + 1)) +
            interpolate.f(v0, Math.log(x - 1)) - 2 * npv;
        const npvExpected = 9.049016;
        const deltaExpected = 0.511285;
        const gammaExpected = -0.034296;
        expect(Math.abs(npv - npvExpected)).toBeLessThan(0.000001);
        expect(Math.abs(delta - deltaExpected)).toBeLessThan(0.000001);
        expect(Math.abs(gamma - gammaExpected)).toBeLessThan(0.000001);
        backup.dispose();
    });

    it('Testing FDM with American option in Heston model...', () => {
        const backup = new SavedSettings();
        const dims = [200, 100];
        const dim = Array.from(dims);
        const index = new FdmLinearOpLayout(dim);
        const boundaries = [];
        boundaries.push([3.8, Math.log(220.0)]);
        boundaries.push([0.000, 1.0]);
        const mesher = new UniformGridMesher(index, boundaries);
        const s0 = new Handle(new SimpleQuote(100.0));
        const rTS = new Handle(flatRate4(0.05, new Actual365Fixed()));
        const qTS = new Handle(flatRate4(0.0, new Actual365Fixed()));
        const hestonProcess = new HestonProcess(rTS, qTS, s0, 0.04, 2.5, 0.04, 0.66, -0.8);
        Settings.evaluationDate.set(DateExt.UTC('28,March,2004'));
        const LinearOp = new FdmHestonOp(mesher, hestonProcess);
        const payoff = new PlainVanillaPayoff(Option.Type.Put, 100.0);
        const rhs = new Array(mesher.layout().size());
        const endIter = mesher.layout().end();
        for (const iter = mesher.layout().begin(); iter.notEqual(endIter); iter.plusplus()) {
            rhs[iter.index()] = payoff.f(Math.exp(mesher.location(iter, 0)));
        }
        const condition = new FdmAmericanStepCondition(mesher, new FdmLogInnerValue(payoff, mesher, 0));
        const theta = 0.5 + Math.sqrt(3.0) / 6.;
        const hsEvolver = new HundsdorferScheme(theta, 0.5, LinearOp);
        const hsModel = new FiniteDifferenceModel(hsEvolver);
        hsModel.rollback(rhs, 1.0, 0.0, 50, condition);
        const ret = Array2D.newMatrix(dims[0], dims[1]);
        for (let i = 0; i < dims[0]; ++i) {
            for (let j = 0; j < dims[1]; ++j) {
                ret[i][j] = rhs[i + j * dims[0]];
            }
        }
        const tx = [], ty = [];
        for (const iter = mesher.layout().begin(); iter.notEqual(endIter); iter.plusplus()) {
            if (iter.coordinates()[1] === 0) {
                tx.push(mesher.location(iter, 0));
            }
            if (iter.coordinates()[0] === 0) {
                ty.push(mesher.location(iter, 1));
            }
        }
        const interpolate = new BilinearInterpolation(ty, 0, ty.length, tx, 0, tx.length, ret);
        const x = 100;
        const v0 = 0.04;
        const npv = interpolate.f(v0, Math.log(x));
        const npvExpected = 5.641648;
        expect(Math.abs(npv - npvExpected)).toBeLessThan(0.000001);
        backup.dispose();
    });

    it('Testing FDM with express certificate in Heston model...', () => {
        const backup = new SavedSettings();
        const dims = [200, 100];
        const dim = Array.from(dims);
        const index = new FdmLinearOpLayout(dim);
        const boundaries = [];
        boundaries.push([3.8, Math.log(220.0)]);
        boundaries.push([0.000, 1.0]);
        const mesher = new UniformGridMesher(index, boundaries);
        const s0 = new Handle(new SimpleQuote(100.0));
        const rTS = new Handle(flatRate4(0.05, new Actual365Fixed()));
        const qTS = new Handle(flatRate4(0.0, new Actual365Fixed()));
        const hestonProcess = new Handle(new HestonProcess(rTS, qTS, s0, 0.04, 2.5, 0.04, 0.66, -0.8));
        const evaluationDate = DateExt.UTC('28,March,2004');
        Settings.evaluationDate.set(evaluationDate);
        const triggerLevels = new Array(2);
        triggerLevels[0] = triggerLevels[1] = 100.0;
        const redemptions = new Array(2);
        redemptions[0] = redemptions[1] = 108.0;
        const exerciseTimes = new Array(2);
        exerciseTimes[0] = 0.333;
        exerciseTimes[1] = 0.666;
        const dividendSchedule = [new FixedDividend(2.5, DateExt.advance(evaluationDate, 6, TimeUnit.Months))];
        const dividendCondition = new FdmDividendHandler(dividendSchedule, mesher, rTS.currentLink().referenceDate(), rTS.currentLink().dayCounter(), 0);
        const expressCondition = new FdmHestonExpressCondition(redemptions, triggerLevels, exerciseTimes, mesher);
        const stoppingTimes = [];
        stoppingTimes.push(exerciseTimes);
        stoppingTimes.push(dividendCondition.dividendTimes());
        const conditions = [];
        conditions.push(expressCondition);
        conditions.push(dividendCondition);
        const condition = new FdmStepConditionComposite(stoppingTimes, conditions);
        const payoff = new ExpressPayoff();
        const calculator = new FdmLogInnerValue(payoff, mesher, 0);
        const bcSet = [];
        const solverDesc = new FdmSolverDesc(mesher, bcSet, condition, calculator, 1.0, 50, 0);
        const solver = new FdmHestonSolver(hestonProcess, solverDesc);
        const s = s0.currentLink().value();
        const v0 = 0.04;
        expect(Math.abs(solver.valueAt(s, v0) - 101.027)).toBeLessThan(0.01);
        expect(Math.abs(solver.deltaAt(s, v0) - 0.4181)).toBeLessThan(0.001);
        expect(Math.abs(solver.gammaAt(s, v0) + 0.0400)).toBeLessThan(0.001);
        expect(Math.abs(solver.meanVarianceDeltaAt(s, v0) - 0.6602))
            .toBeLessThan(0.001);
        expect(Math.abs(solver.meanVarianceGammaAt(s, v0) + 0.0316))
            .toBeLessThan(0.001);
        backup.dispose();
    });

    xit('Testing FDM with Heston Hull-White model...', () => {
        const backup = new SavedSettings();
        const today = DateExt.UTC('28,March,2004');
        Settings.evaluationDate.set(today);
        const exerciseDate = DateExt.UTC('28,March,2012');
        const maturity = new Actual365Fixed().yearFraction(today, exerciseDate);
        const dims = [51, 31, 31];
        const dim = Array.from(dims);
        const jointProcess = createHestonHullWhite(maturity);
        const desc = createSolverDesc(dim, jointProcess);
        const mesher = desc.mesher;
        const hwFwdProcess = jointProcess.hullWhiteProcess();
        const hwProcess = new HullWhiteProcess(jointProcess.hestonProcess().riskFreeRate(), hwFwdProcess.a(), hwFwdProcess.sigma());
        const linearOp = new FdmHestonHullWhiteOp(mesher, jointProcess.hestonProcess(), hwProcess, jointProcess.eta());
        const rhs = new Array(mesher.layout().size());
        const endIter = mesher.layout().end();
        for (const iter = mesher.layout().begin(); iter.notEqual(endIter); iter.plusplus()) {
            rhs[iter.index()] = desc.calculator.avgInnerValue(iter, maturity);
        }
        const theta = 0.5 + Math.sqrt(3.0) / 6.;
        const hsEvolver = new HundsdorferScheme(theta, 0.5, linearOp);
        const hsModel = new FiniteDifferenceModel(hsEvolver);
        hsModel.rollback(rhs, maturity, 0.0, desc.timeSteps);
        const tx = [], ty = [], tr = [], y = [];
        for (const iter = mesher.layout().begin(); iter.notEqual(endIter); iter.plusplus()) {
            if (iter.coordinates()[1] === 0 && iter.coordinates()[2] === 0) {
                tx.push(mesher.location(iter, 0));
            }
            if (iter.coordinates()[0] === 0 && iter.coordinates()[2] === 0) {
                ty.push(mesher.location(iter, 1));
            }
            if (iter.coordinates()[0] === 0 && iter.coordinates()[1] === 0) {
                tr.push(mesher.location(iter, 2));
            }
        }
        const x0 = 100;
        const v0 = jointProcess.hestonProcess().v0();
        const r0 = 0;
        for (let k = 0; k < dim[2]; ++k) {
            const ret = Array2D.newMatrix(dim[0], dim[1]);
            for (let i = 0; i < dim[0]; ++i) {
                for (let j = 0; j < dim[1]; ++j) {
                    ret[i][j] = rhs[i + j * dim[0] + k * dim[0] * dim[1]];
                }
            }
            y.push(new BicubicSpline(ty, 0, ty.length, tx, 0, tx.length, ret)
                .f(v0, Math.log(x0)));
        }
        const directCalc = new MonotonicCubicNaturalSpline(tr, 0, tr.length, y, 0).f(r0);
        const x = new Array(3);
        x[0] = Math.log(x0);
        x[1] = v0;
        x[2] = r0;
        const solver3d = new Fdm3DimSolver(desc, FdmSchemeDesc.Hundsdorfer(), linearOp);
        const solverCalc = solver3d.interpolateAt(x[0], x[1], x[2]);
        const solverTheta = solver3d.thetaAt(x[0], x[1], x[2]);
        expect(Math.abs(directCalc - solverCalc)).toBeLessThan(1e-4);
        const solverNd = new FdmNdimSolver(3).fdmndsInit(desc, FdmSchemeDesc.Hundsdorfer(), linearOp);
        const solverNdCalc = solverNd.interpolateAt(x);
        const solverNdTheta = solverNd.thetaAt(x);
        expect(Math.abs(solverNdCalc - solverCalc)).toBeLessThan(1e-4);
        expect(Math.abs(solverNdTheta - solverTheta)).toBeLessThan(1e-4);
        const option = new VanillaOption(new PlainVanillaPayoff(Option.Type.Call, 160.0), new EuropeanExercise(exerciseDate));
        const tol = 0.025;
        option.setPricingEngine(new MakeMCHestonHullWhiteEngine(new PseudoRandom())
            .mmchhweInit(jointProcess)
            .withSteps(200)
            .withAntitheticVariate()
            .withControlVariate()
            .withAbsoluteTolerance(tol)
            .withSeed(42)
            .f());
        const expected = 4.73;
        expect(Math.abs(directCalc - expected)).toBeLessThan(3 * tol);
        backup.dispose();
    });

    xit('Testing bi-conjugated gradient stabilized algorithm...', () => {
        const n = 41, m = 21;
        const theta = 1.0;
        const a = createTestMatrix(n, m, theta);
        for (let i = 0; i < n; ++i) {
            for (let j = 0; j < m; ++j) {
                const k = i * m + j;
                a.set(k, k, 1.0);
                if (i > 0 && j > 0 && i < n - 1 && j < m - 1) {
                    const im1 = i - 1;
                    const ip1 = i + 1;
                    const jm1 = j - 1;
                    const jp1 = j + 1;
                    const delta = theta / ((ip1 - im1) * (jp1 - jm1));
                    a.set(k, im1 * m + jm1, delta);
                    a.set(k, im1 * m + jp1, -delta);
                    a.set(k, ip1 * m + jm1, -delta);
                    a.set(k, ip1 * m + jp1, delta);
                }
            }
        }
        const matmult = {
            f: (x) => {
                return a.mulVector(x);
            }
        };
        const ilu = new SparseILUPreconditioner(a, 4);
        const precond = {
            f: (x) => {
                return ilu.apply(x);
            }
        };
        const b = new Array(n * m);
        const rng = new MersenneTwisterUniformRng().init1(1234);
        for (let i = 0; i < b.length; ++i) {
            b[i] = rng.next().value;
        }
        const tol = 1e-10;
        const biCGstab = new BiCGstab(matmult, n * m, tol, precond);
        const x = biCGstab.solve(b).x;
        const error = Math.sqrt(Array1D.DotProduct(Array1D.sub(b, a.mulVector(x)), Array1D.sub(b, a.mulVector(x))) /
            Array1D.DotProduct(b, b));
        expect(error).toBeLessThan(tol);
    });

    xit('Testing GMRES algorithm...', () => {
        const n = 41, m = 21;
        const theta = 1.0;
        const a = createTestMatrix(n, m, theta);
        const matmult = {
            f: (x) => {
                return a.mulVector(x);
            }
        };
        const ilu = new SparseILUPreconditioner(a, 4);
        const precond = {
            f: (x) => {
                return ilu.apply(x);
            }
        };
        const b = new Array(n * m);
        const rng = new MersenneTwisterUniformRng().init1(1234);
        for (let i = 0; i < b.length; ++i) {
            b[i] = rng.next().value;
        }
        const tol = 1e-10;
        const gmres = new GMRES(matmult, n * m, tol, precond);
        const result = gmres.solve(b, b);
        const x = result.x;
        const errorCalculated = Array1D.back(result.errors);
        const error = Math.sqrt(Array1D.DotProduct(Array1D.sub(b, a.mulVector(x)), Array1D.sub(b, a.mulVector(x))) /
            Array1D.DotProduct(b, b));
        expect(error).toBeLessThan(tol);
        expect(Math.abs(error - errorCalculated)).toBeLessThan(10 * QL_EPSILON);
        const gmresRestart = new GMRES(matmult, 5, tol, precond);
        const resultRestart = gmresRestart.solveWithRestart(5, b, b);
        const errorWithRestart = Array1D.back(resultRestart.errors);
        expect(errorWithRestart).toBeLessThan(tol);
    });

    it('Testing Crank-Nicolson with initial implicit damping steps ' +
        'for a digital option...', () => {
        const backup = new SavedSettings();
        const dc = new Actual360();
        const today = DateExt.UTC();
        const spot = new SimpleQuote(100.0);
        const qTS = flatRate2(today, 0.06, dc);
        const rTS = flatRate2(today, 0.06, dc);
        const volTS = flatVol2(today, 0.35, dc);
        const payoff = new CashOrNothingPayoff(Option.Type.Put, 100, 10.0);
        const maturity = 0.75;
        const exDate = DateExt.add(today, Math.floor(maturity * 360 + 0.5));
        const exercise = new EuropeanExercise(exDate);
        const process = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
        const engine = new AnalyticEuropeanEngine().init1(process);
        const opt = new VanillaOption(payoff, exercise);
        opt.setPricingEngine(engine);
        const expectedPV = opt.NPV();
        const expectedGamma = opt.gamma();
        const csSteps = 25, dampingSteps = 3, xGrid = 400;
        const dim = [xGrid];
        const layout = new FdmLinearOpLayout(dim);
        const equityMesher = new FdmBlackScholesMesher(dim[0], process, maturity, payoff.strike(), QL_NULL_REAL, QL_NULL_REAL, 0.0001, 1.5, [payoff.strike(), 0.01]);
        const mesher = new FdmMesherComposite().cInit3(equityMesher);
        const map = new FdmBlackScholesOp(mesher, process, payoff.strike());
        const calculator = new FdmLogInnerValue(payoff, mesher, 0);
        const rhs = new Array(layout.size()), x = new Array(layout.size());
        const endIter = layout.end();
        for (const iter = layout.begin(); iter.notEqual(endIter); iter.plusplus()) {
            rhs[iter.index()] = calculator.avgInnerValue(iter, maturity);
            x[iter.index()] = mesher.location(iter, 0);
        }
        const solver = new FdmBackwardSolver(map, [], null, FdmSchemeDesc.Douglas());
        solver.rollback(rhs, maturity, 0.0, csSteps, dampingSteps);
        const spline = new MonotonicCubicNaturalSpline(x, 0, x.length, rhs, 0);
        const s = spot.value();
        const calculatedPV = spline.f(Math.log(s));
        const calculatedGamma = (spline.secondDerivative(Math.log(s)) -
            spline.derivative(Math.log(s))) /
            (s * s);
        const relTol = 2e-3;
        expect(Math.abs(calculatedPV - expectedPV))
            .toBeLessThan(relTol * expectedPV);
        expect(Math.abs(calculatedGamma - expectedGamma))
            .toBeLessThan(relTol * expectedGamma);
        backup.dispose();
    });

    xit('Testing SparseMatrixReference type...', () => {
        const rows = 10;
        const columns = 10;
        const nMatrices = 5;
        const nElements = 50;
        const rng = new MersenneTwisterUniformRng().init1(1234);
        const expected = new SparseMatrix().smInit1(rows, columns);
        const v = new Array(nMatrices);
        for (let i = 0; i < nMatrices; i++) {
            v[i] = new SparseMatrix().smInit1(rows, columns);
        }
        const refs = [];
        for (let i = 0; i < v.length; ++i) {
            const m = v[i];
            for (let j = 0; j < nElements; ++j) {
                const row = Math.floor(rng.next().value * rows);
                const column = Math.floor(rng.next().value * columns);
                const value = rng.next().value;
                m.set(row, column, m.f(row, column) + value);
                expected.set(row, column, expected.f(row, column) + value);
            }
            refs.push(m);
        }
        const calculated = new SparseMatrix().smInit1(rows, columns);
        for (let i = 0; i < rows; ++i) {
            for (let j = 0; j < columns; ++j) {
                expect(Math.abs(calculated.f(i, j) - expected.f(i, j)))
                    .toBeLessThan(100 * QL_EPSILON);
            }
        }
    });

    xit('Testing assignment to zero in sparse matrix...', () => {
        const m = new SparseMatrix().smInit1(5, 5);
        expect(m.filled_size()).toBeGreaterThan(0);
        m.set(0, 0, 0.0);
        m.set(1, 2, 0.0);
        expect(m.filled_size()).toEqual(2);
        m.set(1, 3, 1.0);
        expect(m.filled_size()).toEqual(3);
        m.set(1, 3, 0.0);
        expect(m.filled_size()).toEqual(3);
    });

    it('Testing integrals over meshers functions...', () => {
        const mesher = new FdmMesherComposite().cInit5(new Concentrating1dMesher().init1(-1, 1.6, 21, [0, 0.1]), new Concentrating1dMesher().init1(-3, 4, 11, [1, 0.01]), new Concentrating1dMesher().init1(-2, 1, 5, [0.5, 0.1]));
        const layout = mesher.layout();
        const f = new Array(mesher.layout().size());
        for (const iter = layout.begin(); iter.notEqual(layout.end()); iter.plusplus()) {
            const x = mesher.location(iter, 0);
            const y = mesher.location(iter, 1);
            const z = mesher.location(iter, 2);
            f[iter.index()] = x * x + 3 * y * y - 3 * z * z + 2 * x * y - x * z -
                3 * y * z + 4 * x - y - 3 * z + 2;
        }
        const tol = 1e-12;
        const expectedSimpson = 876.512;
        const calculatedSimpson = new FdmMesherIntegral(mesher, new DiscreteSimpsonIntegral())
            .integrate(f);
        expect(Math.abs(calculatedSimpson - expectedSimpson))
            .toBeLessThan(tol * expectedSimpson);
        const expectedTrapezoid = 917.0148209153263;
        const calculatedTrapezoid = new FdmMesherIntegral(mesher, new DiscreteTrapezoidIntegral())
            .integrate(f);
        expect(Math.abs(calculatedTrapezoid - expectedTrapezoid))
            .toBeLessThan(tol * expectedTrapezoid);
    });

    it('Testing Black-Scholes mesher in a high interest rate scenario...', () => {
        const backup = new SavedSettings();
        const dc = new Actual365Fixed();
        const today = DateExt.UTC('11,February,2018');
        const spot = 100;
        const r = 0.21;
        const q = 0.02;
        const v = 0.25;
        const process = new GeneralizedBlackScholesProcess().init1(new Handle(new SimpleQuote(spot)), new Handle(flatRate2(today, q, dc)), new Handle(flatRate2(today, r, dc)), new Handle(flatVol2(today, v, dc)));
        const size = 10;
        const maturity = 2.0;
        const strike = 100;
        const eps = 0.05;
        const normInvEps = 1.64485363;
        const scaleFactor = 2.5;
        const loc = new FdmBlackScholesMesher(size, process, maturity, strike, QL_NULL_REAL, QL_NULL_REAL, eps, scaleFactor)
            .locations();
        const calculatedMin = Math.exp(loc[0]);
        const calculatedMax = Math.exp(Array1D.back(loc));
        const minimum = spot * Math.exp(-normInvEps * scaleFactor * v * Math.sqrt(maturity));
        const maximum = spot /
            process.riskFreeRate().currentLink().discount2(maturity) *
            process.dividendYield().currentLink().discount2(maturity) *
            Math.exp(normInvEps * scaleFactor * v * Math.sqrt(maturity));
        const relTol = 1e-7;
        const maxDiff = Math.abs(calculatedMax - maximum);
        expect(maxDiff).toBeLessThan(relTol * maximum);
        const minDiff = Math.abs(calculatedMin - minimum);
        expect(minDiff).toBeLessThan(relTol * minimum);
        backup.dispose();
    });

    it('Testing Black-Scholes mesher in a low volatility and high ' +
        'discrete dividend scenario...', () => {
        const backup = new SavedSettings();
        const dc = new Actual365Fixed();
        const today = DateExt.UTC('28,January,2018');
        const spot = new Handle(new SimpleQuote(100.0));
        const qTS = new Handle(flatRate2(today, 0.07, dc));
        const rTS = new Handle(flatRate2(today, 0.16, dc));
        const volTS = new Handle(flatVol2(today, 0.0, dc));
        const process = new GeneralizedBlackScholesProcess().init1(spot, qTS, rTS, volTS);
        const firstDivDate = DateExt.advance(today, 7, TimeUnit.Months);
        const firstDivAmount = 10.0;
        const secondDivDate = DateExt.advance(today, 11, TimeUnit.Months);
        const secondDivAmount = 5.0;
        const divSchedule = [];
        divSchedule.push(new FixedDividend(firstDivAmount, firstDivDate));
        divSchedule.push(new FixedDividend(secondDivAmount, secondDivDate));
        const size = 5;
        const maturity = 1.0;
        const strike = 100;
        const eps = 0.0001;
        const scaleFactor = 1.5;
        const loc = new FdmBlackScholesMesher(size, process, maturity, strike, QL_NULL_REAL, QL_NULL_REAL, eps, scaleFactor, [QL_NULL_REAL, QL_NULL_REAL], divSchedule)
            .locations();
        const maximum = spot.currentLink().value() *
            qTS.currentLink().discount1(firstDivDate) /
            rTS.currentLink().discount1(firstDivDate);
        const minimum = (1 -
            firstDivAmount /
                (spot.currentLink().value() *
                    qTS.currentLink().discount1(firstDivDate) /
                    rTS.currentLink().discount1(firstDivDate))) *
            spot.currentLink().value() *
            qTS.currentLink().discount1(secondDivDate) /
            rTS.currentLink().discount1(secondDivDate) -
            secondDivAmount;
        const calculatedMax = Math.exp(Array1D.back(loc));
        const calculatedMin = Math.exp(loc[0]);
        const relTol = 1e5 * QL_EPSILON;
        const maxDiff = Math.abs(calculatedMax - maximum);
        expect(maxDiff).toBeLessThan(relTol * maximum);
        const minDiff = Math.abs(calculatedMin - minimum);
        expect(minDiff).toBeLessThan(relTol * minimum);
        backup.dispose();
    });
});
