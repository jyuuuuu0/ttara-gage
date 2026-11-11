import { redirect } from "next/navigation";
import ReportForm from "@/components/ReportForm";
import { getUser } from "@/lib/supabase/server";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/idol/${id}/report`)}`);
  return <ReportForm idolId={id} />;
}
