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
import { Actual360, ActualActual, Array1D, Basket, BusinessDayConvention, Compounding, DateExt, EURCurrency, FlatForward, FlatHazardRate, GaussianConstantLossLM, GaussianCopulaPolicy, GaussianLHPLossModel, Handle, HomogGaussPoolLossModel, HomogTPoolLossModel, IHGaussPoolLossModel, IHStudentPoolLossModel, IntegralCDOEngine, Issuer, LatentModelIntegrationType, MakeSchedule, MidPointCDOEngine, NorthAmericaCorpDefaultKey, Period, Pool, Protection, RandomDefaultLM, SavedSettings, Seniority, Settings, SimpleQuote, SyntheticCDO, TARGET, TConstantLossLM, TCopulaPolicy, TimeUnit, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

const hwAttachment = [0.00, 0.03, 0.06, 0.10];
const hwDetachment = [0.03, 0.06, 0.10, 1.00];
class hwDatum {
    constructor(correlation, nm, nz, trancheSpread) {
        this.correlation = correlation;
        this.nm = nm;
        this.nz = nz;
        this.trancheSpread = trancheSpread;
    }
}
const hwData7 = [
    new hwDatum(0.1, -1, -1, [2279, 450, 89, 1]),
    new hwDatum(0.3, -1, -1, [1487, 472, 203, 7]),
    new hwDatum(0.3, -1, 5, [1766, 420, 161, 6]),
    new hwDatum(0.3, 5, -1, [1444, 408, 171, 10]),
    new hwDatum(0.3, 5, 5, [1713, 359, 136, 9])
];
function check(i, j, desc, found, expected, bpTolerance, relativeTolerance) {
    const absDiff = found - expected;
    const relDiff = absDiff / expected;
    expect(Math.abs(relDiff)).toBeLessThan(relativeTolerance);
    expect(Math.abs(absDiff)).toBeLessThan(bpTolerance);
}

describe(`CDO tests ${version}`, () => {
    it('Testing CDO premiums against Hull-White values  for data set ', () => {
        const dataSet = 4;
        const backup = new SavedSettings();
        const poolSize = 100;
        const lambda = 0.01;
        const nBuckets = 200;
        const numSims = 5000;
        const rate = 0.05;
        const daycount = new Actual360();
        const cmp = Compounding.Continuous;
        const recovery = 0.4;
        const nominals = Array1D.fromSizeValue(poolSize, 100.0);
        const premium = 0.02;
        const schedule = new MakeSchedule()
            .from(DateExt.UTC('1,September,2006'))
            .to(DateExt.UTC('1,September,2011'))
            .withTenor(new Period().init1(3, TimeUnit.Months))
            .withCalendar(new TARGET())
            .f();
        const asofDate = DateExt.UTC('31,August,2006');
        Settings.evaluationDate.set(asofDate);
        const yieldPtr = new FlatForward().ffInit2(asofDate, rate, daycount, cmp);
        const yieldHandle = new Handle(yieldPtr);
        const hazardRate = new Handle(new SimpleQuote(lambda));
        const basket = [];
        const ptr = new FlatHazardRate().fhrInit1(asofDate, hazardRate, new ActualActual());
        const pool = new Pool();
        const names = [];
        const issuers = [];
        const probabilities = [];
        probabilities.push([
            new NorthAmericaCorpDefaultKey(new EURCurrency(), Seniority.SeniorSec, new Period().init1(0, TimeUnit.Weeks), 10.),
            new Handle(ptr)
        ]);
        for (let i = 0; i < poolSize; ++i) {
            names.push('issuer-');
            basket.push(new Handle(ptr));
            issuers.push(new Issuer().init1(probabilities));
            pool.add(Array1D.back(names), Array1D.back(issuers), new NorthAmericaCorpDefaultKey(new EURCurrency(), Seniority.SeniorSec, new Period(), 1.));
        }
        const correlation = new SimpleQuote(0.0);
        const hCorrelation = new Handle(correlation);
        const midPCDOEngine = new MidPointCDOEngine(yieldHandle);
        const integralCDOEngine = new IntegralCDOEngine(yieldHandle);
        const i = dataSet;
        correlation.setValue(hwData7[i].correlation);
        const basketModels = [];
        const modelNames = [];
        const relativeToleranceMidp = [], relativeTolerancePeriod = [], absoluteTolerance = [];
        if (hwData7[i].nm === -1 && hwData7[i].nz === -1) {
            const gaussKtLossLM = new GaussianConstantLossLM().cllmInit2(hCorrelation, Array1D.fromSizeValue(poolSize, recovery), LatentModelIntegrationType.GaussianQuadrature, poolSize, null);
            modelNames.push('Inhomogeneous gaussian');
            basketModels.push(new IHGaussPoolLossModel().ihplmInit(gaussKtLossLM, nBuckets, 5., -5, 15));
            absoluteTolerance.push(1.);
            relativeToleranceMidp.push(0.04);
            relativeTolerancePeriod.push(0.04);
            modelNames.push('Homogeneous gaussian');
            basketModels.push(new HomogGaussPoolLossModel().hplmInit(gaussKtLossLM, nBuckets, 5., -5, 15));
            absoluteTolerance.push(1.);
            relativeToleranceMidp.push(0.04);
            relativeTolerancePeriod.push(0.04);
            modelNames.push('Random default gaussian');
            basketModels.push(new RandomDefaultLM(new GaussianCopulaPolicy())
                .init2(gaussKtLossLM, numSims));
            absoluteTolerance.push(1.);
            relativeToleranceMidp.push(0.07);
            relativeTolerancePeriod.push(0.07);
            modelNames.push('Gaussian LHP');
            basketModels.push(new GaussianLHPLossModel().glhpmInit3(hCorrelation, Array1D.fromSizeValue(poolSize, recovery)));
            absoluteTolerance.push(10.);
            relativeToleranceMidp.push(0.5);
            relativeTolerancePeriod.push(0.5);
        }
        else if (hwData7[i].nm > 0 && hwData7[i].nz > 0) {
            const initTG = new TCopulaPolicy.initTraits();
            initTG.tOrders.push(hwData7[i].nm);
            initTG.tOrders.push(hwData7[i].nz);
            const TKtLossLM = new TConstantLossLM().cllmInit2(hCorrelation, Array1D.fromSizeValue(poolSize, recovery), LatentModelIntegrationType.GaussianQuadrature, poolSize, initTG);
            modelNames.push('Inhomogeneous student');
            basketModels.push(new IHStudentPoolLossModel().ihplmInit(TKtLossLM, nBuckets, 5., -5., 15));
            absoluteTolerance.push(1.);
            relativeToleranceMidp.push(0.04);
            relativeTolerancePeriod.push(0.04);
            modelNames.push('Homogeneous student');
            basketModels.push(new HomogTPoolLossModel().hplmInit(TKtLossLM, nBuckets, 5., -5., 15));
            absoluteTolerance.push(1.);
            relativeToleranceMidp.push(0.04);
            relativeTolerancePeriod.push(0.04);
            modelNames.push('Random default studentT');
            basketModels.push(new RandomDefaultLM(new TCopulaPolicy()).rdlmInit2(TKtLossLM, numSims));
            absoluteTolerance.push(1.);
            relativeToleranceMidp.push(0.07);
            relativeTolerancePeriod.push(0.07);
        }
        else if (hwData7[i].nm > 0 && hwData7[i].nz === -1) {
            const initTG = new TCopulaPolicy.initTraits();
            initTG.tOrders.push(hwData7[i].nm);
            initTG.tOrders.push(45);
            const TKtLossLM = new TConstantLossLM().cllmInit2(hCorrelation, Array1D.fromSizeValue(poolSize, recovery), LatentModelIntegrationType.GaussianQuadrature, poolSize, initTG);
            modelNames.push('Inhomogeneous student-gaussian');
            basketModels.push(new IHStudentPoolLossModel().ihplmInit(TKtLossLM, nBuckets, 5., -5., 15));
            absoluteTolerance.push(1.);
            relativeToleranceMidp.push(0.04);
            relativeTolerancePeriod.push(0.04);
            modelNames.push('Homogeneous student-gaussian');
            basketModels.push(new HomogTPoolLossModel().hplmInit(TKtLossLM, nBuckets, 5., -5., 15));
            absoluteTolerance.push(1.);
            relativeToleranceMidp.push(0.04);
            relativeTolerancePeriod.push(0.04);
            modelNames.push('Random default student-gaussian');
            basketModels.push(new RandomDefaultLM(new TCopulaPolicy()).init2(TKtLossLM, numSims));
            absoluteTolerance.push(1.);
            relativeToleranceMidp.push(0.07);
            relativeTolerancePeriod.push(0.07);
        }
        else if (hwData7[i].nm === -1 && hwData7[i].nz > 0) {
            const initTG = new TCopulaPolicy.initTraits();
            initTG.tOrders.push(45);
            initTG.tOrders.push(hwData7[i].nz);
            const TKtLossLM = new TConstantLossLM().cllmInit2(hCorrelation, Array1D.fromSizeValue(poolSize, recovery), LatentModelIntegrationType.GaussianQuadrature, poolSize, initTG);
            modelNames.push('Inhomogeneous gaussian-student');
            basketModels.push(new IHStudentPoolLossModel().ihplmInit(TKtLossLM, nBuckets, 5., -5., 15));
            absoluteTolerance.push(1.);
            relativeToleranceMidp.push(0.04);
            relativeTolerancePeriod.push(0.04);
            modelNames.push('Homogeneous gaussian-student');
            basketModels.push(new HomogTPoolLossModel().hplmInit(TKtLossLM, nBuckets, 5., -5., 15));
            absoluteTolerance.push(1.);
            relativeToleranceMidp.push(0.04);
            relativeTolerancePeriod.push(0.04);
            modelNames.push('Random default gaussian-student');
            basketModels.push(new RandomDefaultLM(new TCopulaPolicy()).init2(TKtLossLM, numSims));
            absoluteTolerance.push(1.);
            relativeToleranceMidp.push(0.07);
            relativeTolerancePeriod.push(0.07);
        }
        else {
            return;
        }
        for (let j = 0; j < hwAttachment.length; j++) {
            const basketPtr = new Basket().init(asofDate, names, nominals, pool, hwAttachment[j], hwDetachment[j]);
            const trancheId = `[${hwAttachment[j]} , ${hwDetachment[j]}]`;
            const cdoe = new SyntheticCDO(basketPtr, Protection.Side.Seller, schedule, 0.0, premium, daycount, BusinessDayConvention.Following);
            for (let im = 0; im < basketModels.length; im++) {
                basketPtr.setLossModel(basketModels[im]);
                cdoe.setPricingEngine(midPCDOEngine);
                check(i, j, modelNames[im] + ' with midp integration on ' + trancheId, cdoe.fairPremium() * 1e4, hwData7[i].trancheSpread[j], absoluteTolerance[im], relativeToleranceMidp[im]);
                cdoe.setPricingEngine(integralCDOEngine);
                check(i, j, modelNames[im] + ' with step integration on ' + trancheId, cdoe.fairPremium() * 1e4, hwData7[i].trancheSpread[j], absoluteTolerance[im], relativeTolerancePeriod[im]);
            }
        }
        backup.dispose();
    });
});
