'use client';

import { Copy, Edit, MoreHorizontal, Trash2 } from 'lucide-react';
import { useMutation } from 'convex/react';
import { toast } from 'sonner';
import { useState } from 'react';

import TemplatesForm from './TemplatesForm';
import DeleteTemplatesModal from './DeleteTemplatesModal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '../../../../../../../../convex/_generated/api';
import { PopulatedTemplates } from './templatesColumns';

const TemplatesActions = ({ data }: { data: PopulatedTemplates }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Duplicate functionality
  const createTemplate = useMutation(api.templates.createTemplate);
  const handleDuplicateTask = async () => {
    const promise = createTemplate({
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      assignee: data.assignee?._id,
      label: data.label?._id,
      teamId: data.teamId,
      projectId: data.projectId,
    });

    toast.promise(promise, {
      loading: 'Duplicating template',
      success: 'Template duplicated successfully',
      error: 'Failed to duplicate template',
    });
  };

  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='size-6 p-0 hover:bg-muted'>
          <span className='sr-only'>Open menu</span>
          <MoreHorizontal
            className='size-4 text-muted-foreground'
            strokeWidth={1.5}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {/* Edit button */}
        <TemplatesForm
          templateData={data}
          trigger={
            <DropdownMenuItem onSelect={e => e.preventDefault()}>
              <Edit className='size-3.5 mr-2' strokeWidth={1.5} />
              Edit template
            </DropdownMenuItem>
          }
          onClose={() => setIsDropdownOpen(false)}
        />
        {/* Duplicate button */}
        <DropdownMenuItem onClick={handleDuplicateTask}>
          <Copy className='size-3.5 mr-2' strokeWidth={1.5} />
          Duplicate
        </DropdownMenuItem>
        {/* Remove button */}
        <DropdownMenuSeparator />
        <DeleteTemplatesModal
          teamId={data.teamId}
          ids={[data._id]}
          trigger={
            <DropdownMenuItem onSelect={e => e.preventDefault()}>
              <Trash2 className='size-3.5 mr-2' strokeWidth={1.5} />
              Delete template
            </DropdownMenuItem>
          }
          onSuccess={() => setIsDropdownOpen(false)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TemplatesActions;
