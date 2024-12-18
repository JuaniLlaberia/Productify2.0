'use client';

import { CloudUpload, HardDrive } from 'lucide-react';
import { useQuery } from 'convex/react';

import Header from '@/components/Header';
import SearchbarFilter from '../../projects/[projectId]/(components)/SearchbarFilter';
import UploadAssetModal from '../(components)/UploadAssetModal';
import DeleteAssetsModal from './(components)/DeleteAssetsModal';
import { useStablePaginatedQuery } from '@/hooks/useStablePaginatedQuery';
import { Id } from '../../../../../../convex/_generated/dataModel';
import { api } from '../../../../../../convex/_generated/api';
import {
  ColumnVisibilityDropdown,
  TableProvider,
} from '@/components/TableContext';
import { DataTable } from '@/components/ui/data-table';
import { assetsColumns } from './(components)/assetsColumns';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const StoragePage = ({
  params: { teamId, storageId },
}: {
  params: { teamId: Id<'teams'>; storageId: Id<'storages'> };
}) => {
  const storage = useQuery(api.storages.getStorageById, {
    teamId,
    storageId,
  });
  const { results, isLoading } = useStablePaginatedQuery(
    api.assets.getAssets,
    { teamId, storageId },
    { initialNumItems: 10 }
  );

  return (
    <TableProvider>
      <Header
        leftContent={
          <div className='flex items-center gap-2.5'>
            {storage?.icon ? (
              storage.icon
            ) : (
              <HardDrive className='size-4' strokeWidth={1.5} />
            )}
            {storage?.name ? (
              <h1 className='text-sm font-medium'>{storage.name}</h1>
            ) : (
              <Skeleton className='h-7 w-32' />
            )}
          </div>
        }
      />
      <Header
        leftContent={
          <>
            <ColumnVisibilityDropdown />
            <SearchbarFilter field='name' />
          </>
        }
        rightContent={
          <>
            <UploadAssetModal
              trigger={
                <Button size='sm'>
                  <CloudUpload className='size-4 mr-1.5' />
                  Upload asset
                </Button>
              }
            />
          </>
        }
      />
      <DataTable
        data={results}
        isLoading={isLoading}
        columns={assetsColumns}
        DeleteModal={DeleteAssetsModal}
      />
    </TableProvider>
  );
};

export default StoragePage;