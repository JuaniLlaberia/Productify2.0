'use client';

import { ListFilter } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import SearchbarFilter from './SearchbarFilter';
import Header from '@/components/Header';
import Hint from '@/components/ui/hint';
import FiltersForm, { Filter } from './FiltersForm';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useCreateQueryString } from '@/hooks/useCreateQueryString';
import { ColumnVisibilityDropdown } from '@/components/TableContext';

type View = {
  id: string;
  label: string;
  value: string;
  icon: ReactElement;
};

type ProjectNavbarProps = {
  filters?: Filter[];
  views?: View[];
  defaultView?: View['value'];
  createModal?: ReactNode;
  createButtonLabel?: string;
};

const ProjectNavbar = ({
  filters,
  views = [],
  defaultView,
  createModal,
}: ProjectNavbarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const createQueryString = useCreateQueryString();

  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'table';

  return (
    <Header
      leftContent={
        <div className='flex items-center space-x-2'>
          {filters ? (
            <Popover>
              <PopoverTrigger>
                <Hint label='Filters'>
                  <Button variant='outline' size='sm'>
                    <ListFilter className='size-4 mr-1.5' strokeWidth={1.5} />
                    Filters
                  </Button>
                </Hint>
              </PopoverTrigger>
              <PopoverContent side='bottom' className='w-auto'>
                <FiltersForm filters={filters} />
              </PopoverContent>
            </Popover>
          ) : null}
          {view === 'table' && (
            <>
              <ColumnVisibilityDropdown />
              <SearchbarFilter field='title' />
            </>
          )}
        </div>
      }
      rightContent={
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
                  <TabsTrigger
                    key={view.id}
                    value={view.value}
                    className='h-full'
                  >
                    <Hint label={view.label}>{view.icon}</Hint>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          ) : null}

          {/* Create component */}
          {createModal && createModal}
        </div>
      }
    />
  );
};

export default ProjectNavbar;
