'use client';

import { ListFilter, Plus } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import SearchbarFilter from './SearchbarFilter';
import FiltersForm, { Filter } from './FiltersForm';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { useCreateQueryString } from '@/hooks/useCreateQueryString';
import { ColumnVisibilityDropdown } from '@/components/TableContext';

type View = {
  id: string;
  label: string;
  value: string;
  icon: ReactElement;
};

type NavbarProps = {
  filters?: Filter[];
  views?: View[];
  defaultView?: View['value'];
  createModal?: ReactNode;
  createButtonLabel?: string;
};

const ProjectFeatureNavbar = ({
  filters,
  views = [],
  defaultView,
  createModal,
  createButtonLabel,
}: NavbarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const createQueryString = useCreateQueryString();

  return (
    <nav className='w-full p-2 px-4 border-b border-border'>
      <div className='flex items-center justify-between'>
        {/* Filters */}
        <div className='flex items-center space-x-2'>
          {filters ? (
            <Popover>
              <PopoverTrigger>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant='outline' size='sm'>
                      <ListFilter className='size-4 mr-1.5' strokeWidth={1.5} />
                      Filters
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Filters</TooltipContent>
                </Tooltip>
              </PopoverTrigger>
              <PopoverContent side='bottom' className='w-auto'>
                <FiltersForm filters={filters} />
              </PopoverContent>
            </Popover>
          ) : null}
          <ColumnVisibilityDropdown />
          <SearchbarFilter />
        </div>

        {/* VIEW COMPONENT */}
        <div className='flex items-center justify-center gap-2'>
          {views.length > 1 ? (
            <Tabs
              defaultValue={defaultView}
              onValueChange={value => {
                router.push(pathname + '?' + createQueryString('view', value));
              }}
            >
              <TabsList>
                {views.map(view => (
                  <Tooltip key={view.id}>
                    <TooltipTrigger className='h-full'>
                      <TabsTrigger value={view.value} className='h-full'>
                        {view.icon}
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>{view.label}</TooltipContent>
                  </Tooltip>
                ))}
              </TabsList>
            </Tabs>
          ) : null}

          {/* Create component */}
          {createModal ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button size='sm'>
                  <Plus className='size-4 mr-1.5' strokeWidth={2} />
                  {createButtonLabel ?? 'New'}
                </Button>
              </DialogTrigger>
              <DialogContent>{createModal}</DialogContent>
            </Dialog>
          ) : null}
        </div>
      </div>
    </nav>
  );
};

export default ProjectFeatureNavbar;