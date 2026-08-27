/**
 * Maps each {@link SupportedLocale} to the `date-fns` `Locale` object used
 * to format dates/times in the active app language, and to the month/weekday
 * names `@noteferry/ui`'s `Calendar` registers with `react-native-calendars`'
 * own locale system. `date-fns` has no distinct `es-419` locale — plain `es`
 * is the closest available and is not Spain-specific in its date formatting.
 *
 * @module noteferry/Domain/Localization/DateFnsLocale
 *
 * @file      DateFnsLocale.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { de, enUS, es, ja, ko } from "date-fns/locale";
import type { CalendarLocaleNames } from "@noteferry/ui/Primitive/Calendar";
import type { Locale } from "date-fns";
import type { SupportedLocale } from "./i18n";

const DateFnsLocaleMap: Record<SupportedLocale, Locale> = {
    de,
    "en-US": enUS,
    "es-419": es,
    ja,
    ko
};

/**
 * The `date-fns` `Locale` object for `Locale_`, used to format dates/times
 * throughout the app (property fields, `DateSheet`, `Calendar`).
 *
 * @category Localization
 * @since 1.0.0
 */
export const ResolveDateFnsLocale = (Locale_: SupportedLocale): Locale => DateFnsLocaleMap[ Locale_ ];

const CalendarNamesByLocale: Record<SupportedLocale, CalendarLocaleNames> = {
    de: {
        DayNames: [ "Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag" ],
        DayNamesShort: [ "So", "Mo", "Di", "Mi", "Do", "Fr", "Sa" ],
        MonthNames: [
            "Januar", "Februar", "März", "April", "Mai", "Juni",
            "Juli", "August", "September", "Oktober", "November", "Dezember"
        ],
        MonthNamesShort: [ "Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez" ]
    },
    "en-US": {
        DayNames: [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ],
        DayNamesShort: [ "Su", "Mo", "Tu", "We", "Th", "Fr", "Sa" ],
        MonthNames: [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ],
        MonthNamesShort: [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ]
    },
    "es-419": {
        DayNames: [ "domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado" ],
        DayNamesShort: [ "do", "lu", "ma", "mi", "ju", "vi", "sá" ],
        MonthNames: [
            "enero", "febrero", "marzo", "abril", "mayo", "junio",
            "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
        ],
        MonthNamesShort: [ "ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic" ]
    },
    ja: {
        DayNames: [ "日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日" ],
        DayNamesShort: [ "日", "月", "火", "水", "木", "金", "土" ],
        MonthNames: [
            "1月", "2月", "3月", "4月", "5月", "6月",
            "7月", "8月", "9月", "10月", "11月", "12月"
        ],
        MonthNamesShort: [ "1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月" ]
    },
    ko: {
        DayNames: [ "일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일" ],
        DayNamesShort: [ "일", "월", "화", "수", "목", "금", "토" ],
        MonthNames: [
            "1월", "2월", "3월", "4월", "5월", "6월",
            "7월", "8월", "9월", "10월", "11월", "12월"
        ],
        MonthNamesShort: [ "1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월" ]
    }
};

/**
 * The month/weekday name table `RegisterCalendarLocale` (from `@noteferry/ui`)
 * expects for `Locale_`.
 *
 * @category Localization
 * @since 1.0.0
 */
export const ResolveCalendarLocaleNames = (Locale_: SupportedLocale): CalendarLocaleNames =>
    CalendarNamesByLocale[ Locale_ ];
