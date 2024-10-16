import { omit } from 'convex-helpers';
import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { Tasks } from './schema';
import { isMember } from './auth';

export const getProjectTasks = query({
  args: {
    teamId: v.id('teams'),
    projectId: v.id('projects'),
    filters: v.object({
      status: v.optional(Tasks.withoutSystemFields.status),
      priority: v.optional(Tasks.withoutSystemFields.priority),
      label: v.optional(Tasks.withoutSystemFields.label),
    }),
  },
  handler: async (ctx, args) => {
    const {
      teamId,
      projectId,
      filters: { status, priority, label },
    } = args;
    await isMember(ctx, teamId);

    let query = ctx.db
      .query('tasks')
      .withIndex('by_teamId_projectId', q =>
        q.eq('teamId', teamId).eq('projectId', projectId)
      )
      .filter(q => q.eq(q.field('isSubTask'), false));

    if (status) query = query.filter(q => q.eq(q.field('status'), status));
    if (priority)
      query = query.filter(q => q.eq(q.field('priority'), priority));
    if (label) query = query.filter(q => q.eq(q.field('label'), label));

    const tasks = query.order('desc').collect();
    return tasks;
  },
});

export const getUserTasksInTeam = query({
  args: {
    teamId: v.id('teams'),
    filters: v.object({
      status: v.optional(Tasks.withoutSystemFields.status),
      priority: v.optional(Tasks.withoutSystemFields.priority),
      label: v.optional(Tasks.withoutSystemFields.label),
    }),
  },
  handler: async (ctx, args) => {
    const {
      teamId,
      filters: { status, priority, label },
    } = args;
    const member = await isMember(ctx, teamId);

    let query = ctx.db
      .query('tasks')
      .withIndex('by_teamId_assignee', q =>
        q.eq('teamId', args.teamId).eq('assignee', member._id)
      )
      .filter(q => q.eq(q.field('isSubTask'), false));

    if (status) query = query.filter(q => q.eq(q.field('status'), status));
    if (priority)
      query = query.filter(q => q.eq(q.field('priority'), priority));
    if (label) query = query.filter(q => q.eq(q.field('label'), label));

    const tasks = await query.order('desc').collect();
    return tasks;
  },
});

export const getSubTasks = query({
  args: { teamId: v.id('teams'), parentTask: v.id('tasks') },
  handler: async (ctx, args) => {
    await isMember(ctx, args.teamId);

    const subTasks = await ctx.db
      .query('tasks')
      .withIndex('by_teamId_parentId', q =>
        q.eq('teamId', args.teamId).eq('parentTask', args.parentTask)
      )
      .filter(q => q.eq(q.field('isSubTask'), true))
      .order('desc')
      .collect();
    return subTasks;
  },
});

export const createTask = mutation({
  args: Tasks.withoutSystemFields,
  handler: async (ctx, args) => {
    await isMember(ctx, args.teamId);

    const taskId = await ctx.db.insert('tasks', {
      ...args,
    });
    return taskId;
  },
});

export const updateTask = mutation({
  args: {
    teamId: v.id('teams'),
    taskId: v.id('tasks'),
    taskData: v.object(
      omit(Tasks.withoutSystemFields, [
        'parentTask',
        'teamId',
        'projectId',
        'isSubTask',
      ])
    ),
  },
  handler: async (ctx, args) => {
    const { teamId, taskData, taskId } = args;
    await isMember(ctx, teamId);

    await ctx.db.patch(taskId, {
      ...taskData,
    });
  },
});

export const deleteTask = mutation({
  args: { teamId: v.id('teams'), taskId: v.id('tasks') },
  handler: async (ctx, args) => {
    const { teamId, taskId } = args;
    await isMember(ctx, teamId);

    await ctx.db.delete(taskId);
  },
});
