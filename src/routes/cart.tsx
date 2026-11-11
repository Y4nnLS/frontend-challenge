import { createFileRoute } from '@tanstack/react-router'
import { CartPage } from '@/marketplace/private-pages'
export const Route = createFileRoute('/cart')({ component: CartPage })
