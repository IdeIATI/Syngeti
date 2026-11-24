import { prisma } from "@/lib/prisma";

export interface ConnectChatInitialData {
  currentUser: { id: string; name: string; avatar: string | null };
  users: Array<{
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    job_title: string | null;
    status?: string;
    last_seen_at?: Date | null;
    isOnline?: boolean;
    lastSeen?: number | null;
  }>;
  channels: any[];
  mainChannelId: string;
  departments: Array<{ id: string; name: string }>;
}

/**
 * Carregador centralizado de dados do Connect Chat (usado tanto pelo ERP /connect quanto pelo App Independente /chat)
 * Garante 100% de paridade, eliminando duplicidade de lógica e de queries ao banco de dados.
 */
export async function loadConnectChatData(session: any): Promise<ConnectChatInitialData> {
  const currentUserId = session.user.id;
  const currentUserEmail = session.user.email?.toLowerCase();

  let dbUser: { id: string; name: string; avatar: string | null } | null = null;
  let prismaUsers: Array<{
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    job_title: string | null;
    status: string;
    last_seen_at: Date | null;
  }> = [];
  let mainChannelFound: any = null;
  let userChannels: any[] = [];
  let departments: Array<{ id: string; name: string }> = [];

  try {
    // Executa as 3 consultas essenciais em paralelo
    const [usersResult, channelsResult, deptsResult] = await Promise.allSettled([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          job_title: true,
          status: true,
          last_seen_at: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.chatChannel.findMany({
        where: {
          OR: [
            { is_group: true },
            { members: { some: { id: currentUserId } } },
          ],
        },
        include: {
          members: {
            select: { id: true, name: true, avatar: true, email: true, job_title: true },
          },
        },
        orderBy: { created_at: "asc" },
      }),
      prisma.department.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    if (usersResult.status === "fulfilled") prismaUsers = usersResult.value;
    if (channelsResult.status === "fulfilled") {
      userChannels = channelsResult.value;
      mainChannelFound = userChannels.find((c) => c.name === "Geral") || null;
    }
    if (deptsResult.status === "fulfilled") departments = deptsResult.value;

    // Resolve o usuário autenticado diretamente da lista
    if (prismaUsers.length > 0) {
      const match = prismaUsers.find(
        (u) => u.id === currentUserId || (currentUserEmail && u.email?.toLowerCase() === currentUserEmail)
      );
      if (match) {
        dbUser = { id: match.id, name: match.name, avatar: match.avatar };
      }
    }
  } catch (err) {
    console.error("[loadConnectChatData] Contingência ao carregar dados iniciais:", err);
  }

  // Fallback se id for admin-master
  if (!dbUser && prismaUsers.length > 0) {
    const firstMatch =
      (currentUserEmail && prismaUsers.find((u) => u.email.toLowerCase() === currentUserEmail)) ||
      prismaUsers[0];
    if (firstMatch) {
      dbUser = { id: firstMatch.id, name: firstMatch.name, avatar: firstMatch.avatar };
    }
  }

  const currentUser = dbUser || {
    id: currentUserId,
    name: session.user.name || "Usuário",
    avatar: null,
  };

  // Marcar presença do usuário logado
  let isUserOnlineFn: (id: string, email?: string | null, lastSeen?: Date | null) => boolean = () => false;
  let getUserLastSeenFn: (id: string, email?: string | null, lastSeen?: Date | null) => number | null = () => null;
  try {
    const presenceMod = await import("@/lib/presence");
    presenceMod.recordUserPresence(currentUser.id, currentUser.name || undefined, session.user.email || undefined);
    isUserOnlineFn = presenceMod.isUserOnline;
    getUserLastSeenFn = presenceMod.getUserLastSeen;
  } catch {}

  const userMap = new Map<string, any>();
  for (const u of prismaUsers) {
    if (u.email) {
      userMap.set(u.email.toLowerCase(), { ...u });
    }
  }

  const users = Array.from(userMap.values())
    .filter((u) => {
      const isMeById = u.id === currentUser.id || u.id === session.user.id;
      const isMeByEmail = currentUserEmail && u.email.toLowerCase() === currentUserEmail;
      return !isMeById && !isMeByEmail;
    })
    .map((u) => ({
      ...u,
      isOnline: isUserOnlineFn(u.id, u.email, u.last_seen_at),
      lastSeen: getUserLastSeenFn(u.id, u.email, u.last_seen_at),
    }));

  users.sort((a, b) => {
    if (a.isOnline === b.isOnline) return a.name.localeCompare(b.name);
    return a.isOnline ? -1 : 1;
  });

  // Garante que o canal "Geral" exista
  let mainChannel = mainChannelFound;
  let channels = userChannels;

  if (!mainChannel) {
    try {
      mainChannel = await prisma.chatChannel.create({
        data: { name: "Geral", is_group: true },
      });
      channels = [{ ...mainChannel, members: [] }, ...channels];
    } catch {
      const existingGeral = channels.find((c) => c.name === "Geral");
      if (existingGeral) {
        mainChannel = existingGeral;
      } else {
        mainChannel = {
          id: "fallback-geral",
          name: "Geral",
          is_group: true,
          members: [],
        };
        channels = [mainChannel, ...channels];
      }
    }
  }

  return {
    currentUser,
    users,
    channels,
    mainChannelId: mainChannel.id,
    departments,
  };
}
