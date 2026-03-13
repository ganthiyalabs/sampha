import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAppUserId, assertWorkspaceMember } from "./lib/auth";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List all groups for a workspace, sorted by order.
 */
export const list = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const groups = await ctx.db
      .query("groups")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .take(100);

    return groups.sort((a, b) => a.order - b.order);
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new group.
 */
export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    color: v.string(),
    isTerminal: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAppUserId(ctx);
    await assertWorkspaceMember(ctx, args.workspaceId, userId);

    // Check for uniqueness within workspace (case-insensitive)
    const normalizedName = args.name.trim().toLowerCase();
    const existingGroups = await ctx.db
      .query("groups")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const nameExists = existingGroups.some(
      (g) => g.name.trim().toLowerCase() === normalizedName
    );

    if (nameExists) {
      throw new Error(`A group with the name "${args.name}" already exists`);
    }

    // Determine the next order value
    const maxOrder = existingGroups.length > 0
      ? Math.max(...existingGroups.map((c: any) => c.order))
      : -1;

    const groupId = await ctx.db.insert("groups", {
      workspaceId: args.workspaceId,
      name: args.name,
      order: maxOrder + 1,
      color: args.color,
      isTerminal: args.isTerminal ?? false,
    });

    return groupId;
  },
});

/**
 * Update an existing group.
 */
export const update = mutation({
  args: {
    groupId: v.id("groups"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { groupId, ...updates } = args;
    const group = await ctx.db.get(groupId);
    if (!group) throw new Error("Group not found");

    const userId = await getAppUserId(ctx);
    await assertWorkspaceMember(ctx, group.workspaceId, userId);

    // If name is being updated, check for uniqueness
    if (updates.name && updates.name.trim().toLowerCase() !== group.name.trim().toLowerCase()) {
      const normalizedNewName = updates.name.trim().toLowerCase();
      const existingGroups = await ctx.db
        .query("groups")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", group.workspaceId))
        .collect();

      const nameExists = existingGroups.some(
        (g) => g._id !== groupId && g.name.trim().toLowerCase() === normalizedNewName
      );

      if (nameExists) {
        throw new Error(`A group with the name "${updates.name}" already exists`);
      }
    }

    // If name is being updated, we need to migrate tasks to the new status slug
    if (updates.name && updates.name !== group.name) {
      const oldSlug = group.name.toLowerCase().replace(/\s+/g, "_");
      const newSlug = updates.name.toLowerCase().replace(/\s+/g, "_");

      if (oldSlug !== newSlug) {
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", group.workspaceId))
          .filter((q) => q.eq(q.field("status"), oldSlug))
          .collect();

        await Promise.all(
          tasks.map((task) => ctx.db.patch(task._id, { status: newSlug }))
        );
      }
    }

    await ctx.db.patch(groupId, updates);
    return groupId;
  },
});

/**
 * Remove a group and all tasks within it.
 */
export const remove = mutation({
  args: {
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    const userId = await getAppUserId(ctx);
    await assertWorkspaceMember(ctx, group.workspaceId, userId);

    // 1. Delete all tasks in this group (status matches group ID or name identifier)
    // The current UI uses the "id" which is derived from name, 
    // but the actual tasks might use the group name or id as status string.
    // Let's check how tasks store status.
    const statusIdentifier = group.name.toLowerCase().replace(/\s+/g, "_");
    
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", group.workspaceId))
      .filter((q) => q.eq(q.field("status"), statusIdentifier))
      .collect();

    await Promise.all(tasks.map((task) => ctx.db.delete(task._id)));

    // 2. Delete the group itself
    await ctx.db.delete(args.groupId);

    return args.groupId;
  },
});

/**
 * Seed default groups for a workspace if none exist.
 */
export const seed = mutation({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAppUserId(ctx);
    await assertWorkspaceMember(ctx, args.workspaceId, userId);

    const existing = await ctx.db
      .query("groups")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    if (existing.length > 0) {
      return existing.sort((a, b) => a.order - b.order);
    }

    const defaults = [
      { name: "Backlog", color: "#6b7280", isTerminal: false },
      { name: "To Do", color: "#3b82f6", isTerminal: false },
      { name: "In Progress", color: "#f59e0b", isTerminal: false },
      { name: "Done", color: "#10b981", isTerminal: true },
      { name: "Canceled", color: "#ef4444", isTerminal: true },
    ];

    const results = [];
    for (let i = 0; i < defaults.length; i++) {
      const id = await ctx.db.insert("groups", {
        workspaceId: args.workspaceId,
        ...defaults[i],
        order: i,
      });
      results.push(id);
    }

    return results;
  },
});
