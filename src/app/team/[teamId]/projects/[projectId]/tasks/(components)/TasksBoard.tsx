'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useMutation } from 'convex/react';
import { useParams } from 'next/navigation';

import TasksColumn from './TasksColumn';
import TaskCard from './TaskCard';
import { StatusEnum } from '@/lib/enums';
import { PopulatedTask } from './tasksColumns';
import { api } from '../../../../../../../../convex/_generated/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Id } from '../../../../../../../../convex/_generated/dataModel';

type GroupedTasks = {
  [K in StatusEnum]?: PopulatedTask[];
};

type TasksColumns = {
  id: StatusEnum;
  title: string;
};

type TasksBoardProps = {
  tasks: PopulatedTask[];
  columns: readonly TasksColumns[];
  isLoading?: boolean;
};

const TasksBoard = ({
  columns,
  tasks: initialTasks,
  isLoading,
}: TasksBoardProps) => {
  const [tasks, setTasks] = useState<PopulatedTask[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<PopulatedTask | null>(null);

  const { projectId } = useParams<{ projectId: Id<'projects'> }>();

  const updateTask = useMutation(api.tasks.updateTask);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const findContainer = (id: string) => {
    if (!id) return null;

    const task = tasks.find(task => task._id === id);
    return task?.status;
  };

  const groupedTasks = tasks?.reduce<GroupedTasks>((acc, task) => {
    const status = task.status;
    if (!status) return acc;

    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(task);
    return acc;
  }, {});

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeTask = tasks.find(task => task._id === active.id);
    setActiveTask(activeTask || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find(task => task._id === active.id);
    if (!activeTask) return;

    const activeContainer = findContainer(active.id as string);
    const overContainer =
      over.data?.current?.type === 'column'
        ? (over.id as StatusEnum)
        : findContainer(over.id as string);

    if (!activeContainer || !overContainer) return;

    setTasks(tasks => {
      const activeIndex = tasks.findIndex(t => t._id === active.id);
      let overIndex;

      if (over.data?.current?.type === 'column') {
        overIndex = tasks.filter(t => t.status === overContainer).length;
      } else {
        overIndex = tasks.findIndex(t => t._id === over.id);
      }

      const updatedTasks = tasks.map(task => {
        if (task._id === activeTask._id) {
          return { ...task, status: overContainer };
        }
        return task;
      });

      if (activeContainer === overContainer) {
        return arrayMove(updatedTasks, activeIndex, overIndex);
      }

      return updatedTasks;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    let newStatus: StatusEnum;

    if (!over) {
      setActiveTask(null);
      return;
    }

    const activeTask = tasks.find(task => task._id === active.id);
    if (!activeTask) {
      setActiveTask(null);
      return;
    }

    if (over.data?.current?.type === 'column') {
      newStatus = over.id as StatusEnum;
    } else {
      const overTask = tasks.find(task => task._id === over.id);
      if (!overTask) {
        setActiveTask(null);
        return;
      }

      if (overTask.status) newStatus = overTask.status as StatusEnum;
    }

    try {
      await updateTask({
        teamId: activeTask.teamId,
        taskId: activeTask._id,
        taskData: {
          status: newStatus!,
          title: activeTask.title,
          description: activeTask.description || undefined,
          priority: activeTask.priority || undefined,
          label: activeTask.label?._id || undefined,
          dueDate: activeTask.dueDate || undefined,
          assignee: activeTask.assignee?._id || undefined,
        },
      });

      setTasks(tasks =>
        tasks.map(task =>
          task._id === activeTask._id ? { ...task, status: newStatus } : task
        )
      );
    } catch {
      setTasks(initialTasks);
    }

    setActiveTask(null);
  };

  if (isLoading)
    return (
      <div className='flex w-full h-full items-start gap-4 px-6 py-2 overflow-auto scrollbar-none'>
        {[1, 2, 3, 4, 5].map((_, index) => (
          <ul
            key={index}
            className='w-full min-w-[250px] max-w-[350px] space-y-3'
          >
            <Skeleton className='w-full h-40' />
            <Skeleton className='w-full h-40' />
            <Skeleton className='w-full h-40' />
          </ul>
        ))}
      </div>
    );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <ul className='flex w-full h-[calc(100vh-96px)] items-start gap-4 px-6 py-2 overflow-auto scrollbar-none hover:scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-muted scrollbar-track-transparent'>
        {columns.map(column => (
          <TasksColumn
            key={column.id}
            status={column.id}
            tasks={groupedTasks[column.id] || []}
            projectId={projectId}
          />
        ))}
      </ul>

      <DragOverlay>
        {activeTask && (
          <TaskCard
            taskData={activeTask}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default TasksBoard;
