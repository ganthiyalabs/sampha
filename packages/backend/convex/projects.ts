import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAppUserId } from "./lib/auth";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List all projects in a workspace.
 */
export const list = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
  },
});

/**
 * Get a single project by ID.
 */
export const get = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.projectId);
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new project in a workspace.
 */
export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAppUserId(ctx);
    await assertWorkspaceMember(ctx, args.workspaceId, userId);

    const projectId = await ctx.db.insert("projects", {
      workspaceId: args.workspaceId,
      name: args.name,
      description: args.description,
      status: "active",
      startDate: args.startDate,
      endDate: args.endDate,
      createdAt: Date.now(),
      createdBy: userId,
    });
    return projectId;
  },
});

/**
 * Update an existing project.
 */
export const update = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("archived"))),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAppUserId(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    await assertWorkspaceMember(ctx, project.workspaceId, userId);

    const { projectId, ...updates } = args;

    // Filter out undefined values
    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return projectId;
    }

    await ctx.db.patch(projectId, filteredUpdates);
    return projectId;
  },
});

/**
 * Archive a project (soft delete).
 */
export const archive = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAppUserId(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    await assertWorkspaceMember(ctx, project.workspaceId, userId);

    await ctx.db.patch(args.projectId, { status: "archived" });
    return args.projectId;
  },
});

/**
 * Delete a project permanently.
 * Note: This will also need to cascade delete phases and tasks in a real implementation.
 */
export const remove = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAppUserId(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    await assertWorkspaceAdmin(ctx, project.workspaceId, userId);

    await ctx.db.delete(args.projectId);
    return args.projectId;
  },
});

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Assert that the user is a member of the workspace.
 */
async function assertWorkspaceMember(ctx: { db: any }, workspaceId: any, userId: any) {
  const membership = await ctx.db
    .query("workspaceMembers")
    .withIndex("by_workspace_user", (q: any) =>
      q.eq("workspaceId", workspaceId).eq("userId", userId),
    )
    .unique();

  if (!membership) {
    throw new Error("You must be a workspace member to perform this action");
  }
}

/**
 * Assert that the user is an admin of the workspace.
 */
async function assertWorkspaceAdmin(ctx: { db: any }, workspaceId: any, userId: any) {
  const membership = await ctx.db
    .query("workspaceMembers")
    .withIndex("by_workspace_user", (q: any) =>
      q.eq("workspaceId", workspaceId).eq("userId", userId),
    )
    .unique();

  if (!membership || membership.role !== "admin") {
    throw new Error("You must be a workspace admin to perform this action");
  }
}
