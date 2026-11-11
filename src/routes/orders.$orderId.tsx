import { createFileRoute } from '@tanstack/react-router'
import { OrderPage } from '@/marketplace/private-pages'
export const Route = createFileRoute('/orders/$orderId')({ component: OrderRoute })
function OrderRoute() { return <OrderPage orderId={Route.useParams().orderId}/> }
