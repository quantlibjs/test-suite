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
import { AccountingEngine, Array1D, Array2D, BlackCalculator, BusinessDayConvention, CotSwapToFwdAdapter, DateExt, DateGeneration, exponentialCorrelations, FlatVol, Frequency, LMMCurveState, LogNormalFwdRatePc, MultiStepCoterminalSwaptions, MultiStepSwaption, NullCalendar, Option, Period, PlainVanillaPayoff, Schedule, SequenceStatisticsInc, Settings, SimpleDayCounter, SobolBrownianGenerator, SobolBrownianGeneratorFactory, SwapForwardMappings, TimeHomogeneousForwardCorrelation, TimeUnit, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

class MarketModelData {
    constructor() {
        const calendar = new NullCalendar();
        const todaysDate = Settings.evaluationDate.f();
        const endDate = DateExt.advance(todaysDate, 9, TimeUnit.Years);
        const dates = new Schedule().init2(todaysDate, endDate, new Period().init2(Frequency.Semiannual), calendar, BusinessDayConvention.Following, BusinessDayConvention.Following, DateGeneration.Rule.Backward, false);
        this._nbRates = dates.size() - 2;
        this._rateTimes = new Array(this._nbRates + 1);
        this._accruals = new Array(this._nbRates);
        const dayCounter = new SimpleDayCounter();
        for (let i = 1; i < this._nbRates + 2; ++i) {
            this._rateTimes[i - 1] =
                dayCounter.yearFraction(todaysDate, dates.date(i));
        }
        this._displacements = Array1D.fromSizeValue(this._nbRates, .0);
        this._forwards = new Array(this._nbRates);
        this._discountFactors = new Array(this._nbRates + 1);
        this._discountFactors[0] = 1.0;
        for (let i = 0; i < this._nbRates; ++i) {
            this._forwards[i] = 0.03 + 0.0010 * i;
            this._accruals[i] = this._rateTimes[i + 1] - this._rateTimes[i];
            this._discountFactors[i + 1] = this._discountFactors[i] /
                (1 + this._forwards[i] * this._accruals[i]);
        }
        const mktVols = [
            0.15541283, 0.18719678, 0.20890740, 0.22318179, 0.23212717, 0.23731450,
            0.23988649, 0.24066384, 0.24023111, 0.23900189, 0.23726699, 0.23522952,
            0.23303022, 0.23076564, 0.22850101, 0.22627951, 0.22412881, 0.22206569,
            0.22009939
        ];
        this._volatilities = new Array(this._nbRates);
        for (let i = 0; i < this._volatilities.length; ++i) {
            this._volatilities[i] = mktVols[i];
        }
    }
    rateTimes() {
        return this._rateTimes;
    }
    forwards() {
        return this._forwards;
    }
    volatilities() {
        return this._volatilities;
    }
    displacements() {
        return this._displacements;
    }
    discountFactors() {
        return this._discountFactors;
    }
    nbRates() {
        return this._nbRates;
    }
}

function simulate(todaysDiscounts, evolver, product) {
    let paths_;
    paths_ = 32767;
    const initialNumeraire = evolver.numeraires()[0];
    const initialNumeraireValue = todaysDiscounts[initialNumeraire];
    const engine = new AccountingEngine(evolver, product, initialNumeraireValue);
    const stats = new SequenceStatisticsInc(product.numberOfProducts());
    engine.multiplePathValues(stats, paths_);
    return stats;
}

function makeMultiStepCoterminalSwaptions(rateTimes, strike) {
    const paymentTimes = rateTimes.slice(0, rateTimes.length - 1);
    const payoffs = new Array(paymentTimes.length);
    for (let i = 0; i < payoffs.length; ++i) {
        payoffs[i] = new PlainVanillaPayoff(Option.Type.Call, strike);
    }
    return new MultiStepCoterminalSwaptions(rateTimes, paymentTimes, payoffs);
}

describe(`swap-forward mappings tests ${version}`, () => {
    it('Testing forward-rate coinitial-swap Jacobian...', () => {
        const marketData = new MarketModelData();
        const rateTimes = marketData.rateTimes();
        const forwards = marketData.forwards();
        const nbRates = marketData.nbRates();
        const lmmCurveState = new LMMCurveState(rateTimes);
        lmmCurveState.setOnForwardRates(forwards);
        const bumpSize = 1e-8;
        let bumpedForwards = forwards;
        const coinitialJacobian = Array2D.newMatrix(nbRates, nbRates);
        for (let i = 0; i < nbRates; ++i) {
            for (let j = 0; j < nbRates; ++j) {
                bumpedForwards = forwards;
                bumpedForwards[j] += bumpSize;
                lmmCurveState.setOnForwardRates(bumpedForwards);
                const upRate = lmmCurveState.cmSwapRate(0, i + 1);
                bumpedForwards[j] -= 2.0 * bumpSize;
                lmmCurveState.setOnForwardRates(bumpedForwards);
                const downRate = lmmCurveState.cmSwapRate(0, i + 1);
                const deriv = (upRate - downRate) / (2.0 * bumpSize);
                coinitialJacobian[i][j] = deriv;
            }
        }
        const modelJacobian = SwapForwardMappings.coinitialSwapForwardJacobian(lmmCurveState);
        const errorTolerance = 1e-5;
        for (let i = 0; i < nbRates; ++i) {
            for (let j = 0; j < nbRates; ++j) {
                expect(Math.abs(modelJacobian[i][j] - coinitialJacobian[i][j]))
                    .toBeLessThan(errorTolerance);
            }
        }
    });

    it('Testing forward-rate constant-maturity swap Jacobian...', () => {
        const marketData = new MarketModelData();
        const rateTimes = marketData.rateTimes();
        const forwards = marketData.forwards();
        const nbRates = marketData.nbRates();
        const lmmCurveState = new LMMCurveState(rateTimes);
        lmmCurveState.setOnForwardRates(forwards);
        const bumpSize = 1e-8;
        const coinitialJacobian = Array2D.newMatrix(nbRates, nbRates);
        for (let spanningForwards = 0; spanningForwards < nbRates; ++spanningForwards) {
            let bumpedForwards = forwards;
            const cmsJacobian = Array2D.newMatrix(nbRates, nbRates);
            for (let i = 0; i < nbRates; ++i) {
                for (let j = 0; j < nbRates; ++j) {
                    bumpedForwards = forwards;
                    bumpedForwards[j] += bumpSize;
                    lmmCurveState.setOnForwardRates(bumpedForwards);
                    const upRate = lmmCurveState.cmSwapRate(i, spanningForwards);
                    bumpedForwards[j] -= 2.0 * bumpSize;
                    lmmCurveState.setOnForwardRates(bumpedForwards);
                    const downRate = lmmCurveState.cmSwapRate(i, spanningForwards);
                    const deriv = (upRate - downRate) / (2.0 * bumpSize);
                    coinitialJacobian[i][j] = deriv;
                }
            }
            const modelJacobian = SwapForwardMappings.cmSwapForwardJacobian(lmmCurveState, spanningForwards);
            const errorTolerance = 1e-5;
            for (let i = 0; i < nbRates; ++i) {
                for (let j = 0; j < nbRates; ++j) {
                    expect(Math.abs(modelJacobian[i][j] - cmsJacobian[i][j]))
                        .toBeLessThan(errorTolerance);
                }
            }
        }
    });

    it('Testing forward-rate coterminal-swap mappings...', () => {
        const marketData = new MarketModelData();
        const rateTimes = marketData.rateTimes();
        const forwards = marketData.forwards();
        const nbRates = marketData.nbRates();
        const lmmCurveState = new LMMCurveState(rateTimes);
        lmmCurveState.setOnForwardRates(forwards);
        const longTermCorr = 0.5;
        const beta = .2;
        const strike = .03;
        const product = makeMultiStepCoterminalSwaptions(rateTimes, strike);
        const evolution = product.evolution();
        const numberOfFactors = nbRates;
        const displacement = marketData.displacements()[0];
        const correlations = exponentialCorrelations(evolution.rateTimes(), longTermCorr, beta);
        const corr = new TimeHomogeneousForwardCorrelation(correlations, rateTimes);
        const smmMarketModel = new FlatVol(marketData.volatilities(), corr, evolution, numberOfFactors, lmmCurveState.coterminalSwapRates(), marketData.displacements());
        const lmmMarketModel = new CotSwapToFwdAdapter(smmMarketModel);
        const generatorFactory = new SobolBrownianGeneratorFactory(SobolBrownianGenerator.Ordering.Diagonal);
        const numeraires = Array1D.fromSizeValue(nbRates, nbRates);
        const evolver = new LogNormalFwdRatePc(lmmMarketModel, generatorFactory, numeraires);
        const stats = simulate(marketData.discountFactors(), evolver, product);
        const results = stats.mean();
        const todaysDiscounts = marketData.discountFactors();
        const todaysCoterminalSwapRates = lmmCurveState.coterminalSwapRates();
        for (let i = 0; i < nbRates; ++i) {
            const cotSwapsCovariance = smmMarketModel.totalCovariance(i);
            const payoff = new PlainVanillaPayoff(Option.Type.Call, strike + displacement);
            const expectedSwaption = new BlackCalculator()
                .init1(payoff, todaysCoterminalSwapRates[i] + displacement, Math.sqrt(cotSwapsCovariance[i][i]), lmmCurveState.coterminalSwapAnnuity(i, i) *
                todaysDiscounts[i])
                .value();
            expect(Math.abs(expectedSwaption - results[i])).toBeLessThan(0.0001);
        }
    });
    
    it('Testing implied swaption vol in LMM using HW approximation...', () => {
        const marketData = new MarketModelData();
        const rateTimes = marketData.rateTimes();
        const forwards = marketData.forwards();
        const nbRates = marketData.nbRates();
        const lmmCurveState = new LMMCurveState(rateTimes);
        lmmCurveState.setOnForwardRates(forwards);
        const longTermCorr = 0.5;
        const beta = .2;
        const strike = .03;
        for (let startIndex = 1; startIndex + 2 < nbRates; startIndex = startIndex + 5) {
            const endIndex = nbRates - 2;
            const payoff = new PlainVanillaPayoff(Option.Type.Call, strike);
            const product = new MultiStepSwaption(rateTimes, startIndex, endIndex, payoff);
            const evolution = product.evolution();
            const numberOfFactors = nbRates;
            const displacement = marketData.displacements()[0];
            const correlations = exponentialCorrelations(evolution.rateTimes(), longTermCorr, beta);
            const corr = new TimeHomogeneousForwardCorrelation(correlations, rateTimes);
            const lmmMarketModel = new FlatVol(marketData.volatilities(), corr, evolution, numberOfFactors, lmmCurveState.forwardRates(), marketData.displacements());
            const generatorFactory = new SobolBrownianGeneratorFactory(SobolBrownianGenerator.Ordering.Diagonal);
            const numeraires = Array1D.fromSizeValue(nbRates, nbRates);
            const evolver = new LogNormalFwdRatePc(lmmMarketModel, generatorFactory, numeraires);
            const stats = simulate(marketData.discountFactors(), evolver, product);
            const results = stats.mean();
            const errors = stats.errorEstimate();
            const estimatedImpliedVol = SwapForwardMappings.swaptionImpliedVolatility(lmmMarketModel, startIndex, endIndex);
            const swapRate = lmmCurveState.cmSwapRate(startIndex, endIndex - startIndex);
            const swapAnnuity = lmmCurveState.cmSwapAnnuity(startIndex, startIndex, endIndex - startIndex) *
                marketData.discountFactors()[startIndex];
            const payoffDis = new PlainVanillaPayoff(Option.Type.Call, strike + displacement);
            const expectedSwaption = new BlackCalculator()
                .init1(payoffDis, swapRate + displacement, estimatedImpliedVol * Math.sqrt(rateTimes[startIndex]), swapAnnuity)
                .value();
            const error = expectedSwaption - results[0];
            const errorInSds = error / errors[0];
            expect(Math.abs(errorInSds)).toBeLessThan(3.5);
        }
    });
});
