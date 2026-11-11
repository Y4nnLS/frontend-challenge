import { createFileRoute } from '@tanstack/react-router'
import { CheckoutPage } from '@/marketplace/private-pages'
export const Route = createFileRoute('/checkout')({ component: CheckoutPage })
