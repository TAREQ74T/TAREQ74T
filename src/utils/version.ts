import packageJson from '../../package.json'

/** رقم إصدار التطبيق — يُقرأ آلياً من package.json (المصدر الوحيد). */
export const APP_VERSION: string = packageJson.version
