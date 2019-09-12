import { BusinessDayConvention, DateExt, EUHICP, Frequency, inflationPeriod, MakeSchedule, Period, SavedSettings, Settings, TimeUnit, UKRPI, UnitedKingdom } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { IndexHistoryCleaner } from '/test-suite/utilities.mjs';

const first = 0, second = 1;

describe('Inflation tests', () => {
    it('Testing zero inflation indices...', () => {
        const backup = new SavedSettings();
        const cleaner = new IndexHistoryCleaner();
        const euhicp = new EUHICP(true);
        expect(euhicp.name()).toEqual('EU HICP');
        expect(euhicp.frequency()).toEqual(Frequency.Monthly);
        expect(euhicp.revised()).toBeFalsy();
        expect(euhicp.interpolated()).toBeFalsy();
        expect(Period.equal(euhicp.availabilityLag(), new Period().init1(1, TimeUnit.Months)))
            .toBeTruthy();
        const ukrpi = new UKRPI(false);
        expect(ukrpi.name()).toEqual('UK RPI');
        expect(ukrpi.frequency()).toEqual(Frequency.Monthly);
        expect(ukrpi.revised()).toBeFalsy();
        expect(ukrpi.interpolated()).toBeFalsy();
        expect(Period.equal(ukrpi.availabilityLag(), new Period().init1(1, TimeUnit.Months)))
            .toBeTruthy();
        let evaluationDate = new Date('13-August-2007');
        evaluationDate = new UnitedKingdom().adjust(evaluationDate);
        Settings.evaluationDate.set(evaluationDate);
        const from = new Date('1-January-2005');
        const to = new Date('13-August-2007');
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
    });
    it('Testing that zero inflation indices forecast future fixings...', () => {
    });
    it('Testing year-on-year inflation indices...', () => {
    });
    it('Testing year-on-year inflation term structure...', () => {
    });
    it('Testing inflation period...', () => {
    });
});