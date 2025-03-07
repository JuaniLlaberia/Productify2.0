import { ConvexError, v } from 'convex/values';
import { omit } from 'convex-helpers';
import { paginationOptsValidator } from 'convex/server';

import { mutation, query } from './_generated/server';
import { isAdmin, isMember } from './helpers';
import { Channels } from './schema';

//Channels functions

export const getAllChannels = query({
  args: { teamId: v.id('teams'), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const { teamId, paginationOpts } = args;
    const member = await isMember(ctx, args.teamId);
    if (!member) throw new ConvexError('You are not a member of this team');

    const paginatedChannels = await ctx.db
      .query('channels')
      .withIndex('by_teamId', q => q.eq('teamId', teamId))
      .paginate(paginationOpts);

    if (paginatedChannels.page.length === 0) return paginatedChannels;

    const memberChannels = await ctx.db
      .query('channelMembers')
      .withIndex('by_teamId_userId', q =>
        q.eq('teamId', args.teamId).eq('userId', member._id)
      )
      .collect();
    const memberChannelsIds = new Set(
      memberChannels.map(channel => channel.channelId)
    );

    const channels = paginatedChannels.page.map(channel => ({
      ...channel,
      isMember: channel.private ? memberChannelsIds.has(channel._id) : true,
    }));

    return {
      ...paginatedChannels,
      page: channels,
    };
  },
});

export const getChannels = query({
  args: { teamId: v.id('teams') },
  handler: async (ctx, args) => {
    const member = await isMember(ctx, args.teamId);
    if (!member) throw new ConvexError('You are not a member of this team');

    //Get public channels
    const allTeamPublicChannels = await ctx.db
      .query('channels')
      .withIndex('by_teamId', q => q.eq('teamId', args.teamId))
      .filter(q => q.eq(q.field('private'), false))
      .collect();

    //Get private channels
    const channelMembers = await ctx.db
      .query('channelMembers')
      .withIndex('by_teamId_userId', q =>
        q.eq('teamId', args.teamId).eq('userId', member._id)
      )
      .collect();
    const channelIds = channelMembers.map(
      channelMember => channelMember.channelId
    );
    const userChannels = await Promise.all(
      channelIds.map(id => ctx.db.get(id))
    );
    const channels = [...allTeamPublicChannels, ...userChannels];

    return channels.sort((a, b) => b!._creationTime - a!._creationTime);
  },
});

export const getChannelById = query({
  args: { teamId: v.id('teams'), channelId: v.id('channels') },
  handler: async (ctx, args) => {
    await isMember(ctx, args.teamId);

    const channel = await ctx.db
      .query('channels')
      .withIndex('by_id', q => q.eq('_id', args.channelId))
      .first();

    return channel;
  },
});

export const createChannel = mutation({
  args: {
    teamId: v.id('teams'),
    channelData: v.object(omit(Channels.withoutSystemFields, ['teamId'])),
  },
  handler: async (ctx, args) => {
    const { teamId, channelData } = args;

    const user = await isAdmin(ctx, teamId);
    if (!user?.role)
      throw new ConvexError(
        'User does not have permissions to perform this action.'
      );

    const channelId = await ctx.db.insert('channels', {
      ...channelData,
      teamId,
    });

    if (channelData.private)
      await ctx.db.insert('channelMembers', {
        userId: user._id,
        teamId,
        channelId,
      });

    return channelId;
  },
});

export const updateChannel = mutation({
  args: {
    teamId: v.id('teams'),
    channelId: v.id('channels'),
    channelData: v.object(omit(Channels.withoutSystemFields, ['teamId'])),
  },
  handler: async (ctx, args) => {
    const { teamId, channelData, channelId } = args;

    const user = await isAdmin(ctx, teamId);
    if (!user?.role)
      throw new ConvexError(
        'User does not have permissions to perform this action.'
      );

    await ctx.db.patch(channelId, {
      ...channelData,
    });
  },
});

export const deleteChannel = mutation({
  args: { channelId: v.id('channels'), teamId: v.id('teams') },
  handler: async (ctx, args) => {
    const user = await isAdmin(ctx, args.teamId);
    if (!user?.role)
      throw new ConvexError(
        'User does not have permissions to perform this action.'
      );

    await ctx.db.delete(args.channelId);

    //Implement cascading for tasks and all related elements or manually?
  },
});

//Channels members functions

export const getChannelMembers = query({
  args: { channelId: v.id('channels'), teamId: v.id('teams') },
  handler: async (ctx, args) => {
    const { channelId, teamId } = args;
    await isMember(ctx, teamId);

    const members = await ctx.db
      .query('channelMembers')
      .withIndex('by_channelId', q => q.eq('channelId', channelId))
      .collect();

    const membersWithData = await Promise.all(
      members.map(async member => {
        const userData = await ctx.db.get(member.userId);

        if (!userData) return null;

        return {
          ...userData,
          memberId: member._id,
          teamId: member.teamId,
        };
      })
    );

    return membersWithData.filter(
      (member): member is NonNullable<typeof member> => member !== null
    );
  },
});

export const createChannelMembers = mutation({
  args: {
    channelId: v.id('channels'),
    userIds: v.array(v.id('users')),
    teamId: v.id('teams'),
  },
  handler: async (ctx, args) => {
    const { teamId, channelId, userIds } = args;
    const user = await isAdmin(ctx, args.teamId);
    if (!user?.role)
      throw new ConvexError(
        'User does not have permissions to perform this action.'
      );

    const existingMembers = await ctx.db
      .query('channelMembers')
      .withIndex('by_channelId', q => q.eq('channelId', channelId))
      .collect();

    const newUserIds = userIds.filter(
      userId => !existingMembers.some(member => member.userId === userId)
    );

    if (newUserIds.length === 0) {
      throw new ConvexError('All selected users are already channel members');
    }

    await Promise.all(
      newUserIds.map(user =>
        ctx.db.insert('channelMembers', {
          teamId,
          channelId,
          userId: user,
        })
      )
    );
  },
});

export const removeChannelMember = mutation({
  args: {
    channelMember: v.id('channelMembers'),
    teamId: v.id('teams'),
  },
  handler: async (ctx, args) => {
    const { teamId, channelMember } = args;

    const user = await isAdmin(ctx, teamId);
    if (!user?.role)
      throw new ConvexError(
        'User does not have permissions to perform this action.'
      );

    await ctx.db.delete(channelMember);
  },
});

export const leaveChannel = mutation({
  args: {
    teamId: v.id('teams'),
    channelId: v.id('channels'),
  },
  handler: async (ctx, args) => {
    const { teamId, channelId } = args;
    const member = await isMember(ctx, teamId);
    if (!member) throw new ConvexError('You are not a member of this team');

    const channel = await ctx.db.get(channelId);
    const channelMemberId = (
      await ctx.db
        .query('channelMembers')
        .withIndex('by_channelId_userId', q =>
          q.eq('channelId', channelId).eq('userId', member._id)
        )
        .first()
    )?._id;

    if (channel?.private && !channelMemberId)
      throw new ConvexError('You are not a member of this channel.');

    if (channelMemberId) await ctx.db.delete(channelMemberId);
  },
});
