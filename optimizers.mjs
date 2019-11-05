/**
 * Copyright 2019 Jin Yang. All Rights Reserved.
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
import { Array1D, BFGS, BoundaryConstraint, ConjugateGradient, CostFunction, DifferentialEvolution, EndCriteria, GoldsteinLineSearch, LevenbergMarquardt, MersenneTwisterUniformRng, NoConstraint, Problem, QL_NULL_REAL, Simplex, SteepestDescent, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

class NamedOptimizationMethod {
}

const costFunctions_ = [];
const constraints_ = [];
const initialValues_ = [];
const maxIterations_ = [];
const maxStationaryStateIterations_ = [];
const rootEpsilons_ = [];
const functionEpsilons_ = [];
const gradientNormEpsilons_ = [];
const endCriterias_ = [];
const optimizationMethods_ = [];
const xMinExpected_ = [];
const yMinExpected_ = [];

class OneDimensionalPolynomialDegreeN extends CostFunction {
    constructor(coefficients) {
        super();
        this._coefficients = Array.from(coefficients);
        this._polynomialDegree = coefficients.length - 1;
    }
    value(x) {
        if (x.length !== 1) {
            throw new Error('independent variable must be 1 dimensional');
        }
        let y = 0;
        for (let i = 0; i <= this._polynomialDegree; ++i) {
            y += this._coefficients[i] * Math.pow(x[0], i);
        }
        return y;
    }
    values(x) {
        if (x.length !== 1) {
            throw new Error('independent variable must be 1 dimensional');
        }
        const y = new Array(1);
        y[0] = this.value(x);
        return y;
    }
}

class OptimizationBasedCostFunction extends CostFunction {
    value(x) {
        return 1.0;
    }
    values(x) {
        const coefficients = Array1D.fromSizeValue(3, 1.0);
        const oneDimensionalPolynomialDegreeN = new OneDimensionalPolynomialDegreeN(coefficients);
        const constraint = new NoConstraint();
        const initialValues = Array1D.fromSizeValue(1, 100.0);
        const problem = new Problem(oneDimensionalPolynomialDegreeN, constraint, initialValues);
        const optimizationMethod = new LevenbergMarquardt();
        const endCriteria = new EndCriteria(1000, 100, 1e-5, 1e-5, 1e-5);
        optimizationMethod.minimize(problem, endCriteria);
        const dummy = Array1D.fromSizeValue(1,0);
        return dummy;
    }
}

var OptimizationMethodType;
(function (OptimizationMethodType) {
    OptimizationMethodType[OptimizationMethodType["simplex"] = 0] = "simplex";
    OptimizationMethodType[OptimizationMethodType["levenbergMarquardt"] = 1] = "levenbergMarquardt";
    OptimizationMethodType[OptimizationMethodType["levenbergMarquardt2"] = 2] = "levenbergMarquardt2";
    OptimizationMethodType[OptimizationMethodType["conjugateGradient"] = 3] = "conjugateGradient";
    OptimizationMethodType[OptimizationMethodType["conjugateGradient_goldstein"] = 4] = "conjugateGradient_goldstein";
    OptimizationMethodType[OptimizationMethodType["steepestDescent"] = 5] = "steepestDescent";
    OptimizationMethodType[OptimizationMethodType["steepestDescent_goldstein"] = 6] = "steepestDescent_goldstein";
    OptimizationMethodType[OptimizationMethodType["bfgs"] = 7] = "bfgs";
    OptimizationMethodType[OptimizationMethodType["bfgs_goldstein"] = 8] = "bfgs_goldstein";
})(OptimizationMethodType || (OptimizationMethodType = {}));

function makeOptimizationMethod(optimizationMethodType, simplexLambda, levenbergMarquardtEpsfcn, levenbergMarquardtXtol, levenbergMarquardtGtol) {
    switch (optimizationMethodType) {
        case OptimizationMethodType.simplex:
            return new Simplex(simplexLambda);
        case OptimizationMethodType.levenbergMarquardt:
            return new LevenbergMarquardt(levenbergMarquardtEpsfcn, levenbergMarquardtXtol, levenbergMarquardtGtol);
        case OptimizationMethodType.levenbergMarquardt2:
            return new LevenbergMarquardt(levenbergMarquardtEpsfcn, levenbergMarquardtXtol, levenbergMarquardtGtol, true);
        case OptimizationMethodType.conjugateGradient:
            return new ConjugateGradient();
        case OptimizationMethodType.steepestDescent:
            return new SteepestDescent();
        case OptimizationMethodType.bfgs:
            return new BFGS();
        case OptimizationMethodType.conjugateGradient_goldstein:
            return new ConjugateGradient(new GoldsteinLineSearch());
        case OptimizationMethodType.steepestDescent_goldstein:
            return new SteepestDescent(new GoldsteinLineSearch());
        case OptimizationMethodType.bfgs_goldstein:
            return new BFGS(new GoldsteinLineSearch());
        default:
            throw new Error('unknown OptimizationMethod type');
    }
}

function makeOptimizationMethods(optimizationMethodTypes, optimizationMethodNb, simplexLambda, levenbergMarquardtEpsfcn, levenbergMarquardtXtol, levenbergMarquardtGtol) {
    const results = [];
    for (let i = 0; i < optimizationMethodNb; ++i) {
        const namedOptimizationMethod = new NamedOptimizationMethod();
        namedOptimizationMethod.optimizationMethod = makeOptimizationMethod(optimizationMethodTypes[i], simplexLambda, levenbergMarquardtEpsfcn, levenbergMarquardtXtol, levenbergMarquardtGtol);
        namedOptimizationMethod.name =
            OptimizationMethodType[optimizationMethodTypes[i]];
        results.push(namedOptimizationMethod);
    }
    return results;
}

function maxDifference(a, b) {
    const diff = Array1D.sub(a, b);
    let maxDiff = 0.0;
    for (let i = 0; i < diff.length; ++i) {
        maxDiff = Math.max(maxDiff, Math.abs(diff[i]));
    }
    return maxDiff;
}

function setup() {
    const a = 1;
    const b = 1;
    const c = 1;
    const coefficients = new Array(3);
    coefficients[0] = c;
    coefficients[1] = b;
    coefficients[2] = a;
    costFunctions_.push(new OneDimensionalPolynomialDegreeN(coefficients));
    constraints_.push(new NoConstraint());
    const initialValue = new Array(1);
    initialValue[0] = -100;
    initialValues_.push(initialValue);
    maxIterations_.push(10000);
    maxStationaryStateIterations_.push(100);
    rootEpsilons_.push(1e-8);
    functionEpsilons_.push(1e-8);
    gradientNormEpsilons_.push(1e-8);
    endCriterias_.push(new EndCriteria(Array1D.back(maxIterations_), Array1D.back(maxStationaryStateIterations_), Array1D.back(rootEpsilons_), Array1D.back(functionEpsilons_), Array1D.back(gradientNormEpsilons_)));
    const optimizationMethodTypes = [
        OptimizationMethodType.simplex,
        OptimizationMethodType.levenbergMarquardt,
        OptimizationMethodType.levenbergMarquardt2,
        OptimizationMethodType.conjugateGradient,
        OptimizationMethodType.conjugateGradient_goldstein,
        OptimizationMethodType.bfgs,
        OptimizationMethodType.bfgs_goldstein,
        OptimizationMethodType.steepestDescent,
        OptimizationMethodType.steepestDescent_goldstein
    ];
    const simplexLambda = 0.1;
    const levenbergMarquardtEpsfcn = 1.0e-8;
    const levenbergMarquardtXtol = 1.0e-8;
    const levenbergMarquardtGtol = 1.0e-8;
    optimizationMethods_.push(makeOptimizationMethods(optimizationMethodTypes, optimizationMethodTypes.length, simplexLambda, levenbergMarquardtEpsfcn, levenbergMarquardtXtol, levenbergMarquardtGtol));
    const xMinExpected = new Array(1);
    xMinExpected[0] = -b /(2.0 * a);
    const yMinExpected = new Array(1);
    yMinExpected[0] = -(b * b - 4.0 * a *c) / (4.0 * a);
    xMinExpected_.push(xMinExpected);
    yMinExpected_.push(yMinExpected);
}

class FirstDeJong extends CostFunction {
    values(x) {
        const retVal = Array1D.fromSizeValue(x.length, this.value(x));
        return retVal;
    }

    value(x) {
        return Array1D.DotProduct(x, x);
    }
}

class SecondDeJong extends CostFunction {
    values(x) {
        const retVal = Array1D.fromSizeValue(x.length, this.value(x));
        return retVal;
    }

    value(x) {
        return 100.0 * (x[0] * x[0] - x[1]) * (x[0] * x[0] - x[1]) +
            (1.0 - x[0]) * (1.0 - x[0]);
    }
}

class ModThirdDeJong extends CostFunction {
    values(x) {
        const retVal = Array1D.fromSizeValue(x.length, this.value(x));
        return retVal;
    }

    value(x) {
        let fx = 0.0;
        for (let i = 0; i < x.length; ++i) {
            fx += Math.floor(x[i]) * Math.floor(x[i]);
        }
        return fx;
    }
}

class ModFourthDeJong extends CostFunction {
    constructor() {
        super();
        this._uniformRng = new MersenneTwisterUniformRng().init1(4711);
    }

    values(x) {
        const retVal = Array1D.fromSizeValue(x.length, this.value(x));
        return retVal;
    }

    value(x) {
        let fx = 0.0;
        for (let i = 0; i < x.length; ++i) {
            fx += (i + 1.0) * Math.pow(x[i], 4.0) + this._uniformRng.nextReal();
        }
        return fx;
    }
}

class Griewangk extends CostFunction {
    values(x) {
        const retVal = Array1D.fromSizeValue(x.length, this.value(x));
        return retVal;
    }

    value(x) {
        let fx = 0.0;
        for (let i = 0; i < x.length; ++i) {
            fx += x[i] * x[i] / 4000.0;
        }
        let p = 1.0;
        for (let i = 0; i < x.length; ++i) {
            p *= Math.cos(x[i] / Math.sqrt(i + 1.0));
        }
        return fx - p + 1.0;
    }
}

describe(`Optimizers tests ${version}`, () => {
    it('Testing optimizers...', () => {
        setup();
        for (let i = 0; i < costFunctions_.length; ++i) {
            const problem = new Problem(costFunctions_[i], constraints_[i], initialValues_[i]);
            const initialValues = problem.currentValue();
            for (let j = 0; j < (optimizationMethods_[i]).length; ++j) {
                let rootEpsilon = endCriterias_[i].rootEpsilon();
                const endCriteriaTests = 1;
                for (let k = 0; k < endCriteriaTests; ++k) {
                    problem.setCurrentValue(initialValues);
                    const endCriteria = new EndCriteria(endCriterias_[i].maxIterations(), endCriterias_[i].maxStationaryStateIterations(), rootEpsilon, endCriterias_[i].functionEpsilon(), endCriterias_[i].gradientNormEpsilon());
                    rootEpsilon *= .1;
                    const endCriteriaResult = optimizationMethods_[i][j].optimizationMethod.minimize(problem, endCriteria);
                    const xMinCalculated = problem.currentValue();
                    const yMinCalculated = problem.values(xMinCalculated);
                    let completed;
                    switch (endCriteriaResult) {
                        case EndCriteria.Type.None:
                        case EndCriteria.Type.MaxIterations:
                        case EndCriteria.Type.Unknown:
                            completed = false;
                            break;
                        default:
                            completed = true;
                    }
                    const xError = maxDifference(xMinCalculated, xMinExpected_[i]);
                    const yError = maxDifference(yMinCalculated, yMinExpected_[i]);
                    const correct = (xError <= endCriteria.rootEpsilon() ||
                        yError <= endCriteria.functionEpsilon());
                    expect(completed).toBeTruthy();
                    expect(correct).toBeTruthy();
                }
            }
        }
    });

    it('Testing nested optimizations...', () => {
        const optimizationBasedCostFunction = new OptimizationBasedCostFunction();
        const constraint = new NoConstraint();
        const initialValues = [0.0];
        const problem = new Problem(optimizationBasedCostFunction, constraint, initialValues);
        const optimizationMethod = new LevenbergMarquardt();
        const endCriteria = new EndCriteria(1000, 100, 1e-5, 1e-5, 1e-5);
        expect(()=>{optimizationMethod.minimize(problem, endCriteria)}).not.toThrow();
    });

    it('Testing differential evolution...', () => {
        const conf = new DifferentialEvolution.Configuration()
            .withStepsizeWeight(0.4)
            .withBounds()
            .withCrossoverProbability(0.35)
            .withPopulationMembers(500)
            .withStrategy(DifferentialEvolution.Strategy.BestMemberWithJitter)
            .withCrossoverType(DifferentialEvolution.CrossoverType.Normal)
            .withAdaptiveCrossover()
            .withSeed(3242);
        const deOptim = new DifferentialEvolution(conf);
        const conf2 = new DifferentialEvolution.Configuration()
            .withStepsizeWeight(1.8)
            .withBounds()
            .withCrossoverProbability(0.9)
            .withPopulationMembers(1000)
            .withStrategy(DifferentialEvolution.Strategy.Rand1SelfadaptiveWithRotation)
            .withCrossoverType(DifferentialEvolution.CrossoverType.Normal)
            .withAdaptiveCrossover()
            .withSeed(3242);
        const deOptim2 = new DifferentialEvolution(conf2);
        const diffEvolOptimisers = [deOptim, deOptim, deOptim, deOptim, deOptim2];
        const costFunctions = [
            new FirstDeJong(), new SecondDeJong(), new ModThirdDeJong(),
            new ModFourthDeJong(), new Griewangk()
        ];
        const constraints = [
            new BoundaryConstraint(-10.0, 10.0), new BoundaryConstraint(-10.0, 10.0),
            new BoundaryConstraint(-10.0, 10.0), new BoundaryConstraint(-10.0, 10.0),
            new BoundaryConstraint(-600.0, 600.0)
        ];
        const initialValues = [
            Array1D.fromSizeValue(3, 5.0), Array1D.fromSizeValue(2, 5.0),
            Array1D.fromSizeValue(5, 5.0), Array1D.fromSizeValue(30, 5.0),
            Array1D.fromSizeValue(10, 100.0)
        ];
        const endCriteria = [
            new EndCriteria(100, 10, 1e-10, 1e-8, QL_NULL_REAL),
            new EndCriteria(100, 10, 1e-10, 1e-8, QL_NULL_REAL),
            new EndCriteria(100, 10, 1e-10, 1e-8, QL_NULL_REAL),
            new EndCriteria(500, 100, 1e-10, 1e-8, QL_NULL_REAL),
            new EndCriteria(1000, 800, 1e-12, 1e-10, QL_NULL_REAL)
        ];
        const minima = [0.0, 0.0, 0.0, 10.9639796558, 0.0];
        for (let i = 0; i < costFunctions.length; ++i) {
            const problem = new Problem(costFunctions[i], constraints[i], initialValues[i]);
            diffEvolOptimisers[i].minimize(problem, endCriteria[i]);
            if (i !== 3) {
                expect(Math.abs(problem.functionValue() - minima[i]))
                    .toBeLessThan(1e-8);
            }
            else {
                expect(problem.functionValue()).toBeLessThan(15);
            }
        }
    });
});