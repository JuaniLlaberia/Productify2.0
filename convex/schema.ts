import { defineSchema } from 'convex/server';
import { v } from 'convex/values';
import { Table } from 'convex-helpers/server';

const prioritySchema = v.union(
  v.literal('low'),
  v.literal('medium'),
  v.literal('high'),
  v.literal('urgent')
);

const taskStatusSchema = v.union(
  v.literal('backlog'),
  v.literal('todo'),
  v.literal('in-progress'),
  v.literal('completed'),
  v.literal('canceled')
);

const messageTypeEnum = v.union(
  v.literal('text'),
  v.literal('image'),
  v.literal('poll')
);
const durationEnum = v.union(
  v.literal('1h'),
  v.literal('4h'),
  v.literal('8h'),
  v.literal('24h'),
  v.literal('3d'),
  v.literal('1w')
);

export const Users = Table('users', {
  fullName: v.string(),
  email: v.string(),
  profileImage: v.optional(v.string()),
  clerkIdentifier: v.string(),
});

export const Teams = Table('teams', {
  name: v.string(),
  imageUrl: v.optional(v.string()),
  status: v.union(
    v.literal('active'),
    v.literal('inactive'),
    v.literal('mantainance')
  ),
  joinCode: v.optional(v.number()),
  createdBy: v.id('users'),
});

export const Members = Table('members', {
  userId: v.id('users'),
  teamId: v.id('teams'),
  role: v.union(v.literal('owner'), v.literal('admin'), v.literal('member')),
});

export const Projects = Table('projects', {
  name: v.string(),
  description: v.string(),
  icons: v.object({
    type: v.string(),
    color: v.string(),
  }),
  public: v.boolean(),
  autojoin: v.boolean(),
  createdBy: v.id('users'),
  teamId: v.id('teams'),
});

export const ProjectMembers = Table('projectMembers', {
  userId: v.id('users'),
  projectId: v.id('projects'),
  teamId: v.id('teams'),
});

export const Tasks = Table('taks', {
  title: v.string(),
  description: v.string(),
  status: taskStatusSchema,
  priority: prioritySchema,
  label: v.id('label'),
  dueDate: v.number(),
  parentTask: v.id('taks'),
  isSubTask: v.boolean(),
  assignee: v.id('users'),
  projectId: v.id('projects'),
  teamId: v.id('teams'),
});

export const Templates = Table('templates', {
  title: v.string(),
  description: v.string(),
  status: taskStatusSchema,
  priority: prioritySchema,
  label: v.id('label'),
  teamId: v.id('teams'),
});

export const Channels = Table('channels', {
  name: v.string(),
  icon: v.string(),
  allowsWritting: v.boolean(),
  teamId: v.id('teams'),
});

export const ChannelMembers = Table('channelMembers', {
  userId: v.id('users'),
  channelId: v.id('channels'),
  teamId: v.id('teams'),
});

export const Messages = Table('messages', {
  //Common (all) messages fields
  message: v.string(),
  type: messageTypeEnum,
  channelId: v.id('channels'),
  teamId: v.id('teams'),
  userId: v.id('users'),
  isEdited: v.boolean(),
  isResponse: v.boolean(),
  parentMessage: v.id('messages'),
  //Images messages fields
  imageUrl: v.optional(v.string()),
  //Poll message fields
  question: v.optional(v.string()),
  options: v.optional(
    v.array(
      v.object({
        text: v.string(),
        quantity: v.number(),
        votes: v.array(v.id('users')),
      })
    )
  ),
  allowsMultiAnswer: v.optional(v.boolean()),
  duration: durationEnum,
});

export const Reports = Table('reports', {
  title: v.string(),
  description: v.string(),
  type: v.union(
    v.literal('ui/ux'),
    v.literal('functional'),
    v.literal('performance'),
    v.literal('security'),
    v.literal('other')
  ),
  priority: prioritySchema,
  teamId: v.id('teams'),
  createdBy: v.id('users'),
});

export const Documents = Table('documents', {
  title: v.optional(v.string()),
  content: v.optional(v.string()),
  isArchived: v.boolean(),
  icon: v.optional(v.string()),
  converImage: v.optional(v.string()),
  isPublished: v.boolean(),
  parentDocument: v.optional(v.id('documents')),
  createdBy: v.id('users'),
  teamId: v.id('teams'),
});

export default defineSchema({
  users: Users.table
    .index('by_clerkId', ['clerkIdentifier'])
    .index('by_email', ['email']),
  teams: Teams.table
    .index('by_createdUserId', ['createdBy'])
    .index('by_joinCode', ['joinCode']),
  members: Members.table
    .index('by_userId', ['userId'])
    .index('by_teamId', ['teamId'])
    .index('by_teamId_userId', ['teamId', 'userId']),
  projects: Projects.table.index('by_teamId', ['teamId']),
  projectMembers: ProjectMembers.table
    .index('by_projectId', ['projectId'])
    .index('by_userId', ['userId']),
  tasks: Tasks.table
    .index('by_teamId_projectId', ['teamId', 'projectId'])
    .index('by_teamId_assignee', ['teamId', 'assignee']),
  templates: Templates.table.index('by_teamId', ['teamId']),
  channels: Channels.table.index('by_teamId', ['teamId']),
  channelMembers: ChannelMembers.table
    .index('by_channelId', ['channelId'])
    .index('by_userId', ['userId']),
  messages: Messages.table
    .index('by_teamId_channelId', ['teamId', 'channelId'])
    .index('by_teamId_userId', ['teamId', 'userId'])
    .index('by_parentId', ['parentMessage']),
  reports: Reports.table.index('by_teamId', ['teamId']),
  documents: Documents.table
    .index('by_userId', ['createdBy'])
    .index('by_userId_parentId', ['createdBy', 'parentDocument'])
    .index('by_teamId', ['teamId']),
});