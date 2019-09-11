import { BarrelUnitOfMeasure, GallonUnitOfMeasure, KilolitreUnitOfMeasure, LitreUnitOfMeasure, MBUnitOfMeasure, NullCommodityType, Quantity, UnitOfMeasureConversion, UnitOfMeasureConversionManager } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql/ql.mjs';

describe('Commodity Unit Of Measure tests', () => {
    it('Testing direct commodity unit of measure conversions...', () => {
        let actual = new UnitOfMeasureConversion()
            .init1(new NullCommodityType(), new MBUnitOfMeasure(), new BarrelUnitOfMeasure(), 1000)
            .convert(new Quantity().init2(new NullCommodityType(), new MBUnitOfMeasure(), 1000));
        let calc = UnitOfMeasureConversionManager
            .lookup(new NullCommodityType(), new BarrelUnitOfMeasure(), new MBUnitOfMeasure(), UnitOfMeasureConversion.Type.Direct)
            .convert(new Quantity().init2(new NullCommodityType(), new MBUnitOfMeasure(), 1000));
        expect(calc.close(actual)).toBeTruthy();
        actual = new UnitOfMeasureConversion()
            .init1(new NullCommodityType(), new BarrelUnitOfMeasure(), new GallonUnitOfMeasure(), 42)
            .convert(new Quantity().init2(new NullCommodityType(), new GallonUnitOfMeasure(), 1000));
        calc =
            UnitOfMeasureConversionManager
                .lookup(new NullCommodityType(), new BarrelUnitOfMeasure(), new GallonUnitOfMeasure(), UnitOfMeasureConversion.Type.Direct)
                .convert(new Quantity().init2(new NullCommodityType(), new GallonUnitOfMeasure(), 1000));
        expect(calc.close(actual)).toBeTruthy();
        actual = new UnitOfMeasureConversion()
            .init1(new NullCommodityType(), new BarrelUnitOfMeasure(), new LitreUnitOfMeasure(), 158.987)
            .convert(new Quantity().init2(new NullCommodityType(), new LitreUnitOfMeasure(), 1000));
        calc =
            UnitOfMeasureConversionManager
                .lookup(new NullCommodityType(), new BarrelUnitOfMeasure(), new LitreUnitOfMeasure(), UnitOfMeasureConversion.Type.Direct)
                .convert(new Quantity().init2(new NullCommodityType(), new LitreUnitOfMeasure(), 1000));
        expect(calc.close(actual)).toBeTruthy();
        actual =
            new UnitOfMeasureConversion()
                .init1(new NullCommodityType(), new KilolitreUnitOfMeasure(), new BarrelUnitOfMeasure(), 6.28981)
                .convert(new Quantity().init2(new NullCommodityType(), new KilolitreUnitOfMeasure(), 1000));
        calc =
            UnitOfMeasureConversionManager
                .lookup(new NullCommodityType(), new BarrelUnitOfMeasure(), new KilolitreUnitOfMeasure(), UnitOfMeasureConversion.Type.Direct)
                .convert(new Quantity().init2(new NullCommodityType(), new KilolitreUnitOfMeasure(), 1000));
        expect(calc.close(actual)).toBeTruthy();
        actual = new UnitOfMeasureConversion()
            .init1(new NullCommodityType(), new GallonUnitOfMeasure(), new MBUnitOfMeasure(), 42000)
            .convert(new Quantity().init2(new NullCommodityType(), new MBUnitOfMeasure(), 1000));
        calc = UnitOfMeasureConversionManager
            .lookup(new NullCommodityType(), new GallonUnitOfMeasure(), new MBUnitOfMeasure(), UnitOfMeasureConversion.Type.Direct)
            .convert(new Quantity().init2(new NullCommodityType(), new MBUnitOfMeasure(), 1000));
        expect(calc.close(actual)).toBeTruthy();
        actual = new UnitOfMeasureConversion()
            .init1(new NullCommodityType(), new LitreUnitOfMeasure(), new GallonUnitOfMeasure(), 3.78541)
            .convert(new Quantity().init2(new NullCommodityType(), new LitreUnitOfMeasure(), 1000));
        calc =
            UnitOfMeasureConversionManager
                .lookup(new NullCommodityType(), new GallonUnitOfMeasure(), new LitreUnitOfMeasure(), UnitOfMeasureConversion.Type.Direct)
                .convert(new Quantity().init2(new NullCommodityType(), new LitreUnitOfMeasure(), 1000));
        expect(calc.close(actual)).toBeTruthy();
    });
});