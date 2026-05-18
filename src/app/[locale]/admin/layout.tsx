import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { locale } = await params;

  if (!session) {
    redirect(`/${locale}/login`);
  }

  return <>{children}</>;
}
