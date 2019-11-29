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
import { BusinessDayConvention, Calendar, DateExt, DateGeneration, Frequency, Japan, MakeSchedule, Period, Schedule, TARGET, TimeUnit, UnitedStates, WeekendsOnly, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

function check_dates(s, expected) {
    expect(s.size()).toEqual(expected.length);
    for (let i = 0; i < expected.length; ++i) {
        expect(s.date(i).valueOf()).toEqual(expected[i].valueOf());
    }
}

describe(`Schedule tests ${version}`, () => {
    it('Testing schedule with daily frequency...', () => {
        const startDate = DateExt.UTC('17,January,2012');
        const s = new MakeSchedule()
            .from(startDate)
            .to(DateExt.add(startDate, 7))
            .withCalendar(new TARGET())
            .withFrequency(Frequency.Daily)
            .withConvention(BusinessDayConvention.Preceding)
            .f();
        const expected = new Array(6);
        expected[0] = DateExt.UTC('17,January,2012');
        expected[1] = DateExt.UTC('18,January,2012');
        expected[2] = DateExt.UTC('19,January,2012');
        expected[3] = DateExt.UTC('20,January,2012');
        expected[4] = DateExt.UTC('23,January,2012');
        expected[5] = DateExt.UTC('24,January,2012');
        check_dates(s, expected);
    });

    it('Testing end date for schedule with end-of-month adjustment...', () => {
        let s = new MakeSchedule()
            .from(DateExt.UTC('30,September,2009'))
            .to(DateExt.UTC('15,June,2012'))
            .withCalendar(new Japan())
            .withTenor(new Period().init1(6, TimeUnit.Months))
            .withConvention(BusinessDayConvention.Following)
            .withTerminationDateConvention(BusinessDayConvention.Following)
            .forwards()
            .endOfMonth()
            .f();
        const expected = [
            DateExt.UTC('30,September,2009'),
            DateExt.UTC('31,March,2010'),
            DateExt.UTC('30,September,2010'),
            DateExt.UTC('31,March,2011'),
            DateExt.UTC('30,September,2011'),
            DateExt.UTC('30,March,2012'),
            DateExt.UTC('29,June,2012'),
        ];
        check_dates(s, expected);
        s = new MakeSchedule()
            .from(DateExt.UTC('30,September,2009'))
            .to(DateExt.UTC('15,June,2012'))
            .withCalendar(new Japan())
            .withTenor(new Period().init1(6, TimeUnit.Months))
            .withConvention(BusinessDayConvention.Following)
            .withTerminationDateConvention(BusinessDayConvention.Unadjusted)
            .forwards()
            .endOfMonth()
            .f();
        expected[6] = DateExt.UTC('15,June,2012');
        check_dates(s, expected);
    });

    it('Testing that no dates are past the end date with EOM adjustment...', () => {
        const s = new MakeSchedule()
            .from(DateExt.UTC('28,March,2013'))
            .to(DateExt.UTC('30,March,2015'))
            .withCalendar(new TARGET())
            .withTenor(new Period().init1(1, TimeUnit.Years))
            .withConvention(BusinessDayConvention.Unadjusted)
            .withTerminationDateConvention(BusinessDayConvention.Unadjusted)
            .forwards()
            .endOfMonth()
            .f();
        const expected = [
            DateExt.UTC('31,March,2013'), DateExt.UTC('31,March,2014'),
            DateExt.UTC('30,March,2015')
        ];
        check_dates(s, expected);
        expect(s.isRegular1(2)).toBeFalsy();
    });

    it('Testing that next-to-last date same as end date is removed...', () => {
        const s = new MakeSchedule()
            .from(DateExt.UTC('28,March,2013'))
            .to(DateExt.UTC('31,March,2015'))
            .withCalendar(new TARGET())
            .withTenor(new Period().init1(1, TimeUnit.Years))
            .withConvention(BusinessDayConvention.Unadjusted)
            .withTerminationDateConvention(BusinessDayConvention.Unadjusted)
            .forwards()
            .endOfMonth()
            .f();
        const expected = [
            DateExt.UTC('31,March,2013'), DateExt.UTC('31,March,2014'),
            DateExt.UTC('31,March,2015')
        ];
        check_dates(s, expected);
        expect(s.isRegular1(2)).toBeTruthy();
    });

    it('Testing that the last date is not adjusted for' +
        ' EOM when termination date convention is unadjusted...', () => {
        const s = new MakeSchedule()
            .from(DateExt.UTC('31,August,1996'))
            .to(DateExt.UTC('15,September,1997'))
            .withCalendar(new UnitedStates(UnitedStates.Market.GovernmentBond))
            .withTenor(new Period().init1(6, TimeUnit.Months))
            .withConvention(BusinessDayConvention.Unadjusted)
            .withTerminationDateConvention(BusinessDayConvention.Unadjusted)
            .forwards()
            .endOfMonth()
            .f();
        const expected = [
            DateExt.UTC('31,August,1996'), DateExt.UTC('28,February,1997'),
            DateExt.UTC('31,August,1997'), DateExt.UTC('15,September,1997')
        ];
        check_dates(s, expected);
    });

    it('Testing that the first date is not duplicated due' +
        ' to EOM convention when going backwards...', () => {
        const s = new MakeSchedule()
            .from(DateExt.UTC('22,August,1996'))
            .to(DateExt.UTC('31,August,1997'))
            .withCalendar(new UnitedStates(UnitedStates.Market.GovernmentBond))
            .withTenor(new Period().init1(6, TimeUnit.Months))
            .withConvention(BusinessDayConvention.Following)
            .withTerminationDateConvention(BusinessDayConvention.Following)
            .backwards()
            .endOfMonth()
            .f();
        const expected = [
            DateExt.UTC('30,August,1996'), DateExt.UTC('28,February,1997'),
            DateExt.UTC('29,August,1997')
        ];
        check_dates(s, expected);
    });

    it('Testing CDS2015 semi-annual rolling convention...', () => {
        const s1 = new MakeSchedule()
            .from(DateExt.UTC('12,December,2016'))
            .to(DateExt.advance(DateExt.UTC('12,December,2016'), 5, TimeUnit.Years))
            .withCalendar(new WeekendsOnly())
            .withTenor(new Period().init1(3, TimeUnit.Months))
            .withConvention(BusinessDayConvention.ModifiedFollowing)
            .withTerminationDateConvention(BusinessDayConvention.Unadjusted)
            .withRule(DateGeneration.Rule.CDS2015)
            .f();
        expect(s1.startDate().valueOf())
            .toEqual(DateExt.UTC('20,September,2016').valueOf());
        expect(s1.endDate().valueOf())
            .toEqual(DateExt.UTC('20,December,2021').valueOf());
        const s2 = new MakeSchedule()
            .from(DateExt.UTC('1,March,2017'))
            .to(DateExt.advance(DateExt.UTC('1,March,2017'), 5, TimeUnit.Years))
            .withCalendar(new WeekendsOnly())
            .withTenor(new Period().init1(3, TimeUnit.Months))
            .withConvention(BusinessDayConvention.ModifiedFollowing)
            .withTerminationDateConvention(BusinessDayConvention.Unadjusted)
            .withRule(DateGeneration.Rule.CDS2015)
            .f();
        expect(s2.startDate().valueOf())
            .toEqual(DateExt.UTC('20,December,2016').valueOf());
        expect(s2.endDate().valueOf())
            .toEqual(DateExt.UTC('20,December,2021').valueOf());
        const s3 = new MakeSchedule()
            .from(DateExt.UTC('20,March,2017'))
            .to(DateExt.advance(DateExt.UTC('20,March,2017'), 5, TimeUnit.Years))
            .withCalendar(new WeekendsOnly())
            .withTenor(new Period().init1(3, TimeUnit.Months))
            .withConvention(BusinessDayConvention.ModifiedFollowing)
            .withTerminationDateConvention(BusinessDayConvention.Unadjusted)
            .withRule(DateGeneration.Rule.CDS2015)
            .f();
        expect(s3.startDate().valueOf())
            .toEqual(DateExt.UTC('20,March,2017').valueOf());
        expect(s3.endDate().valueOf()).toEqual(DateExt.UTC('20,June,2022').valueOf());
    });

    it('Testing the constructor taking a vector of dates' +
        ' and possibly additional meta information...', () => {
        const dates = [
            DateExt.UTC('16,May,2015'), DateExt.UTC('18,May,2015'),
            DateExt.UTC('18,May,2016'), DateExt.UTC('31,December,2017')
        ];
        const schedule1 = new Schedule().init1(dates);
        expect(schedule1.size()).toEqual(dates.length);
        for (let i = 0; i < dates.length; ++i) {
            expect(schedule1.date(i).valueOf()).toEqual(dates[i].valueOf());
        }
        expect(schedule1.businessDayConvention())
            .toEqual(BusinessDayConvention.Unadjusted);
        const regular = [false, true, false];
        const schedule2 = new Schedule().init1(dates, new TARGET(), BusinessDayConvention.Following, BusinessDayConvention.ModifiedPreceding, new Period().init1(1, TimeUnit.Years), DateGeneration.Rule.Backward, true, regular);
        for (let i = 1; i < dates.length; ++i) {
            expect(schedule2.isRegular1(i)).toEqual(regular[i - 1]);
        }
        expect(Calendar.equal(schedule2.calendar(), new TARGET())).toEqual(true);
        expect(schedule2.businessDayConvention())
            .toEqual(BusinessDayConvention.Following);
        expect(schedule2.terminationDateBusinessDayConvention())
            .toEqual(BusinessDayConvention.ModifiedPreceding);
        expect(Period.equal(schedule2.tenor(), new Period().init1(1, TimeUnit.Years)))
            .toEqual(true);
        expect(schedule2.rule()).toEqual(DateGeneration.Rule.Backward);
        expect(schedule2.endOfMonth()).toEqual(true);
    });

    it('Testing that a four-weeks tenor works...', () => {
        try {
            const s = new MakeSchedule()
                .from(DateExt.UTC('13,January,2016'))
                .to(DateExt.UTC('14,May,2016'))
                .withCalendar(new TARGET())
                .withTenor(new Period().init1(4, TimeUnit.Weeks))
                .withConvention(BusinessDayConvention.Following)
                .forwards()
                .f();
            expect(s).not.toBeNull();
            expect(s).not.toBeUndefined();
        }
        catch (e) {
            throw new Error(`A four-weeks tenor caused an exception: ${e}`);
        }
    });
});
