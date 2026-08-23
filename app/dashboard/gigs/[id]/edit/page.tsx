import { auth } from '@/lib/auth'
import { db }   from '@/lib/db'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { GigEditForm } from '@/components/dashboard/GigEditForm'

export default async function GigEditPage({ params }: { params: { id: string } }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect('/login')

  let gig: any = null
  try {
    gig = await db.gig.findUnique({ where: { id: params.id } })
    if (!gig) {
      const supabase = await createClient()
      const { data } = await supabase
        .from('Gig')
        .select('*')
        .eq('id', params.id)
        .single()
      if (data) gig = data
    }
  } catch (err) {}

  if (!gig) {
    notFound()
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-heading font-bold text-3xl text-black mb-1">Edit Gig</h1>
        <p className="text-ast-gray text-sm">Update your service listing.</p>
      </div>
      <GigEditForm gig={gig} />
    </div>
  )
}