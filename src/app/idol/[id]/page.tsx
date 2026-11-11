import { redirect } from "next/navigation";
import IdolView from "@/components/IdolView";
import { getUser } from "@/lib/supabase/server";

/** 아이돌 목록은 누구나 볼 수 있지만, 성지 페이지부터는 로그인해야 한다 */
export default async function IdolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/idol/${id}`)}`);
  return <IdolView id={id} />;
}
