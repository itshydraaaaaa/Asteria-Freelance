'use client'

import Link from 'next/link'
import { MessageSquare, ArrowRight, ShieldCheck } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageContext'

const STATUS_BADGE: Record<string, string> = {
  PENDING:   'bg-amber-50 text-amber-700 border border-amber-200',
  ACTIVE:    'bg-sky-50 text-sky-700 border border-sky-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  CANCELLED: 'bg-black/8 text-ast-gray border border-black/15',
}

interface Props {
  userId: string
  orders: any[]
}

export function OrdersOverviewClient({ userId, orders }: Props) {
  const { t, isRTL, dir } = useLanguage()

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-3xl text-black">{t('ordersTitle')}</h1>
          <p className="text-ast-gray text-xs mt-1">{t('ordersSubtitle')}</p>
        </div>
        <Link
          href="/explore"
          className="px-5 py-2.5 bg-ast-primary text-white text-xs font-semibold rounded-2xl hover:bg-ast-dark transition-colors shadow-sm self-start sm:self-auto"
        >
          {t('ordersExploreGigs')}
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-black/8 p-6 shadow-sm">
        {orders.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <ShieldCheck size={40} className="text-ast-primary/40 mx-auto" />
            <h3 className="font-bold text-sm text-black">{t('ordersNoActiveOrders')}</h3>
            <p className="text-ast-gray text-xs max-w-sm mx-auto leading-relaxed">
              {t('ordersNoActiveOrdersSub')}
            </p>
            <Link href="/explore" className="inline-block bg-ast-primary text-white text-xs font-semibold px-6 py-2.5 rounded-full hover:bg-ast-dark transition-colors mt-2">
              {t('ordersBrowseGigs')}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/8 text-left text-ast-gray text-xs uppercase tracking-wider bg-ast-surface/50">
                  <th className="px-4 py-3 font-medium">{t('ordersColGig')}</th>
                  <th className="px-4 py-3 font-medium">{t('ordersColRole')}</th>
                  <th className="px-4 py-3 font-medium">{t('ordersColEscrow')}</th>
                  <th className="px-4 py-3 font-medium">{t('ordersColStatus')}</th>
                  <th className="px-4 py-3 font-medium">{t('ordersColDate')}</th>
                  <th className="px-4 py-3 font-medium text-right">{t('ordersColActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {orders.map(o => {
                  const isBuyer = o.buyerId === userId
                  const partnerId = isBuyer ? o.sellerId : o.buyerId

                  return (
                    <tr key={o.id} className="hover:bg-ast-surface/40 transition-colors">
                      <td className="px-4 py-4 font-medium text-black">
                        <Link href={`/dashboard/orders/${o.id}`} className="hover:text-ast-primary transition-colors flex items-center gap-2">
                          <span className="truncate max-w-xs font-semibold">{o.gig?.title ?? `Order #${o.id.slice(0, 8)}`}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-ast-gray text-xs font-medium">
                        {isBuyer ? (
                          <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200 font-semibold">{t('ordersRoleClient')}</span>
                        ) : (
                          <span className="bg-ast-primary/10 text-ast-primary px-2.5 py-0.5 rounded-full border border-ast-primary/20 font-semibold">{t('ordersRoleFreelancer')}</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-black font-bold">{o.amount} TND</td>
                      <td className="px-4 py-4">
                        <span className={`inline-block text-xs rounded-full px-2.5 py-0.5 font-bold ${STATUS_BADGE[o.status] ?? 'bg-ast-surface text-black'}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-ast-gray text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/messages?user=${partnerId}`}
                            className="px-3 py-1.5 rounded-xl border border-black/15 text-xs font-semibold text-ast-dark hover:bg-ast-surface transition-colors flex items-center gap-1"
                            title={isBuyer ? t('ordersContactSeller') : t('ordersContactClient')}
                          >
                            <MessageSquare size={13} className="text-ast-primary" />
                            <span>{isBuyer ? t('ordersContactSeller') : t('ordersContactClient')}</span>
                          </Link>

                          <Link
                            href={`/dashboard/orders/${o.id}`}
                            className="px-3.5 py-1.5 rounded-xl bg-ast-primary text-white text-xs font-semibold hover:bg-ast-dark transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <span>{t('ordersWorkspace')}</span>
                            <ArrowRight size={12} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
