import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/products/new')({
  beforeLoad: () => {
    throw redirect({
      to: '/product/new',
    })
  },
  component: () => null,
})
