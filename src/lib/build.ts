/**
 * در build داکر دیتابیس در دسترس نیست. با NO_DB_AT_BUILD=1 صفحات در build از پیش ساخته نمی‌شوند
 * و در اولین بازدید ساخته و کش می‌شوند (ISR).
 */
export const skipPrerender = process.env.NO_DB_AT_BUILD === "1";
