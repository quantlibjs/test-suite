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
import { Actual365Fixed, ActualActual, BusinessDayConvention, CPI, CPIBond, DateExt, DiscountingBondEngine, FlatForward, Handle, IndexManager, Linear, MakeSchedule, Period, PiecewiseZeroInflationCurve, RelinkableHandle, SavedSettings, Settings, SimpleQuote, TimeUnit, UKRPI, UnitedKingdom, ZeroCouponInflationSwapHelper, ZeroInflationTermStructure, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { IndexHistoryCleaner } from '/test-suite/utilities.mjs';

class Datum {
  constructor(date, rate) {
      this.date = date;
      this.rate = rate;
  }
}

function makeHelpers(iiData, N, ii, observationLag, calendar, bdc, dc) {
  const instruments = [];
  for (let i = 0; i < N; i++) {
      const maturity = iiData[i].date;
      const quote = new Handle(new SimpleQuote(iiData[i].rate / 100.0));
      const h = new ZeroCouponInflationSwapHelper().ibhInit(quote, observationLag, maturity, calendar, bdc, dc, ii);
      instruments.push(h);
  }
  return instruments;
}

class CommonVars {
  constructor() {
      this.yTS = new RelinkableHandle();
      this.cpiTS = new RelinkableHandle();
      this.backup = new SavedSettings();
      this.cleaner = new IndexHistoryCleaner();
      this.calendar = new UnitedKingdom();
      this.convention = BusinessDayConvention.ModifiedFollowing;
      const today = DateExt.UTC('25,November,2009');
      this.evaluationDate = this.calendar.adjust(today);
      Settings.evaluationDate.set(this.evaluationDate);
      this.dayCounter = new ActualActual();
      const from = DateExt.UTC('20,July,2007');
      const to = DateExt.UTC('20,November,2009');
      const rpiSchedule = new MakeSchedule()
          .from(from)
          .to(to)
          .withTenor(new Period().init1(1, TimeUnit.Months))
          .withCalendar(new UnitedKingdom())
          .withConvention(BusinessDayConvention.ModifiedFollowing)
          .f();
      const interp = false;
      this.ii = new UKRPI(interp, this.cpiTS);
      const fixData = [
          206.1, 207.3, 208.0, 208.9, 209.7, 210.9, 209.8, 211.4, 212.1,
          214.0, 215.1, 216.8, 216.5, 217.2, 218.4, 217.7, 216, 212.9,
          210.1, 211.4, 211.3, 211.5, 212.8, 213.4, 213.4, 213.4, 214.4
      ];
      for (let i = 0; i < fixData.length; ++i) {
          this.ii.addFixing(rpiSchedule.date(i), fixData[i]);
      }
      this.yTS.linkTo(new FlatForward().ffInit2(this.evaluationDate, 0.05, this.dayCounter));
      this.observationLag = new Period().init1(2, TimeUnit.Months);
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
      const helpers = makeHelpers(zciisData, zciisData.length, this.ii, this.observationLag, this.calendar, this.convention, this.dayCounter);
      const baseZeroRate = zciisData[0].rate / 100.0;
      this.cpiTS.linkTo(new PiecewiseZeroInflationCurve(new Linear())
          .pwzicInit(this.evaluationDate, this.calendar, this.dayCounter, this.observationLag, this.ii.frequency(), this.ii.interpolated(), baseZeroRate, this.yTS, helpers));
  }
  dispose() {
      this.cpiTS.linkTo(new ZeroInflationTermStructure());
      this.backup.dispose();
      this.cleaner.dispose();
  }
}

describe(`CPI bond tests ${version}`, () => {
  it('Testing clean price...', () => {
      IndexManager.clearHistories();
      const common = new CommonVars();
      const notional = 1000000.0;
      const fixedRates = [0.1];
      const fixedDayCount = new Actual365Fixed();
      const fixedPaymentConvention = BusinessDayConvention.ModifiedFollowing;
      const fixedIndex = common.ii;
      const contractObservationLag = new Period().init1(3, TimeUnit.Months);
      const observationInterpolation = CPI.InterpolationType.Flat;
      const settlementDays = 3;
      const growthOnly = true;
      const baseCPI = 206.1;
      const startDate = DateExt.UTC('2,October,2007');
      const endDate = DateExt.UTC('2,October,2052');
      const fixedSchedule = new MakeSchedule()
          .from(startDate)
          .to(endDate)
          .withTenor(new Period().init1(6, TimeUnit.Months))
          .withCalendar(new UnitedKingdom())
          .withConvention(BusinessDayConvention.Unadjusted)
          .backwards()
          .f();
      const bond = new CPIBond(settlementDays, notional, growthOnly, baseCPI, contractObservationLag, fixedIndex, observationInterpolation, fixedSchedule, fixedRates, fixedDayCount, fixedPaymentConvention);
      const engine = new DiscountingBondEngine(common.yTS);
      bond.setPricingEngine(engine);
      const storedPrice = 383.01816406;
      const calculated = bond.cleanPrice1();
      const tolerance = 1.0e-8;
      expect(Math.abs(calculated - storedPrice)).toBeLessThan(tolerance);
      common.dispose();
  });
});
