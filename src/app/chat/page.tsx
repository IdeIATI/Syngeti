import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { loadConnectChatData } from "@/lib/chatServerData";
import { StandaloneChatWrapper } from "@/components/chat/StandaloneChatWrapper";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StandaloneChatPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/chat");

  const data = await loadConnectChatData(session);

  return (
    <StandaloneChatWrapper
      currentUser={data.currentUser}
      users={data.users}
      channels={data.channels}
      mainChannelId={data.mainChannelId}
      departments={data.departments}
    />
  );
}
