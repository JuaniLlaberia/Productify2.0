'use client';

import { AlertCircle } from 'lucide-react';
import { useMutation } from 'convex/react';

import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { api } from '../../../../../../../../convex/_generated/api';
import { Id } from '../../../../../../../../convex/_generated/dataModel';

const DeleteLabelsModal = ({
  teamId,
  ids,
  onSuccess,
}: {
  teamId: Id<'teams'>;
  ids: Id<'labels'>[];
  onSuccess?: () => void;
}) => {
  const deleteLabels = useMutation(api.labels.deleteLabels);

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete {ids.length > 1 ? 'labels' : 'label'}</DialogTitle>
        <DialogDescription>
          You are about to delete{' '}
          {ids.length > 1 ? 'these labels' : 'this label'}. All data related
          will be deleted.
        </DialogDescription>
      </DialogHeader>
      <Alert variant='destructive'>
        <AlertCircle className='size-4' strokeWidth={1.5} />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>This action is not reversible.</AlertDescription>
      </Alert>
      <DialogFooter>
        <DialogClose asChild>
          <Button size='sm' variant='outline'>
            Cancel
          </Button>
        </DialogClose>
        <Button
          size='sm'
          variant='destructive'
          onClick={async () => {
            await deleteLabels({ teamId, labelsIds: ids });
            onSuccess?.();
          }}
        >
          Confirm
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default DeleteLabelsModal;