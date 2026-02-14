import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAppUserId, assertWorkspaceMember } from "./lib/auth";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List all status configs for a workspace, sorted by order.
 */
export const list = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const configs = await ctx.db
      .query("statusConfigs")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    return configs.sort((a, b) => a.order - b.order);
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new status config.
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

    // Determine the next order value
    const existing = await ctx.db
      .query("statusConfigs")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const maxOrder = existing.length > 0
      ? Math.max(...existing.map((c) => c.order))
      : -1;

    const configId = await ctx.db.insert("statusConfigs", {
      workspaceId: args.workspaceId,
      name: args.name,
      order: maxOrder + 1,
      color: args.color,
      isTerminal: args.isTerminal ?? false,
    });

    return configId;
  },
});

/**
 * Seed default status configs for a workspace if none exist.
 */
export const seed = mutation({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAppUserId(ctx);
    await assertWorkspaceMember(ctx, args.workspaceId, userId);

    const existing = await ctx.db
      .query("statusConfigs")
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
      const id = await ctx.db.insert("statusConfigs", {
        workspaceId: args.workspaceId,
        ...defaults[i],
        order: i,
      });
      results.push(id);
    }

    return results;
  },
});
