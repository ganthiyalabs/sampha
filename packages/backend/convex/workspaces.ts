import { query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      return [];
    }

    // Find the user in the main 'users' table by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .unique();

    if (!user) {
      return [];
    }

    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const workspaces = await Promise.all(
      members.map(async (member) => {
        const workspace = await ctx.db.get(member.workspaceId);
        return workspace;
      }),
    );

    return workspaces.filter((w) => w !== null);
  },
});
