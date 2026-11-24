import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ChatInterface from "./ChatInterface";
import { loadConnectChatData } from "@/lib/chatServerData";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ConnectPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const data = await loadConnectChatData(session);

  return (
    <div className="flex-1 overflow-hidden h-full min-h-0 flex flex-col">
      <ChatInterface
        currentUser={data.currentUser}
        users={data.users}
        channels={data.channels}
        mainChannelId={data.mainChannelId}
        departments={data.departments}
      />
    </div>
  );
}
