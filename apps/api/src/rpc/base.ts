import { implement } from '@orpc/server'
import { appContract } from '@persianpart/contract'
import type { Context } from './context'

export const base = implement(appContract).$context<Context>()
