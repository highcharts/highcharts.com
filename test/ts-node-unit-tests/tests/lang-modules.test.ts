import { loadHCWithModules } from '../test-utils';
import { strictEqual } from 'node:assert';
import { describe, it, afterEach, before } from 'node:test';

const locales = [
    'zh-CN'
];

for (const locale of locales){
    describe(locale, () => {
        let hc: Record<string, any>;

        afterEach(() => {
            if (hc?.charts){
                for (const chart of hc.charts){
                    chart?.destroy();
                }
            }
        });

        describe('locale option behaviour', () => {
            before(() => {
                hc = loadHCWithModules(
                    'highcharts',
                    [`i18n/${locale}`]
                );
            });

            it('sets default locale', () => {
                strictEqual(hc.defaultOptions.lang.locale, locale);
            });

            it('sets chart locale', () => {
                const chart = hc.chart('container', {});
                strictEqual(chart.options.lang.locale, locale, '');
            });

            it('does not set chart locale when specified', () => {
                const chart = hc.chart('container', {
                    lang: {
                        locale: undefined
                    }
                });

                strictEqual(chart.options.lang.locale, undefined);
            });
        });
    });
}

