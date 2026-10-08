import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/products/new')({
  beforeLoad: ({ search }) => {
    throw redirect({
      to: '/product/new',
      search,
    })
  },
  component: () => null,
})
