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
import { Actual360, Array1D, BusinessDayConvention, DateExt, DiscountingSwapEngine, EUHICP, FlatForward, Frequency, Handle, Index, IndexedCashFlow, inflationPeriod, Linear, MakeSchedule, Month, MultiplicativePriceSeasonality, NullCalendar, Period, PiecewiseYoYInflationCurve, PiecewiseZeroInflationCurve, RelinkableHandle, SavedSettings, Settings, SimpleQuote, Thirty360, TimeUnit, UKRPI, UnitedKingdom, YearOnYearInflationSwap, YearOnYearInflationSwapHelper, YoYInflationTermStructure, YYEUHICP, YYEUHICPr, YYUKRPI, YYUKRPIr, ZeroCouponInflationSwap, ZeroCouponInflationSwapHelper, ZeroInflationIndex, ZeroInflationTermStructure, first, second, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { IndexHistoryCleaner } from '/test-suite/utilities.mjs';

class Datum {
  constructor(date, rate) {
      this.date = date;
      this.rate = rate;
  }
}

function nominalTermStructure() {
  const evaluationDate = DateExt.UTC('13,August,2007');
  return new FlatForward().ffInit2(evaluationDate, 0.05, new Actual360());
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

function checkSeasonality(hz, ii) {
  if (hz.currentLink().hasSeasonality()) {
      throw new Error('We require that the initially passed in term structure ' +
          'does not have seasonality');
  }
  const tolerance = 1e-12;
  const trueBaseDate = inflationPeriod(hz.currentLink().baseDate(), ii.frequency())[second];
  const seasonalityBaseDate = new Date(Date.UTC(DateExt.year(trueBaseDate), Month.January - 1, 31));
  const seasonalityFactors = Array1D.fromSizeValue(12, 1.0);
  const unitSeasonality = new MultiplicativePriceSeasonality(seasonalityBaseDate, Frequency.Monthly, seasonalityFactors);
  seasonalityFactors[0] = 1.003245;
  seasonalityFactors[1] = 1.000000;
  seasonalityFactors[2] = 0.999715;
  seasonalityFactors[3] = 1.000495;
  seasonalityFactors[4] = 1.000929;
  seasonalityFactors[5] = 0.998687;
  seasonalityFactors[6] = 0.995949;
  seasonalityFactors[7] = 0.994682;
  seasonalityFactors[8] = 0.995949;
  seasonalityFactors[9] = 1.000519;
  seasonalityFactors[10] = 1.003705;
  seasonalityFactors[11] = 1.004186;
  const nonUnitSeasonality = new MultiplicativePriceSeasonality(seasonalityBaseDate, Frequency.Monthly, seasonalityFactors);
  const fixingDates = new Array(12);
  const anchorDate = DateExt.UTC('14,January,2013');
  for (let i = 0; i < fixingDates.length; ++i) {
      fixingDates[i] = DateExt.advance(anchorDate, i, TimeUnit.Months);
  }
  const noSeasonalityFixings = Array1D.fromSizeValue(12, 1.0);
  for (let i = 0; i < fixingDates.length; ++i) {
      noSeasonalityFixings[i] = ii.fixing(fixingDates[i], true);
  }
  hz.currentLink().setSeasonality(unitSeasonality);
  const unitSeasonalityFixings = Array1D.fromSizeValue(12, 1.0);
  for (let i = 0; i < fixingDates.length; ++i) {
      unitSeasonalityFixings[i] = ii.fixing(fixingDates[i], true);
  }
  for (let i = 0; i < fixingDates.length; i++) {
      expect(Math.abs(noSeasonalityFixings[i] - unitSeasonalityFixings[i]))
          .toBeLessThan(tolerance);
  }
  const baseCpiMonth = DateExt.month(hz.currentLink().baseDate());
  const baseCpiIndex = baseCpiMonth - 1;
  const baseSeasonality = seasonalityFactors[baseCpiIndex];
  const expectedSeasonalityFixings = Array1D.fromSizeValue(12, 1.0);
  for (let i = 0; i < expectedSeasonalityFixings.length; ++i) {
      expectedSeasonalityFixings[i] = ii.fixing(fixingDates[i], true) *
          seasonalityFactors[i] / baseSeasonality;
  }
  hz.currentLink().setSeasonality(nonUnitSeasonality);
  const nonUnitSeasonalityFixings = Array1D.fromSizeValue(12, 1.0);
  for (let i = 0; i < fixingDates.length; ++i) {
      nonUnitSeasonalityFixings[i] = ii.fixing(fixingDates[i], true);
  }
  for (let i = 0; i < fixingDates.length; i++) {
      expect(Math.abs(expectedSeasonalityFixings[i] - nonUnitSeasonalityFixings[i]))
          .toBeLessThan(tolerance);
  }
  hz.currentLink().setSeasonality();
  const unsetSeasonalityFixings = Array1D.fromSizeValue(12, 1.0);
  for (let i = 0; i < fixingDates.length; ++i) {
      unsetSeasonalityFixings[i] = ii.fixing(fixingDates[i], true);
  }
  for (let i = 0; i < fixingDates.length; i++) {
      expect(Math.abs(noSeasonalityFixings[i] - unsetSeasonalityFixings[i]))
          .toBeLessThanOrEqual(tolerance);
  }
}

describe(`Inflation tests ${version}`, () => {
    it('Testing zero inflation indices...', () => {
        const backup = new SavedSettings();
        const cleaner = new IndexHistoryCleaner();
        const euhicp = new EUHICP(true);
        expect(euhicp.name()).toEqual('EU HICP');
        expect(euhicp.frequency()).toEqual(Frequency.Monthly);
        expect(euhicp.revised()).toBeFalsy();
        expect(euhicp.interpolated()).toBeTruthy();
        expect(Period.equal(euhicp.availabilityLag(), new Period().init1(1, TimeUnit.Months)))
            .toBeTruthy();
        const ukrpi = new UKRPI(false);
        expect(ukrpi.name()).toEqual('UK RPI');
        expect(ukrpi.frequency()).toEqual(Frequency.Monthly);
        expect(ukrpi.revised()).toBeFalsy();
        expect(ukrpi.interpolated()).toBeFalsy();
        expect(Period.equal(ukrpi.availabilityLag(), new Period().init1(1, TimeUnit.Months)))
            .toBeTruthy();
        let evaluationDate = DateExt.UTC('13,August,2007');
        evaluationDate = new UnitedKingdom().adjust(evaluationDate);
        Settings.evaluationDate.set(evaluationDate);
        const from = DateExt.UTC('1,January,2005');
        const to = DateExt.UTC('13,August,2007');
        const rpiSchedule = new MakeSchedule()
            .from(from)
            .to(to)
            .withTenor(new Period().init1(1, TimeUnit.Months))
            .withCalendar(new UnitedKingdom())
            .withConvention(BusinessDayConvention.ModifiedFollowing)
            .f();
        const fixData = [
            189.9, 189.9, 189.6, 190.5, 191.6, 192.0, 192.2, 192.2,
            192.6, 193.1, 193.3, 193.6, 194.1, 193.4, 194.2, 195.0,
            196.5, 197.7, 198.5, 198.5, 199.2, 200.1, 200.4, 201.1,
            202.7, 201.6, 203.1, 204.4, 205.4, 206.2, 207.3, 206.1
        ];
        const interp = false;
        const iir = new UKRPI(interp);
        for (let i = 0; i < fixData.length; i++) {
            iir.addFixing(rpiSchedule.date(i), fixData[i]);
        }
        let todayMinusLag = DateExt.subPeriod(evaluationDate, iir.availabilityLag());
        const lim = inflationPeriod(todayMinusLag, iir.frequency());
        todayMinusLag = lim[first];
        const eps = 1.0e-8;
        for (let i = 0; i < rpiSchedule.size() - 1; i++) {
            const lim = inflationPeriod(rpiSchedule.date(i), iir.frequency());
            for (let d = lim[first]; d.valueOf() <= lim[second].valueOf(); d = DateExt.add(d, 1)) {
                if (d < inflationPeriod(todayMinusLag, iir.frequency())[first]) {
                    expect(Math.abs(iir.fixing(d) - fixData[i])).toBeLessThan(eps);
                }
            }
        }
        backup.dispose();
        cleaner.dispose();
    });

    it('Testing zero inflation term structure...', () => {
        const backup = new SavedSettings();
        const cleaner = new IndexHistoryCleaner();
        const calendar = new UnitedKingdom();
        const bdc = BusinessDayConvention.ModifiedFollowing;
        let evaluationDate = DateExt.UTC('13,August,2007');
        evaluationDate = calendar.adjust(evaluationDate);
        Settings.evaluationDate.set(evaluationDate);
        let from = DateExt.UTC('1,January,2005');
        let to = DateExt.UTC('13,August,2007');
        const rpiSchedule = new MakeSchedule()
            .from(from)
            .to(to)
            .withTenor(new Period().init1(1, TimeUnit.Months))
            .withCalendar(new UnitedKingdom())
            .withConvention(BusinessDayConvention.ModifiedFollowing)
            .f();
        const fixData = [
            189.9, 189.9, 189.6, 190.5, 191.6, 192.0, 192.2, 192.2,
            192.6, 193.1, 193.3, 193.6, 194.1, 193.4, 194.2, 195.0,
            196.5, 197.7, 198.5, 198.5, 199.2, 200.1, 200.4, 201.1,
            202.7, 201.6, 203.1, 204.4, 205.4, 206.2, 207.3
        ];
        const hz = new RelinkableHandle();
        const interp = false;
        const iiUKRPI = new UKRPI(interp, hz);
        for (let i = 0; i < fixData.length; i++) {
            iiUKRPI.addFixing(rpiSchedule.date(i), fixData[i]);
        }
        const ii = iiUKRPI;
        const nominalTS = nominalTermStructure();
        const zcData = [
            new Datum(DateExt.UTC('13,August,2008'), 2.93),
            new Datum(DateExt.UTC('13,August,2009'), 2.95),
            new Datum(DateExt.UTC('13,August,2010'), 2.965),
            new Datum(DateExt.UTC('15,August,2011'), 2.98),
            new Datum(DateExt.UTC('13,August,2012'), 3.0),
            new Datum(DateExt.UTC('13,August,2014'), 3.06),
            new Datum(DateExt.UTC('13,August,2017'), 3.175),
            new Datum(DateExt.UTC('13,August,2019'), 3.243),
            new Datum(DateExt.UTC('15,August,2022'), 3.293),
            new Datum(DateExt.UTC('14,August,2027'), 3.338),
            new Datum(DateExt.UTC('13,August,2032'), 3.348),
            new Datum(DateExt.UTC('15,August,2037'), 3.348),
            new Datum(DateExt.UTC('13,August,2047'), 3.308),
            new Datum(DateExt.UTC('13,August,2057'), 3.228)
        ];
        const observationLag = new Period().init1(2, TimeUnit.Months);
        const dc = new Thirty360();
        const frequency = Frequency.Monthly;
        const helpers = makeHelpers(new ZeroCouponInflationSwapHelper(), zcData, zcData.length, ii, observationLag, calendar, bdc, dc);
        const baseZeroRate = zcData[0].rate / 100.0;
        const pZITS = new PiecewiseZeroInflationCurve(new Linear())
            .pwzicInit(evaluationDate, calendar, dc, observationLag, frequency, ii.interpolated(), baseZeroRate, new Handle(nominalTS), helpers);
        pZITS.recalculate();
        const eps = 0.00000001;
        let forceLinearInterpolation = false;
        for (let i = 0; i < zcData.length; i++) {
            expect(Math.abs(zcData[i].rate / 100.0 -
                pZITS.zeroRate1(zcData[i].date, observationLag, forceLinearInterpolation)))
                .toBeLessThan(eps);
            expect(Math.abs(helpers[i].impliedQuote() - zcData[i].rate / 100.0))
                .toBeLessThan(eps);
        }
        hz.linkTo(pZITS);
        from = hz.currentLink().baseDate();
        to = DateExt.advance(hz.currentLink().maxDate(), -1, TimeUnit.Months);
        let testIndex = new MakeSchedule()
            .from(from)
            .to(to)
            .withTenor(new Period().init1(1, TimeUnit.Months))
            .withCalendar(new UnitedKingdom())
            .withConvention(BusinessDayConvention.ModifiedFollowing)
            .f();
        let bd = hz.currentLink().baseDate();
        let bf = ii.fixing(bd);
        for (let i = 0; i < testIndex.size(); i++) {
            const d = testIndex.date(i);
            const z = hz.currentLink().zeroRate1(d, new Period().init1(0, TimeUnit.Days));
            let t = hz.currentLink().dayCounter().yearFraction(bd, d);
            if (!ii.interpolated()) {
                t = hz.currentLink().dayCounter().yearFraction(bd, inflationPeriod(d, ii.frequency())[first]);
            }
            let calc = bf * Math.pow(1 + z, t);
            if (t <= 0) {
                calc = ii.fixing(d, false);
            }
            expect(Math.abs(calc - ii.fixing(d, true)) / 10000.0).toBeLessThan(eps);
        }
        const baseDate = DateExt.UTC('1,January,2006');
        const fixDate = DateExt.UTC('1,August,2014');
        const payDate = new UnitedKingdom().adjust(DateExt.advance(fixDate, 3, TimeUnit.Months), BusinessDayConvention.ModifiedFollowing);
        let ind = ii;
        if (!(ind instanceof Index)) {
            ind = null;
        }
        if (ind == null) {
            throw new Error('dynamic_pointer_cast to Index from InflationIndex failed');
        }
        const notional = 1000000.0;
        const iicf = new IndexedCashFlow(notional, ind, baseDate, fixDate, payDate);
        const correctIndexed = ii.fixing(iicf.fixingDate()) / ii.fixing(iicf.baseDate());
        const calculatedIndexed = iicf.amount1() / iicf.notional();
        expect(Math.abs(correctIndexed - calculatedIndexed)).toBeLessThan(eps);
        let zii = ii;
        if (!(zii instanceof ZeroInflationIndex)) {
            zii = null;
        }
        if (zii == null) {
            throw new Error('dynamic_pointer_cast to ZeroInflationIndex from UKRPI failed');
        }
        const nzcis = new ZeroCouponInflationSwap(ZeroCouponInflationSwap.Type.Payer, 1000000.0, evaluationDate, zcData[6].date, calendar, bdc, dc, zcData[6].rate / 100.0, zii, observationLag);
        const hTS = new Handle(nominalTS);
        const sppe = new DiscountingSwapEngine(hTS);
        nzcis.setPricingEngine(sppe);
        expect(Math.abs(nzcis.NPV())).toBeLessThan(0.00001);
        checkSeasonality(hz, ii);
        const interpYES = true;
        const iiUKRPIyes = new UKRPI(interpYES, hz);
        for (let i = 0; i < fixData.length; i++) {
            iiUKRPIyes.addFixing(rpiSchedule.date(i), fixData[i]);
        }
        const iiyes = iiUKRPIyes;
        const observationLagyes = new Period().init1(3, TimeUnit.Months);
        const helpersyes = makeHelpers(new ZeroCouponInflationSwapHelper(), zcData, zcData.length, iiyes, observationLagyes, calendar, bdc, dc);
        const pZITSyes = new PiecewiseZeroInflationCurve(new Linear())
            .pwzicInit(evaluationDate, calendar, dc, observationLagyes, frequency, iiyes.interpolated(), baseZeroRate, new Handle(nominalTS), helpersyes);
        pZITSyes.recalculate();
        forceLinearInterpolation = false;
        for (let i = 0; i < zcData.length; i++) {
            expect(Math.abs(zcData[i].rate / 100.0 -
                pZITSyes.zeroRate1(zcData[i].date, observationLagyes, forceLinearInterpolation)))
                .toBeLessThan(eps);
            expect(Math.abs(helpersyes[i].impliedQuote() - zcData[i].rate / 100.0))
                .toBeLessThan(eps);
        }
        hz.linkTo(pZITSyes);
        from = DateExt.advance(hz.currentLink().baseDate(), 1, TimeUnit.Months);
        to = DateExt.advance(hz.currentLink().maxDate(), -1, TimeUnit.Months);
        testIndex = new MakeSchedule()
            .from(from)
            .to(to)
            .withTenor(new Period().init1(1, TimeUnit.Months))
            .withCalendar(new UnitedKingdom())
            .withConvention(BusinessDayConvention.ModifiedFollowing)
            .f();
        bd = hz.currentLink().baseDate();
        bf = iiyes.fixing(bd);
        for (let i = 0; i < testIndex.size(); i++) {
            const d = testIndex.date(i);
            const z = hz.currentLink().zeroRate1(d, new Period().init1(0, TimeUnit.Days));
            const t = hz.currentLink().dayCounter().yearFraction(bd, d);
            let calc = bf * Math.pow(1 + z, t);
            if (t <= 0) {
                calc = iiyes.fixing(d);
            }
            expect(Math.abs(calc - iiyes.fixing(d))).toBeLessThan(eps);
        }
        let ziiyes = iiyes;
        if (!(ziiyes instanceof ZeroInflationIndex)) {
            ziiyes = null;
        }
        if (ziiyes == null) {
            throw new Error('dynamic_pointer_cast to ZeroInflationIndex from UKRPI-I failed');
        }
        const nzcisyes = new ZeroCouponInflationSwap(ZeroCouponInflationSwap.Type.Payer, 1000000.0, evaluationDate, zcData[6].date, calendar, bdc, dc, zcData[6].rate / 100.0, ziiyes, observationLagyes);
        nzcisyes.setPricingEngine(sppe);
        expect(Math.abs(nzcisyes.NPV())).toBeLessThan(0.00001);
        checkSeasonality(hz, iiyes);
        hz.linkTo(new ZeroInflationTermStructure());
        backup.dispose();
        cleaner.dispose();
    });

    it('Testing that zero inflation indices forecast future fixings...', () => {
        const backup = new SavedSettings();
        const cleaner = new IndexHistoryCleaner();
        const euhicp = new EUHICP(false);
        const sample_date = DateExt.UTC('1,December,2013');
        const sample_fixing = 117.48;
        euhicp.addFixing(sample_date, sample_fixing);
        let evaluationDate = euhicp.fixingCalendar().adjust(DateExt.advance(sample_date, 2, TimeUnit.Weeks));
        Settings.evaluationDate.set(evaluationDate);
        let fixing = euhicp.fixing(sample_date);
        expect(Math.abs(fixing - sample_fixing)).toBeLessThan(1e-12);
        evaluationDate = euhicp.fixingCalendar().adjust(DateExt.advance(sample_date, -2, TimeUnit.Weeks));
        Settings.evaluationDate.set(evaluationDate);
        let retrieved = false;
        try {
            fixing = euhicp.fixing(sample_date);
            retrieved = true;
        }
        catch (e) {
        }
        expect(retrieved).toBeFalsy();
        backup.dispose();
        cleaner.dispose();
    });

    it('Testing year-on-year inflation indices...', () => {
        const backup = new SavedSettings();
        const cleaner = new IndexHistoryCleaner();
        const yyeuhicp = new YYEUHICP(true);
        expect(yyeuhicp.name()).toEqual('EU YY_HICP');
        expect(yyeuhicp.frequency()).toEqual(Frequency.Monthly);
        expect(yyeuhicp.revised()).toBeFalsy();
        expect(yyeuhicp.interpolated()).toBeTruthy();
        expect(yyeuhicp.ratio()).toBeFalsy();
        expect(Period.equal(yyeuhicp.availabilityLag(), new Period().init1(1, TimeUnit.Months)))
            .toBeTruthy();
        const yyeuhicpr = new YYEUHICPr(true);
        expect(yyeuhicpr.name()).toEqual('EU YYR_HICP');
        expect(yyeuhicpr.frequency()).toEqual(Frequency.Monthly);
        expect(yyeuhicpr.revised()).toBeFalsy();
        expect(yyeuhicpr.interpolated()).toBeTruthy();
        expect(yyeuhicpr.ratio()).toBeTruthy();
        expect(Period.equal(yyeuhicpr.availabilityLag(), new Period().init1(1, TimeUnit.Months)))
            .toBeTruthy();
        const yyukrpi = new YYUKRPI(false);
        expect(yyukrpi.name()).toEqual('UK YY_RPI');
        expect(yyukrpi.frequency()).toEqual(Frequency.Monthly);
        expect(yyukrpi.revised()).toBeFalsy();
        expect(yyukrpi.interpolated()).toBeFalsy();
        expect(yyukrpi.ratio()).toBeFalsy();
        expect(Period.equal(yyukrpi.availabilityLag(), new Period().init1(1, TimeUnit.Months)))
            .toBeTruthy();
        const yyukrpir = new YYUKRPIr(false);
        expect(yyukrpir.name()).toEqual('UK YYR_RPI');
        expect(yyukrpir.frequency()).toEqual(Frequency.Monthly);
        expect(yyukrpir.revised()).toBeFalsy();
        expect(yyukrpir.interpolated()).toBeFalsy();
        expect(yyukrpir.ratio()).toBeTruthy();
        expect(Period.equal(yyukrpir.availabilityLag(), new Period().init1(1, TimeUnit.Months)))
            .toBeTruthy();
        let evaluationDate = DateExt.UTC('13,August,2007');
        evaluationDate = new UnitedKingdom().adjust(evaluationDate);
        Settings.evaluationDate.set(evaluationDate);
        const from = DateExt.UTC('1,January,2005');
        const to = DateExt.UTC('13,August,2007');
        const rpiSchedule = new MakeSchedule()
            .from(from)
            .to(to)
            .withTenor(new Period().init1(1, TimeUnit.Months))
            .withCalendar(new UnitedKingdom())
            .withConvention(BusinessDayConvention.ModifiedFollowing)
            .f();
        const fixData = [
            189.9, 189.9, 189.6, 190.5, 191.6, 192.0, 192.2, 192.2,
            192.6, 193.1, 193.3, 193.6, 194.1, 193.4, 194.2, 195.0,
            196.5, 197.7, 198.5, 198.5, 199.2, 200.1, 200.4, 201.1,
            202.7, 201.6, 203.1, 204.4, 205.4, 206.2, 207.3
        ];
        const interp = false;
        const iir = new YYUKRPIr(interp);
        const iirYES = new YYUKRPIr(true);
        for (let i = 0; i < fixData.length; i++) {
            iir.addFixing(rpiSchedule.date(i), fixData[i]);
            iirYES.addFixing(rpiSchedule.date(i), fixData[i]);
        }
        let todayMinusLag = DateExt.subPeriod(evaluationDate, iir.availabilityLag());
        const lim = inflationPeriod(todayMinusLag, iir.frequency());
        todayMinusLag = DateExt.subPeriod(DateExt.add(lim[second], 1), Period.mulScalar(new Period().init2(iir.frequency()), 2));
        const eps = 1.0e-8;
        for (let i = 13; i < rpiSchedule.size(); i++) {
            const lim = inflationPeriod(rpiSchedule.date(i), iir.frequency());
            const limBef = inflationPeriod(rpiSchedule.date(i - 12), iir.frequency());
            for (const d = lim[first]; d.valueOf() <= lim[second].valueOf(); DateExt.adda(d, 1)) {
                if (d.valueOf() < todayMinusLag.valueOf()) {
                    const expected = fixData[i] / fixData[i - 12] - 1.0;
                    const calculated = iir.fixing(d);
                    expect(Math.abs(calculated - expected)).toBeLessThan(eps);
                    const dp = DateExt.daysBetween(lim[first], DateExt.add(lim[second], 1));
                    const dpBef = DateExt.daysBetween(limBef[first], DateExt.add(limBef[second], 1));
                    const dl = DateExt.daysBetween(lim[first], d);
                    const dlBef = DateExt.daysBetween(limBef[first], new NullCalendar().advance1(d, -1, TimeUnit.Years, BusinessDayConvention.ModifiedFollowing));
                    const linearNow = fixData[i] + (fixData[i + 1] - fixData[i]) * dl / dp;
                    const linearBef = fixData[i - 12] +
                        (fixData[i + 1 - 12] - fixData[i - 12]) * dlBef / dpBef;
                    const expectedYES = linearNow / linearBef - 1.0;
                    const calculatedYES = iirYES.fixing(d);
                    expect(Math.abs(expectedYES - calculatedYES)).toBeLessThan(eps);
                }
            }
        }
        backup.dispose();
        cleaner.dispose();
    });

    it('Testing year-on-year inflation term structure...', () => {
        const backup = new SavedSettings();
        const cleaner = new IndexHistoryCleaner();
        const calendar = new UnitedKingdom();
        const bdc = BusinessDayConvention.ModifiedFollowing;
        let evaluationDate = DateExt.UTC('13,August,2007');
        evaluationDate = calendar.adjust(evaluationDate);
        Settings.evaluationDate.set(evaluationDate);
        let from = DateExt.UTC('1,January,2005');
        let to = DateExt.UTC('13,August,2007');
        const rpiSchedule = new MakeSchedule()
            .from(from)
            .to(to)
            .withTenor(new Period().init1(1, TimeUnit.Months))
            .withCalendar(new UnitedKingdom())
            .withConvention(BusinessDayConvention.ModifiedFollowing)
            .f();
        const fixData = [
            189.9, 189.9, 189.6, 190.5, 191.6, 192.0, 192.2, 192.2,
            192.6, 193.1, 193.3, 193.6, 194.1, 193.4, 194.2, 195.0,
            196.5, 197.7, 198.5, 198.5, 199.2, 200.1, 200.4, 201.1,
            202.7, 201.6, 203.1, 204.4, 205.4, 206.2, 207.3
        ];
        const hy = new RelinkableHandle();
        const interp = false;
        const iir = new YYUKRPIr(interp, hy);
        for (let i = 0; i < fixData.length; i++) {
            iir.addFixing(rpiSchedule.date(i), fixData[i]);
        }
        const nominalTS = nominalTermStructure();
        const yyData = [
            new Datum(DateExt.UTC('13,August,2008'), 2.95),
            new Datum(DateExt.UTC('13,August,2009'), 2.95),
            new Datum(DateExt.UTC('13,August,2010'), 2.93),
            new Datum(DateExt.UTC('15,August,2011'), 2.955),
            new Datum(DateExt.UTC('13,August,2012'), 2.945),
            new Datum(DateExt.UTC('13,August,2013'), 2.985),
            new Datum(DateExt.UTC('13,August,2014'), 3.01),
            new Datum(DateExt.UTC('13,August,2015'), 3.035),
            new Datum(DateExt.UTC('13,August,2016'), 3.055),
            new Datum(DateExt.UTC('13,August,2017'), 3.075),
            new Datum(DateExt.UTC('13,August,2019'), 3.105),
            new Datum(DateExt.UTC('15,August,2022'), 3.135),
            new Datum(DateExt.UTC('13,August,2027'), 3.155),
            new Datum(DateExt.UTC('13,August,2032'), 3.145),
            new Datum(DateExt.UTC('13,August,2037'), 3.145)
        ];
        const observationLag = new Period().init1(2, TimeUnit.Months);
        const dc = new Thirty360();
        const helpers = makeHelpers(new YearOnYearInflationSwapHelper(), yyData, yyData.length, iir, observationLag, calendar, bdc, dc);
        const baseYYRate = yyData[0].rate / 100.0;
        const pYYTS = new PiecewiseYoYInflationCurve(new Linear())
            .pwyoyicInit(evaluationDate, calendar, dc, observationLag, iir.frequency(), iir.interpolated(), baseYYRate, new Handle(nominalTS), helpers);
        pYYTS.recalculate();
        const eps = 0.000001;
        const hTS = new Handle(nominalTS);
        const sppe = new DiscountingSwapEngine(hTS);
        hy.linkTo(pYYTS);
        for (let j = 1; j < yyData.length; j++) {
            from = nominalTS.referenceDate();
            to = yyData[j].date;
            const yoySchedule = new MakeSchedule()
                .from(from)
                .to(to)
                .withConvention(BusinessDayConvention.Unadjusted)
                .withCalendar(calendar)
                .withTenor(new Period().init1(1, TimeUnit.Years))
                .backwards()
                .f();
            const yyS2 = new YearOnYearInflationSwap(YearOnYearInflationSwap.Type.Payer, 1000000.0, yoySchedule, yyData[j].rate / 100.0, dc, yoySchedule, iir, observationLag, 0.0, dc, new UnitedKingdom());
            yyS2.setPricingEngine(sppe);
            expect(Math.abs(yyS2.NPV())).toBeLessThan(eps);
        }
        const jj = 3;
        for (let k = 0; k < 14; k++) {
            from = DateExt.advance(nominalTS.referenceDate(), -k, TimeUnit.Months);
            to = DateExt.advance(yyData[jj].date, -k, TimeUnit.Months);
            const yoySchedule = new MakeSchedule()
                .from(from)
                .to(to)
                .withConvention(BusinessDayConvention.Unadjusted)
                .withCalendar(calendar)
                .withTenor(new Period().init1(1, TimeUnit.Years))
                .backwards()
                .f();
            const yyS3 = new YearOnYearInflationSwap(YearOnYearInflationSwap.Type.Payer, 1000000.0, yoySchedule, yyData[jj].rate / 100.0, dc, yoySchedule, iir, observationLag, 0.0, dc, new UnitedKingdom());
            yyS3.setPricingEngine(sppe);
            expect(Math.abs(yyS3.NPV())).toBeLessThan(20000.0);
        }
        hy.linkTo(new YoYInflationTermStructure());
        backup.dispose();
        cleaner.dispose();
    });

    it('Testing inflation period...', () => {
        let d;
        let f;
        let res;
        const days = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        for (let year = 1950; year < 2051; ++year) {
            if (DateExt.isLeap(year)) {
                days[2] = 29;
            }
            else {
                days[2] = 28;
            }
            for (let i = 1; i <= 12; ++i) {
                d = new Date(Date.UTC(year, i - 1, 1));
                f = Frequency.Monthly;
                res = inflationPeriod(d, f);
                expect(res[first].valueOf())
                    .toEqual(new Date(Date.UTC(year, i - 1, 1)).valueOf());
                expect(res[second].valueOf())
                    .toEqual(new Date(Date.UTC(year, i - 1, days[i])).valueOf());
                f = Frequency.Quarterly;
                res = inflationPeriod(d, f);
                if ((i === 1 || i === 2 || i === 3)) {
                    expect(res[first].valueOf())
                        .toEqual(new Date(Date.UTC(year, 0, 1)).valueOf());
                    expect(res[second].valueOf())
                        .toEqual(new Date(Date.UTC(year, 2, 31)).valueOf());
                }
                else if ((i === 4 || i === 5 || i === 6)) {
                    expect(res[first].valueOf())
                        .toEqual(new Date(Date.UTC(year, 3, 1)).valueOf());
                    expect(res[second].valueOf())
                        .toEqual(new Date(Date.UTC(year, 5, 30)).valueOf());
                }
                else if ((i === 7 || i === 8 || i === 9)) {
                    expect(res[first].valueOf())
                        .toEqual(new Date(Date.UTC(year, 6, 1)).valueOf());
                    expect(res[second].valueOf())
                        .toEqual(new Date(Date.UTC(year, 8, 30)).valueOf());
                }
                else if ((i === 10 || i === 11 || i === 12)) {
                    expect(res[first].valueOf())
                        .toEqual(new Date(Date.UTC(year, 9, 1)).valueOf());
                    expect(res[second].valueOf())
                        .toEqual(new Date(Date.UTC(year, 11, 31)).valueOf());
                }
                f = Frequency.Semiannual;
                res = inflationPeriod(d, f);
                if ((i > 0 && i < 7)) {
                    expect(res[first].valueOf())
                        .toEqual(new Date(Date.UTC(year, 0, 1)).valueOf());
                    expect(res[second].valueOf())
                        .toEqual(new Date(Date.UTC(year, 5, 30)).valueOf());
                }
                else if ((i > 6 && i < 13)) {
                    expect(res[first].valueOf())
                        .toEqual(new Date(Date.UTC(year, 6, 1)).valueOf());
                    expect(res[second].valueOf())
                        .toEqual(new Date(Date.UTC(year, 11, 31)).valueOf());
                }
                f = Frequency.Annual;
                res = inflationPeriod(d, f);
                expect(res[first].valueOf())
                    .toEqual(new Date(Date.UTC(year, 0, 1)).valueOf());
                expect(res[second].valueOf())
                    .toEqual(new Date(Date.UTC(year, 11, 31)).valueOf());
            }
        }
    });
});
