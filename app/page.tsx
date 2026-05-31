import { supabase } from '@/lib/supabaseClient'

export default async function CharacterPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return <div>エラー: {error.message}</div>
  }

  if (!data) {
    return <div>データがない</div>
  }

  return (
    <div>
      <h1>[characters/[id]/page.tsx]</h1>

      <h2>{data.name}</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>

      <div>aa: {id}</div>
    </div>
  )
}