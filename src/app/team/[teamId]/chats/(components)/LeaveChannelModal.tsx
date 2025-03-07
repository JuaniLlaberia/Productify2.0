'use client';

import { AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { api } from '../../../../../../convex/_generated/api';
import { Id } from '../../../../../../convex/_generated/dataModel';

type LeaveChannelProps = {
  teamId: Id<'teams'>;
  channelId: Id<'channels'>;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
};

const LeaveChannelModal = ({
  teamId,
  channelId,
  onSuccess,
  trigger,
}: LeaveChannelProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const leaveChannel = useMutation(api.channels.leaveChannel);

  const handleLeaveChannel = async () => {
    setIsLoading(true);

    try {
      await leaveChannel({ teamId, channelId });

      onSuccess?.();
      setIsOpen(false);
      toast.success('Channel left successfully');
      router.push(`/team/${teamId}/chats/channels`);
    } catch {
      toast.error('Failed to leave channel');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size='sm' variant='destructive'>
            <Trash2 className='size-4 mr-1.5' strokeWidth={1.5} />
            Leave channel
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave channel</DialogTitle>
          <DialogDescription>
            You are about to leave this channel.
          </DialogDescription>
        </DialogHeader>
        <Alert variant='informative'>
          <AlertCircle className='size-4' strokeWidth={1.5} />
          <AlertTitle>Information</AlertTitle>
          <AlertDescription>
            You can re-join after leaving. It&apos;s not permanent.
          </AlertDescription>
        </Alert>
        <DialogFooter>
          <DialogClose asChild>
            <Button size='sm' variant='outline' disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            disabled={isLoading}
            size='sm'
            variant='destructive'
            onClick={handleLeaveChannel}
            className='min-w-16'
          >
            {isLoading ? (
              <Loader2 className='size-4 animate-spin' />
            ) : (
              'Confirm'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LeaveChannelModal;
