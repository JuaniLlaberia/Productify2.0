'use client';

import dynamic from 'next/dynamic';
import { format, isToday, isYesterday } from 'date-fns';
import { useMutation } from 'convex/react';
import { toast } from 'sonner';
import { useState } from 'react';

import Thumbnail from '@/components/ui/thumbnail';
import Hint from '@/components/ui/hint';
import ChannelThread from './ChatThread';
import ThreadBar from './ThreadBar';
import { Doc, Id } from '../../../../../../convex/_generated/dataModel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageToolbar } from './MessageToolbar';
import { api } from '../../../../../../convex/_generated/api';
import { cn } from '@/lib/utils';
import { Reactions } from './Reactions';
import { usePanel } from '../../(context)/PanelContext';
import UserPanel from '../../(components)/UserPanel';

const Renderer = dynamic(() => import('@/components/Renderer'), { ssr: false });
const Editor = dynamic(() => import('@/components/Editor'), { ssr: false });

const formatFullTime = (date: Date) => {
  return `${isToday(date) ? 'Today' : isYesterday(date) ? 'Yesturday' : format(date, 'MMM d, yyyy')} at ${format(date, 'hh:mm:ss a')}`;
};

type MessageProps = {
  id: Id<'messages'>;
  teamId: Id<'teams'>;
  isAuthor: boolean;
  authorImage?: string;
  authorName?: string;
  reactions: Array<
    Omit<Doc<'reactions'>, 'userId'> & {
      count: number;
      userIds: Id<'users'>[];
    }
  >;
  body: Doc<'messages'>['message'];
  image: string | null | undefined;
  createdAt: Doc<'messages'>['_creationTime'];
  isEdited: boolean;
  isEditing: boolean;
  isCompact?: boolean;
  setEditingId: (id: Id<'messages'> | null) => void;
  hideThreadButton?: boolean;
  threadCount?: number;
  threadImage?: string;
  threadTimestampt?: number;
};

const Message = ({
  id,
  isAuthor,
  teamId,
  authorImage,
  authorName = 'Member',
  reactions,
  body,
  image,
  createdAt,
  isEdited,
  isEditing,
  isCompact,
  setEditingId,
  hideThreadButton,
  threadCount,
  threadImage,
  threadTimestampt,
}: MessageProps) => {
  const { openPanel, closePanel } = usePanel();

  const handleThread = () => {
    openPanel({
      content: <ChannelThread messageId={id} onClose={() => closePanel()} />,
    });
  };

  const handleUserPanel = () => {
    openPanel({ content: <UserPanel onClose={() => closePanel()} /> });
  };

  const [isPending, setIsPending] = useState<boolean>(false);
  const updateMessage = useMutation(api.messages.updateMessage);
  const handleUpdate = async ({ body }: { body: string }) => {
    setIsPending(true);
    try {
      await updateMessage({
        teamId,
        messageId: id,
        messageData: { message: body },
      });
      toast.success('Message updated successfully');
      setEditingId(null);
    } catch {
      toast.error('Failed to update message');
    } finally {
      setIsPending(false);
    }
  };

  const toggleReaction = useMutation(api.reactions.toggle);
  const handleReaction = async (value: string) => {
    try {
      toggleReaction({ teamId, messageId: id, value });
    } catch {
      toast.error('Failed to add reaction');
    }
  };

  if (isCompact)
    return (
      <div
        className={cn(
          'flex flex-col gap-2 p-1.5 px-5 hover:bg-primary/[3%] dark:hover:bg-muted/20 group relative rounded-md',
          isEditing && 'hover:bg-muted/15'
        )}
      >
        <div className='flex items-start gap-2'>
          <Hint label={formatFullTime(new Date(createdAt))}>
            <button className='text-xs text-muted-foreground opacity-0 group-hover:opacity-100 w-[40px] leading-[22px] text-center hover:underline'>
              {format(new Date(createdAt), 'hh:mm')}
            </button>
          </Hint>
          {isEditing ? (
            <div className='w-full h-full'>
              <Editor
                onSubmit={handleUpdate}
                disabled={isPending}
                defaultValue={JSON.parse(body)}
                onCancel={() => setEditingId(null)}
                variant='update'
              />
            </div>
          ) : (
            <div className='flex flex-col w-full'>
              <Renderer value={body} />
              <Thumbnail url={image} />
              {isEdited && (
                <span className='text-xs text-muted-foreground'>(edited)</span>
              )}
              <Reactions data={reactions} onChange={handleReaction} />
              <ThreadBar
                count={threadCount}
                image={threadImage}
                timestamp={threadTimestampt}
                onClick={handleThread}
              />
            </div>
          )}
        </div>
        {!isEditing && (
          <MessageToolbar
            teamId={teamId}
            messageId={id}
            isAuthor={isAuthor}
            isPending={isPending}
            handleEdit={() => setEditingId(id)}
            handleThread={handleThread}
            handleReaction={handleReaction}
            hideThreadButton={hideThreadButton}
          />
        )}
      </div>
    );

  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-1.5 px-5 hover:bg-primary/[3%] dark:hover:bg-muted/20 group relative rounded-md',
        isEditing && 'hover:bg-muted/15'
      )}
    >
      <div className='flex items-start gap-2'>
        <button>
          <Avatar>
            <AvatarImage src={authorImage} alt='Author photo' />
            <AvatarFallback>{authorName.at(0)?.toUpperCase()}</AvatarFallback>
          </Avatar>
        </button>
        {isEditing ? (
          <div className='w-full h-full'>
            <Editor
              onSubmit={handleUpdate}
              disabled={isPending}
              defaultValue={JSON.parse(body)}
              onCancel={() => setEditingId(null)}
              variant='update'
            />
          </div>
        ) : (
          <div className='flex flex-col w-full overflow-hidden'>
            <div className='text-sm'>
              <button
                className='font-bold text-primary hover:underline'
                onClick={handleUserPanel}
              >
                {authorName}
              </button>
              <span>&nbsp;&nbsp;</span>
              <Hint label={formatFullTime(new Date(createdAt))}>
                <button className='text-xs text-muted-foreground hover:underline'>
                  {format(new Date(createdAt), 'hh:mm')}
                </button>
              </Hint>
            </div>
            <Renderer value={body} />
            <Thumbnail url={image} />
            {isEdited && (
              <span className='text-xs text-muted-foreground'>(edited)</span>
            )}
            <Reactions data={reactions} onChange={handleReaction} />
            <ThreadBar
              count={threadCount}
              image={threadImage}
              timestamp={threadTimestampt}
              onClick={handleThread}
            />
          </div>
        )}
      </div>
      {!isEditing && (
        <MessageToolbar
          teamId={teamId}
          messageId={id}
          isAuthor={isAuthor}
          isPending={isPending}
          handleEdit={() => setEditingId(id)}
          handleThread={handleThread}
          handleReaction={handleReaction}
          hideThreadButton={hideThreadButton}
        />
      )}
    </div>
  );
};

export default Message;
