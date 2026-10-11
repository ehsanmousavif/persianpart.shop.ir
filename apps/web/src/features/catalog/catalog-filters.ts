import {
  parseAsString,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsStringLiteral,
} from 'nuqs'

export const SORT_OPTIONS = [
  'default',
  'cheapest',
  'expensive',
  'newest',
  'oldest',
] as const

export type SortOption = (typeof SORT_OPTIONS)[number]

export const catalogFilterParsers = {
  q: parseAsString.withDefault(''),
  dimension: parseAsString,
  brands: parseAsArrayOf(parseAsString, ',').withDefault([]),
  colors: parseAsArrayOf(parseAsString, ',').withDefault([]),
  grades: parseAsArrayOf(parseAsString, ',').withDefault([]),
  tags: parseAsArrayOf(parseAsString, ',').withDefault([]),
  category: parseAsString,
  inStock: parseAsBoolean.withDefault(false),
  sort: parseAsStringLiteral(SORT_OPTIONS).withDefault('default'),
}
