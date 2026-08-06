import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { GigEditForm } from '@/components/dashboard/GigEditForm'

export default async function GigEditPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  
  // 1. Authenticate the user securely via Supabase
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Fetch the specific gig from your new Supabase table
  const { data: gig, error } = await supabase
    .from('Gig')
    .select('*')
    .eq('id', params.id)
    .single()

  // 3. Security Check: Ensure the gig exists AND belongs to the currently logged-in freelancer
  if (error || !gig || gig.freelancerId !== user.id) {
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