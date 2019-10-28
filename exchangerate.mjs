import { CHFCurrency, Comparison, DateExt, EURCurrency, ExchangeRate, ExchangeRateManager, GBPCurrency, ITLCurrency, JPYCurrency, Money, SEKCurrency, USDCurrency, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

describe(`Exchange-rate tests ${version}`, () => {
    it('Testing direct exchange rates...', () => {
        const EUR = new EURCurrency(), USD = new USDCurrency();
        const eur_usd = new ExchangeRate().init(EUR, USD, 1.2042);
        const m1 = new Money().init2(EUR, 50000.0);
        const m2 = new Money().init2(USD, 100000.0);
        Money.conversionType = Money.ConversionType.NoConversion;
        let calculated = eur_usd.exchange(m1);
        let expected = new Money().init2(USD, m1.value() * eur_usd.rate());
        expect(Comparison.close(calculated.value(), expected.value())).toBeTruthy();
        calculated = eur_usd.exchange(m2);
        expected = new Money().init2(EUR, m2.value() / eur_usd.rate());
        expect(Comparison.close(calculated.value(), expected.value())).toBeTruthy();
    });

    it('Testing derived exchange rates...', () => {
        const EUR = new EURCurrency(), USD = new USDCurrency(), GBP = new GBPCurrency();
        const eur_usd = new ExchangeRate().init(EUR, USD, 1.2042);
        const eur_gbp = new ExchangeRate().init(EUR, GBP, 0.6612);
        const derived = ExchangeRate.chain(eur_usd, eur_gbp);
        const m1 = new Money().init2(GBP, 50000.0);
        const m2 = new Money().init2(USD, 100000.0);
        Money.conversionType = Money.ConversionType.NoConversion;
        let calculated = derived.exchange(m1);
        let expected = new Money().init2(USD, m1.value() * eur_usd.rate() / eur_gbp.rate());
        expect(Comparison.close(calculated.value(), expected.value())).toBeTruthy();
        calculated = derived.exchange(m2);
        expected = new Money().init2(GBP, m2.value() * eur_gbp.rate() / eur_usd.rate());
        expect(Comparison.close(calculated.value(), expected.value())).toBeTruthy();
    });

    it('Testing lookup of direct exchange rates...', () => {
        ExchangeRateManager.clear();
        const EUR = new EURCurrency(), USD = new USDCurrency();
        const eur_usd1 = new ExchangeRate().init(EUR, USD, 1.1983);
        const eur_usd2 = new ExchangeRate().init(USD, EUR, 1.0 / 1.2042);
        ExchangeRateManager.add(eur_usd1, DateExt.UTC('4,August,2004'));
        ExchangeRateManager.add(eur_usd2, DateExt.UTC('5,August,2004'));
        const m1 = new Money().init2(EUR, 50000.0);
        const m2 = new Money().init2(USD, 100000.0);
        Money.conversionType = Money.ConversionType.NoConversion;
        let eur_usd = ExchangeRateManager.lookup(EUR, USD, DateExt.UTC('4,August,2004'), ExchangeRate.Type.Direct);
        let calculated = eur_usd.exchange(m1);
        let expected = new Money().init2(USD, m1.value() * eur_usd1.rate());
        expect(Comparison.close(calculated.value(), expected.value())).toBeTruthy();
        eur_usd = ExchangeRateManager.lookup(EUR, USD, DateExt.UTC('5,August,2004'), ExchangeRate.Type.Direct);
        calculated = eur_usd.exchange(m1);
        expected = new Money().init2(USD, m1.value() / eur_usd2.rate());
        expect(Comparison.close(calculated.value(), expected.value())).toBeTruthy();
        let usd_eur = ExchangeRateManager.lookup(USD, EUR, DateExt.UTC('4,August,2004'), ExchangeRate.Type.Direct);
        calculated = usd_eur.exchange(m2);
        expected = new Money().init2(EUR, m2.value() / eur_usd1.rate());
        expect(Comparison.close(calculated.value(), expected.value())).toBeTruthy();
        usd_eur = ExchangeRateManager.lookup(USD, EUR, DateExt.UTC('5,August,2004'), ExchangeRate.Type.Direct);
        calculated = usd_eur.exchange(m2);
        expected = new Money().init2(EUR, m2.value() * eur_usd2.rate());
        expect(Comparison.close(calculated.value(), expected.value())).toBeTruthy();
    });

    it('Testing lookup of triangulated exchange rates...', () => {
        ExchangeRateManager.clear();
        const EUR = new EURCurrency(), USD = new USDCurrency(), ITL = new ITLCurrency();
        const eur_usd1 = new ExchangeRate().init(EUR, USD, 1.1983);
        const eur_usd2 = new ExchangeRate().init(EUR, USD, 1.2042);
        ExchangeRateManager.add(eur_usd1, DateExt.UTC('4,August,2004'));
        ExchangeRateManager.add(eur_usd2, DateExt.UTC('5,August,2004'));
        const m1 = new Money().init2(ITL, 50000000.0);
        const m2 = new Money().init2(USD, 100000.0);
        Money.conversionType = Money.ConversionType.NoConversion;
        let itl_usd = ExchangeRateManager.lookup(ITL, USD, DateExt.UTC('4,August,2004'));
        let calculated = itl_usd.exchange(m1);
        let expected = new Money().init2(USD, m1.value() * eur_usd1.rate() / 1936.27);
        expect(Comparison.close(calculated.value(), expected.value())).toBeTruthy();
        itl_usd = ExchangeRateManager.lookup(ITL, USD, DateExt.UTC('5,August,2004'));
        calculated = itl_usd.exchange(m1);
        expected = new Money().init2(USD, m1.value() * eur_usd2.rate() / 1936.27);
        expect(Comparison.close(calculated.value(), expected.value())).toBeTruthy();
        let usd_itl = ExchangeRateManager.lookup(USD, ITL, DateExt.UTC('4,August,2004'));
        calculated = usd_itl.exchange(m2);
        expected = new Money().init2(ITL, m2.value() * 1936.27 / eur_usd1.rate());
        expect(Comparison.close(calculated.value(), expected.value())).toBeTruthy();
        usd_itl = ExchangeRateManager.lookup(USD, ITL, DateExt.UTC('5,August,2004'));
        calculated = usd_itl.exchange(m2);
        expected = new Money().init2(ITL, m2.value() * 1936.27 / eur_usd2.rate());
        expect(Comparison.close(calculated.value(), expected.value())).toBeTruthy();
    });

    it('Testing lookup of derived exchange rates...', () => {
        const EUR = new EURCurrency(), USD = new USDCurrency(), GBP = new GBPCurrency(), CHF = new CHFCurrency(), SEK = new SEKCurrency(), JPY = new JPYCurrency();
        ExchangeRateManager.clear();
        const eur_usd1 = new ExchangeRate().init(EUR, USD, 1.1983);
        const eur_usd2 = new ExchangeRate().init(USD, EUR, 1.0 / 1.2042);
        ExchangeRateManager.add(eur_usd1, DateExt.UTC('4,August,2004'));
        ExchangeRateManager.add(eur_usd2, DateExt.UTC('5,August,2004'));
        const eur_gbp1 = new ExchangeRate().init(GBP, EUR, 1.0 / 0.6596);
        const eur_gbp2 = new ExchangeRate().init(EUR, GBP, 0.6612);
        ExchangeRateManager.add(eur_gbp1, DateExt.UTC('4,August,2004'));
        ExchangeRateManager.add(eur_gbp2, DateExt.UTC('5,August,2004'));
        const usd_chf1 = new ExchangeRate().init(USD, CHF, 1.2847);
        const usd_chf2 = new ExchangeRate().init(CHF, USD, 1.0 / 1.2774);
        ExchangeRateManager.add(usd_chf1, DateExt.UTC('4,August,2004'));
        ExchangeRateManager.add(usd_chf2, DateExt.UTC('5,August,2004'));
        const chf_sek1 = new ExchangeRate().init(SEK, CHF, 0.1674);
        const chf_sek2 = new ExchangeRate().init(CHF, SEK, 1.0 / 0.1677);
        ExchangeRateManager.add(chf_sek1, DateExt.UTC('4,August,2004'));
        ExchangeRateManager.add(chf_sek2, DateExt.UTC('5,August,2004'));
        const jpy_sek1 = new ExchangeRate().init(SEK, JPY, 14.5450);
        const jpy_sek2 = new ExchangeRate().init(JPY, SEK, 1.0 / 14.6110);
        ExchangeRateManager.add(jpy_sek1, DateExt.UTC('4,August,2004'));
        ExchangeRateManager.add(jpy_sek2, DateExt.UTC('5,August,2004'));
        const m1 = new Money().init2(USD, 100000.0);
        const m2 = new Money().init2(EUR, 100000.0);
        const m3 = new Money().init2(GBP, 100000.0);
        const m5 = new Money().init2(SEK, 100000.0);
        const m6 = new Money().init2(JPY, 100000.0);
        Money.conversionType = Money.ConversionType.NoConversion;
        let usd_sek = ExchangeRateManager.lookup(USD, SEK, DateExt.UTC('4,August,2004'));
        let calculated = usd_sek.exchange(m1);
        let expected = new Money().init2(SEK, m1.value() * usd_chf1.rate() / chf_sek1.rate());
        expect(Comparison.close(calculated.value(), expected.value())).toBeTruthy();
        usd_sek = ExchangeRateManager.lookup(SEK, USD, DateExt.UTC('5,August,2004'));
        calculated = usd_sek.exchange(m5);
        expected = new Money().init2(USD, m5.value() * usd_chf2.rate() / chf_sek2.rate());
        expect(Comparison.close(calculated.value(), expected.value())).toBeTruthy();
        let eur_sek = ExchangeRateManager.lookup(EUR, SEK, DateExt.UTC('4,August,2004'));
        calculated = eur_sek.exchange(m2);
        expected = new Money().init2(SEK, m2.value() * eur_usd1.rate() * usd_chf1.rate() / chf_sek1.rate());
        expect(Comparison.close(calculated.value(), expected.value())).toBeTruthy();
        eur_sek = ExchangeRateManager.lookup(SEK, EUR, DateExt.UTC('5,August,2004'));
        calculated = eur_sek.exchange(m5);
        expected = new Money().init2(EUR, m5.value() * eur_usd2.rate() * usd_chf2.rate() / chf_sek2.rate());
        expect(Comparison.close(calculated.value(), expected.value())).toBeTruthy();
        let eur_jpy = ExchangeRateManager.lookup(EUR, JPY, DateExt.UTC('4,August,2004'));
        calculated = eur_jpy.exchange(m2);
        expected = new Money().init2(JPY, m2.value() * eur_usd1.rate() * usd_chf1.rate() * jpy_sek1.rate() /
            chf_sek1.rate());
        expect(Comparison.close(calculated.value(), expected.value())).toBeTruthy();
        eur_jpy = ExchangeRateManager.lookup(JPY, EUR, DateExt.UTC('5,August,2004'));
        calculated = eur_jpy.exchange(m6);
        expected = new Money().init2(EUR, m6.value() * jpy_sek2.rate() * eur_usd2.rate() * usd_chf2.rate() /
            chf_sek2.rate());
        expect(Comparison.close(calculated.value(), expected.value())).toBeTruthy();
        let gbp_jpy = ExchangeRateManager.lookup(GBP, JPY, DateExt.UTC('4,August,2004'));
        calculated = gbp_jpy.exchange(m3);
        expected = new Money().init2(JPY, m3.value() * eur_gbp1.rate() * eur_usd1.rate() * usd_chf1.rate() *
            jpy_sek1.rate() / chf_sek1.rate());
        expect(Comparison.close(calculated.value(), expected.value())).toBeTruthy();
        gbp_jpy = ExchangeRateManager.lookup(JPY, GBP, DateExt.UTC('5,August,2004'));
        calculated = gbp_jpy.exchange(m6);
        expected = new Money().init2(GBP, m6.value() * jpy_sek2.rate() * eur_usd2.rate() * usd_chf2.rate() *
            eur_gbp2.rate() / chf_sek2.rate());
        expect(Comparison.close(calculated.value(), expected.value())).toBeTruthy();
    });
});
