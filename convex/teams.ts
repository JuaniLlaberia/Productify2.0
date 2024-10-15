import { ConvexError, v } from 'convex/values';

import { mutation } from './_generated/server';
import { isAdmin, isAuth } from './auth';
import { Members, Teams } from './schema';

export const createTeam = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const user = await isAuth(ctx);
    if (!user) throw new ConvexError('Must be logged in.');

    //Create team
    const teamId = await ctx.db.insert('teams', {
      name: args.name,
      status: 'inactive',
      createdBy: user._id,
    });

    //Create member with owner permissions
    await ctx.db.insert('members', {
      teamId,
      userId: user._id,
      role: 'owner',
    });

    return teamId;
  },
});

export const updateTeam = mutation({
  args: {
    teamId: v.id('teams'),
    teamData: v.object({
      name: v.optional(Teams.withoutSystemFields.name),
      status: v.optional(Teams.withoutSystemFields.status),
      imageUrl: v.optional(Teams.withoutSystemFields.imageUrl),
    }),
  },
  handler: async (ctx, args) => {
    const user = await isAdmin(ctx, args.teamId);
    if (!user?.role)
      throw new ConvexError(
        'User does not have permissions to perform this action.'
      );

    await ctx.db.patch(args.teamId, { ...args.teamData });
  },
});

export const deleteTeam = mutation({
  args: { teamId: v.id('teams') },
  handler: async (ctx, args) => {
    const user = await isAdmin(ctx, args.teamId);
    if (!user?.role || user?.role === 'admin')
      throw new ConvexError(
        'User does not have permissions to perform this action.'
      );

    //Delete team
    await ctx.db.delete(args.teamId);
    //Delete all data related to this team
    //Research about ENTS and Triggers => Cascading deletions
  },
});

export const deleteMember = mutation({
  args: { teamId: v.id('teams'), userToDelete: v.id('users') },
  handler: async (ctx, args) => {
    const user = await isAdmin(ctx, args.teamId);
    if (!user?.role)
      throw new ConvexError(
        'User does not have permissions to perform this action.'
      );

    const memberToDelete = await ctx.db
      .query('members')
      .withIndex('by_teamId_userId', q =>
        q.eq('teamId', args.teamId).eq('userId', args.userToDelete)
      )
      .first();
    if (!memberToDelete)
      throw new ConvexError('User is not a member of this team.');

    await ctx.db.delete(memberToDelete._id);
    //Should I delete user messages or how to show user where it interacted in the past
  },
});

export const updateMemberRole = mutation({
  args: {
    memberId: v.id('members'),
    teamId: v.id('teams'),
    role: Members.withoutSystemFields.role,
  },
  handler: async (ctx, args) => {
    const user = await isAdmin(ctx, args.teamId);
    if (!user?.role)
      throw new ConvexError(
        'User does not have permissions to perform this action.'
      );

    await ctx.db.patch(args.memberId, { role: args.role });
  },
});