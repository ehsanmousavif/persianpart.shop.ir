import { implement } from '@orpc/server'
import { contract } from './contract'
import type { Context } from './context'

export const base = implement(contract).$context<Context>()
