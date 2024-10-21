'use client';

import { useMutation } from 'convex/react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Files, Plus, PlusCircle } from 'lucide-react';

import DocumentsList from './DocumentsList';
import DocumentItem from './DocumentItem';
import { Id } from '../../../../../../convex/_generated/dataModel';
import { api } from '../../../../../../convex/_generated/api';

const DocumentsLinks = () => {
  const { teamId } = useParams();
  const createDocument = useMutation(api.documents.createDocument);

  const handleDocCreate = async () => {
    const promise = createDocument({
      title: 'Untitled',
      teamId: teamId as Id<'teams'>,
    });

    toast.promise(promise, {
      loading: 'Creating new document',
      success: 'Document created successfully',
      error: 'Failed to create document',
    });
  };

  return (
    <>
      <h3 className='flex items-center justify-between text-xs uppercase font-semibold text-muted-foreground mb-2'>
        <span className='py-0.5'>General</span>
      </h3>
      <DocumentItem
        label='New document'
        icon={<PlusCircle className='size-4' strokeWidth={1.5} />}
        onClick={handleDocCreate}
      />
      <DocumentItem
        label='My documents'
        icon={<Files className='size-4' strokeWidth={1.5} />}
        onClick={() => {}}
      />
      <h3 className='flex items-center justify-between text-xs uppercase font-semibold text-muted-foreground mt-4 mb-2 group'>
        <span className='py-0.5'>Your documents</span>
        <span
          onClick={handleDocCreate}
          className='hover:bg-gray-200 hidden group-hover:flex p-0.5 rounded transition-colors cursor-pointer'
        >
          <Plus className='size-4' />
        </span>
      </h3>
      <DocumentsList teamId={teamId as Id<'teams'>} />
    </>
  );
};

export default DocumentsLinks;
