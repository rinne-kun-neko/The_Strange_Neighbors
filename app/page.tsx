import { supabase } from '@/lib/supabaseClient'

export default async function Page() {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .limit(10)

  if (error) {
    return <div>エラー: {error.message}</div>
  }

  return (
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )

  aaaaaaaaaa
  
}<h1>kkkk</h1>