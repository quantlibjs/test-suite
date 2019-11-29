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
import { Actual365Fixed, ActualActual, BusinessDayConvention, CPI, CPIBond, CPICoupon, CPISwap, DateExt, DayCounter, DiscountingBondEngine, DiscountingSwapEngine, Frequency, GBPLibor, Handle, InterpolatedZeroCurve, Linear, MakeSchedule, Period, PiecewiseZeroInflationCurve, RelinkableHandle, SavedSettings, Schedule, Settings, SimpleQuote, TimeUnit, UKRPI, UnitedKingdom, ZeroCouponInflationSwap, ZeroCouponInflationSwapHelper, ZeroInflationTermStructure, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { IndexHistoryCleaner } from '/test-suite/utilities.mjs';

class Datum {
    constructor(date, rate) {
        this.date = date;
        this.rate = rate;
    }
}

function makeHelpers(U, iiData, N, ii, observationLag, calendar, bdc, dc) {
    const instruments = [];
    for (let i = 0; i < N; i++) {
        const maturity = iiData[i].date;
        const quote = new Handle(new SimpleQuote(iiData[i].rate / 100.0));
        const anInstrument = U.ibhInit(quote, observationLag, maturity, calendar, bdc, dc, ii);
        instruments.push(anInstrument);
    }
    return instruments;
}

class CommonVars {
    constructor() {
        this.nominalTS = new RelinkableHandle();
        this.hcpi = new RelinkableHandle();
        this.backup = new SavedSettings();
        this.cleaner = new IndexHistoryCleaner();
        this.nominals = [1000000];
        this.frequency = Frequency.Annual;
        this.volatility = 0.01;
        this.length = 7;
        this.calendar = new UnitedKingdom();
        this.convention = BusinessDayConvention.ModifiedFollowing;
        const today = DateExt.UTC('25,November,2009');
        this.evaluationDate = this.calendar.adjust(today);
        Settings.evaluationDate.set(this.evaluationDate);
        this.settlementDays = 0;
        this.fixingDays = 0;
        this.settlement =
            this.calendar.advance1(today, this.settlementDays, TimeUnit.Days);
        this.startDate = this.settlement;
        this.dcZCIIS = new ActualActual();
        this.dcNominal = new ActualActual();
        const from = DateExt.UTC('20,July,2007');
        const to = DateExt.UTC('20,November,2009');
        const rpiSchedule = new MakeSchedule()
            .from(from)
            .to(to)
            .withTenor(new Period().init1(1, TimeUnit.Months))
            .withCalendar(new UnitedKingdom())
            .withConvention(BusinessDayConvention.ModifiedFollowing)
            .f();
        const fixData = [
            206.1, 207.3, 208.0, 208.9, 209.7, 210.9, 209.8, 211.4, 212.1, 214.0,
            215.1, 216.8, 216.5, 217.2, 218.4, 217.7, 216, 212.9, 210.1, 211.4,
            211.3, 211.5, 212.8, 213.4, 213.4, 213.4, 214.4, -999.0, -999.0
        ];
        const interp = false;
        this.ii = new UKRPI(interp, this.hcpi);
        for (let i = 0; i < rpiSchedule.size(); i++) {
            this.ii.addFixing(rpiSchedule.date(i), fixData[i], true);
        }
        const nominalData = [
            new Datum(DateExt.UTC('26,November,2009'), 0.475),
            new Datum(DateExt.UTC('2,December,2009'), 0.47498),
            new Datum(DateExt.UTC('29,December,2009'), 0.49988),
            new Datum(DateExt.UTC('25,February,2010'), 0.59955),
            new Datum(DateExt.UTC('18,March,2010'), 0.65361),
            new Datum(DateExt.UTC('25,May,2010'), 0.82830),
            new Datum(DateExt.UTC('16,September,2010'), 0.78960),
            new Datum(DateExt.UTC('16,December,2010'), 0.93762),
            new Datum(DateExt.UTC('17,March,2011'), 1.12037),
            new Datum(DateExt.UTC('16,June,2011'), 1.31308),
            new Datum(DateExt.UTC('22,September,2011'), 1.52011),
            new Datum(DateExt.UTC('25,November,2011'), 1.78399),
            new Datum(DateExt.UTC('26,November,2012'), 2.41170),
            new Datum(DateExt.UTC('25,November,2013'), 2.83935),
            new Datum(DateExt.UTC('25,November,2014'), 3.12888),
            new Datum(DateExt.UTC('25,November,2015'), 3.34298),
            new Datum(DateExt.UTC('25,November,2016'), 3.50632),
            new Datum(DateExt.UTC('27,November,2017'), 3.63666),
            new Datum(DateExt.UTC('26,November,2018'), 3.74723),
            new Datum(DateExt.UTC('25,November,2019'), 3.83988),
            new Datum(DateExt.UTC('25,November,2021'), 4.00508),
            new Datum(DateExt.UTC('25,November,2024'), 4.16042),
            new Datum(DateExt.UTC('26,November,2029'), 4.15577),
            new Datum(DateExt.UTC('27,November,2034'), 4.04933),
            new Datum(DateExt.UTC('25,November,2039'), 3.95217),
            new Datum(DateExt.UTC('25,November,2049'), 3.80932),
            new Datum(DateExt.UTC('25,November,2059'), 3.80849),
            new Datum(DateExt.UTC('25,November,2069'), 3.72677),
            new Datum(DateExt.UTC('27,November,2079'), 3.63082)
        ];
        const nominalDataLength = 30 - 1;
        const nomD = [];
        const nomR = [];
        for (let i = 0; i < nominalDataLength; i++) {
            nomD.push(nominalData[i].date);
            nomR.push(nominalData[i].rate / 100.0);
        }
        const nominal = new InterpolatedZeroCurve(new Linear())
            .curveInit3(nomD, nomR, this.dcNominal);
        this.nominalTS.linkTo(nominal);
        this.observationLag = new Period().init1(2, TimeUnit.Months);
        this.contractObservationLag = new Period().init1(3, TimeUnit.Months);
        this.contractObservationInterpolation = CPI.InterpolationType.Flat;
        const zciisData = [
            new Datum(DateExt.UTC('25,November,2010'), 3.0495),
            new Datum(DateExt.UTC('25,November,2011'), 2.93),
            new Datum(DateExt.UTC('26,November,2012'), 2.9795),
            new Datum(DateExt.UTC('25,November,2013'), 3.029),
            new Datum(DateExt.UTC('25,November,2014'), 3.1425),
            new Datum(DateExt.UTC('25,November,2015'), 3.211),
            new Datum(DateExt.UTC('25,November,2016'), 3.2675),
            new Datum(DateExt.UTC('25,November,2017'), 3.3625),
            new Datum(DateExt.UTC('25,November,2018'), 3.405),
            new Datum(DateExt.UTC('25,November,2019'), 3.48),
            new Datum(DateExt.UTC('25,November,2021'), 3.576),
            new Datum(DateExt.UTC('25,November,2024'), 3.649),
            new Datum(DateExt.UTC('26,November,2029'), 3.751),
            new Datum(DateExt.UTC('27,November,2034'), 3.77225),
            new Datum(DateExt.UTC('25,November,2039'), 3.77),
            new Datum(DateExt.UTC('25,November,2049'), 3.734),
            new Datum(DateExt.UTC('25,November,2059'), 3.714)
        ];
        this.zciisDataLength = 17;
        for (let i = 0; i < this.zciisDataLength; i++) {
            this.zciisD.push(zciisData[i].date);
            this.zciisR.push(zciisData[i].rate);
        }
        const helpers = makeHelpers(new ZeroCouponInflationSwapHelper(), zciisData, this.zciisDataLength, this.ii, this.observationLag, this.calendar, this.convention, this.dcZCIIS);
        const baseZeroRate = zciisData[0].rate / 100.0;
        const pCPIts = new PiecewiseZeroInflationCurve(new Linear())
            .pwzicInit(this.evaluationDate, this.calendar, this.dcZCIIS, this.observationLag, this.ii.frequency(), this.ii.interpolated(), baseZeroRate, this.nominalTS, helpers);
        pCPIts.recalculate();
        this.cpiTS = pCPIts;
        this.hcpi.linkTo(pCPIts);
    }
    dispose() {
        this.backup.dispose();
        this.cleaner.dispose();
    }
}

describe(`CPISwap tests ${version}`, () => {
  it('Testing consistency...', () => {
      const common = new CommonVars();
      const type = CPISwap.Type.Payer;
      const nominal = 1000000.0;
      const subtractInflationNominal = true;
      const spread = 0.0;
      const floatDayCount = new Actual365Fixed();
      const floatPaymentConvention = BusinessDayConvention.ModifiedFollowing;
      const fixingDays = 0;
      const floatIndex = new GBPLibor(new Period().init1(6, TimeUnit.Months), common.nominalTS);
      const fixedRate = 0.1;
      const baseCPI = 206.1;
      const fixedDayCount = new Actual365Fixed();
      const fixedPaymentConvention = BusinessDayConvention.ModifiedFollowing;
      const fixedIndex = common.ii;
      const contractObservationLag = common.contractObservationLag;
      const observationInterpolation = common.contractObservationInterpolation;
      const startDate = DateExt.UTC('2,October,2007');
      const endDate = DateExt.UTC('2,October,2052');
      const floatSchedule = new MakeSchedule()
          .from(startDate)
          .to(endDate)
          .withTenor(new Period().init1(6, TimeUnit.Months))
          .withCalendar(new UnitedKingdom())
          .withConvention(floatPaymentConvention)
          .backwards()
          .f();
      const fixedSchedule = new MakeSchedule()
          .from(startDate)
          .to(endDate)
          .withTenor(new Period().init1(6, TimeUnit.Months))
          .withCalendar(new UnitedKingdom())
          .withConvention(BusinessDayConvention.Unadjusted)
          .backwards()
          .f();
      const zisV = new CPISwap(type, nominal, subtractInflationNominal, spread, floatDayCount, floatSchedule, floatPaymentConvention, fixingDays, floatIndex, fixedRate, baseCPI, fixedDayCount, fixedSchedule, fixedPaymentConvention, contractObservationLag, fixedIndex, observationInterpolation);
      const asofDate = Settings.evaluationDate.f();
      const floatFix = [0.06255, 0.05975, 0.0637, 0.018425, 0.0073438, -1, -1];
      const cpiFix = [211.4, 217.2, 211.4, 213.4, -2, -2];
      for (let i = 0; i < floatSchedule.size(); i++) {
          if (floatSchedule.date(i) < common.evaluationDate) {
              floatIndex.addFixing(floatSchedule.date(i), floatFix[i], true);
          }
          let zic = zisV.cpiLeg()[i];
          if (!(zic instanceof CPICoupon)) {
              zic = null;
          }
          if (zic) {
              if (zic.fixingDate().valueOf() <
                  DateExt.advance(common.evaluationDate, -1, TimeUnit.Months)
                      .valueOf()) {
                  fixedIndex.addFixing(zic.fixingDate(), cpiFix[i], true);
              }
          }
      }
      const dse = new DiscountingSwapEngine(common.nominalTS);
      zisV.setPricingEngine(dse);
      let testInfLegNPV = 0.0;
      for (let i = 0; i < zisV.leg(0).length; i++) {
          const zicPayDate = (zisV.leg(0))[i].date();
          if (zicPayDate > asofDate) {
              testInfLegNPV += (zisV.leg(0))[i].amount1() *
                  common.nominalTS.currentLink().discount1(zicPayDate);
          }
          let zicV = zisV.cpiLeg()[i];
          if (!(zicV instanceof CPICoupon)) {
              zicV = null;
          }
          if (zicV) {
              const diff = Math.abs(zicV.rate() - (fixedRate * (zicV.indexFixing() / baseCPI)));
              expect(diff).toBeLessThan(1e-8);
          }
      }
      const error = Math.abs(testInfLegNPV - zisV.legNPV(0));
      expect(error).toBeLessThan(1e-5);
      const diff = Math.abs(1 - zisV.NPV() / 4191660.0);
      let max_diff;
      if (Settings.QL_USE_INDEXED_COUPON) {
          max_diff = 1e-5;
      }
      else {
          max_diff = 3e-5;
      }
      expect(diff).toBeLessThan(max_diff);
      common.hcpi.linkTo(new ZeroInflationTermStructure());
      common.dispose();
  });

  it('Testing zciis consistency...', () => {
      const common = new CommonVars();
      const ztype = ZeroCouponInflationSwap.Type.Payer;
      const nominal = 1000000.0;
      const startDate = common.evaluationDate;
      const endDate = DateExt.UTC('25,November,2059');
      const cal = new UnitedKingdom();
      const paymentConvention = BusinessDayConvention.ModifiedFollowing;
      const dummyDC = new DayCounter();
      const dc = new ActualActual();
      const observationLag = new Period().init1(2, TimeUnit.Months);
      const quote = 0.03714;
      const zciis = new ZeroCouponInflationSwap(ztype, nominal, startDate, endDate, cal, paymentConvention, dc, quote, common.ii, observationLag);
      const dse = new DiscountingSwapEngine(common.nominalTS);
      zciis.setPricingEngine(dse);
      expect(Math.abs(zciis.NPV())).toBeLessThan(1e-3);
      const oneDate = [];
      oneDate.push(endDate);
      const schOneDate = new Schedule().init1(oneDate, cal, paymentConvention);
      const stype = CPISwap.Type.Payer;
      const inflationNominal = nominal;
      const floatNominal = inflationNominal * Math.pow(1.0 + quote, 50);
      const subtractInflationNominal = true;
      const dummySpread = 0.0, dummyFixedRate = 0.0;
      const fixingDays = 0;
      const baseDate = DateExt.subPeriod(startDate, observationLag);
      const baseCPI = common.ii.fixing(baseDate);
      const dummyFloatIndex = null;
      const cS = new CPISwap(stype, floatNominal, subtractInflationNominal, dummySpread, dummyDC, schOneDate, paymentConvention, fixingDays, dummyFloatIndex, dummyFixedRate, baseCPI, dummyDC, schOneDate, paymentConvention, observationLag, common.ii, CPI.InterpolationType.AsIndex, inflationNominal);
      cS.setPricingEngine(dse);
      expect(Math.abs(cS.NPV())).toBeLessThan(1e-3);
      for (let i = 0; i < 2; i++) {
          expect(Math.abs(cS.legNPV(i) - zciis.legNPV(i))).toBeLessThan(1e-3);
      }
      common.hcpi.linkTo(new ZeroInflationTermStructure());
      common.dispose();
  });

  it('Testing cpi bond consistency...', () => {
      const common = new CommonVars();
      const type = CPISwap.Type.Payer;
      const nominal = 1000000.0;
      const subtractInflationNominal = true;
      const spread = 0.0;
      const floatDayCount = new Actual365Fixed();
      const floatPaymentConvention = BusinessDayConvention.ModifiedFollowing;
      const fixingDays = 0;
      const floatIndex = new GBPLibor(new Period().init1(6, TimeUnit.Months), common.nominalTS);
      const fixedRate = 0.1;
      const baseCPI = 206.1;
      const fixedDayCount = new Actual365Fixed();
      const fixedPaymentConvention = BusinessDayConvention.ModifiedFollowing;
      const fixedIndex = common.ii;
      const contractObservationLag = common.contractObservationLag;
      const observationInterpolation = common.contractObservationInterpolation;
      const startDate = DateExt.UTC('2,October,2007');
      const endDate = DateExt.UTC('2,October,2052');
      const floatSchedule = new MakeSchedule()
          .from(startDate)
          .to(endDate)
          .withTenor(new Period().init1(6, TimeUnit.Months))
          .withCalendar(new UnitedKingdom())
          .withConvention(floatPaymentConvention)
          .backwards()
          .f();
      const fixedSchedule = new MakeSchedule()
          .from(startDate)
          .to(endDate)
          .withTenor(new Period().init1(6, TimeUnit.Months))
          .withCalendar(new UnitedKingdom())
          .withConvention(BusinessDayConvention.Unadjusted)
          .backwards()
          .f();
      const zisV = new CPISwap(type, nominal, subtractInflationNominal, spread, floatDayCount, floatSchedule, floatPaymentConvention, fixingDays, floatIndex, fixedRate, baseCPI, fixedDayCount, fixedSchedule, fixedPaymentConvention, contractObservationLag, fixedIndex, observationInterpolation);
      const floatFix = [0.06255, 0.05975, 0.0637, 0.018425, 0.0073438, -1, -1];
      const cpiFix = [211.4, 217.2, 211.4, 213.4, -2, -2];
      for (let i = 0; i < floatSchedule.size(); i++) {
          if (floatSchedule.date(i).valueOf() < common.evaluationDate.valueOf()) {
              floatIndex.addFixing(floatSchedule.date(i), floatFix[i], true);
          }
          let zic = zisV.cpiLeg()[i];
          if (!(zic instanceof CPICoupon)) {
              zic = null;
          }
          if (zic) {
              if (zic.fixingDate().valueOf() <
                  DateExt.advance(common.evaluationDate, -1, TimeUnit.Months)
                      .valueOf()) {
                  fixedIndex.addFixing(zic.fixingDate(), cpiFix[i], true);
              }
          }
      }
      const dse = new DiscountingSwapEngine(common.nominalTS);
      zisV.setPricingEngine(dse);
      const fixedRates = [fixedRate];
      const settlementDays = 1;
      const growthOnly = true;
      const cpiB = new CPIBond(settlementDays, nominal, growthOnly, baseCPI, contractObservationLag, fixedIndex, observationInterpolation, fixedSchedule, fixedRates, fixedDayCount, fixedPaymentConvention);
      const dbe = new DiscountingBondEngine(common.nominalTS);
      cpiB.setPricingEngine(dbe);
      expect(Math.abs(cpiB.NPV() - zisV.legNPV(0))).toBeLessThan(1e-5);
      common.hcpi.linkTo(new ZeroInflationTermStructure());
      common.dispose();
  });
});
