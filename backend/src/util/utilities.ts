import { Decimal } from 'decimal.js-light'
import i18n from 'i18n'

export const objectValuesToArray = (obj: { [x: string]: string }): Array<string> => {
  return Object.keys(obj).map(function (key) {
    return obj[key]
  })
}

export const decimalSeparatorByLanguage = (a: Decimal, language: string): string => {
  const rememberLocaleToRestore = i18n.getLocale()
  i18n.setLocale(language)
  const result = a.toFixed(2).replace('.', i18n.__('general.decimalSeparator'))
  i18n.setLocale(rememberLocaleToRestore)
  return result
}

export const fullName = (firstName: string, lastName: string): string => {
  return [firstName, lastName].filter(Boolean).join(' ')
}

export const userName = (f?: string, l?: string): string | null => {
  let name: string | null
  if (f && l) {
    name = f + ' ' + l
  } else if (f && !l) {
    name = f
  } else if (!f && l) {
    name = l
  } else {
    name = null
  }

  return name
}
