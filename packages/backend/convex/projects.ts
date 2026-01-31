import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAppUserId, assertWorkspaceMember, assertWorkspaceAdmin } from "./lib/auth";

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

    if (Object.values(updates).some((v) => v !== undefined)) {
      await ctx.db.patch(projectId, updates);
    }
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

    // 1. Delete phases and their activities
    const phases = await ctx.db
      .query("phases")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const phase of phases) {
      // Delete activities for this phase
      const phaseActivities = await ctx.db
        .query("activities")
        .withIndex("by_entity", (q) => q.eq("entityId", phase._id))
        .collect();
      for (const activity of phaseActivities) {
        await ctx.db.delete(activity._id);
      }
      await ctx.db.delete(phase._id);
    }

    // 2. Delete project activities
    const projectActivities = await ctx.db
      .query("activities")
      .withIndex("by_entity", (q) => q.eq("entityId", args.projectId))
      .collect();

    for (const activity of projectActivities) {
      await ctx.db.delete(activity._id);
    }

    // 3. Delete tasks and their related data
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const task of tasks) {
      // Delete subtasks
      const subtasks = await ctx.db
        .query("subtasks")
        .withIndex("by_task", (q) => q.eq("taskId", task._id))
        .collect();
      for (const subtask of subtasks) {
        await ctx.db.delete(subtask._id);
      }

      // Delete comments
      const comments = await ctx.db
        .query("comments")
        .withIndex("by_task", (q) => q.eq("taskId", task._id))
        .collect();
      for (const comment of comments) {
        await ctx.db.delete(comment._id);
      }

      // Delete task dependencies (both directions)
      const dependenciesFrom = await ctx.db
        .query("taskDependencies")
        .withIndex("by_from_task", (q) => q.eq("fromTaskId", task._id))
        .collect();
      for (const dep of dependenciesFrom) {
        await ctx.db.delete(dep._id);
      }

      const dependenciesTo = await ctx.db
        .query("taskDependencies")
        .withIndex("by_to_task", (q) => q.eq("toTaskId", task._id))
        .collect();
      for (const dep of dependenciesTo) {
        // Avoid double deletion if self-reference exists (unlikely but safe)
        // or if fetched in "from" list above (also unlikely for properly formed deps)
        // But since we are iterating different lists, we might have overlap if we had other logic, but here "from" and "to" are distinct columns.
        // If A->B, A is from, B is to.
        // If we delete A:
        //  - "from" list has A->B. Delete it.
        //  - "to" list has X->A. Delete it.
        // These are distinct records.
        await ctx.db.delete(dep._id);
      }

      // Delete Github Links & External Comments
      const githubLinks = await ctx.db
        .query("githubLinks")
        .withIndex("by_task", (q) => q.eq("taskId", task._id))
        .collect();
      for (const link of githubLinks) {
        const externalComments = await ctx.db
          .query("externalComments")
          .withIndex("by_github_link", (q) => q.eq("githubLinkId", link._id))
          .collect();
        for (const comment of externalComments) {
          await ctx.db.delete(comment._id);
        }
        await ctx.db.delete(link._id);
      }

      // Delete task activities
      const taskActivities = await ctx.db
        .query("activities")
        .withIndex("by_entity", (q) => q.eq("entityId", task._id))
        .collect();
      for (const activity of taskActivities) {
        await ctx.db.delete(activity._id);
      }

      await ctx.db.delete(task._id);
    }

    await ctx.db.delete(args.projectId);
    return args.projectId;
  },
});

// ============================================================================
// HELPERS
// ============================================================================

