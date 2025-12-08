'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { updateApplicationStatus } from '@/app/actions/applications';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Application {
    id: string;
    status: string;
    candidate: {
        firstName: string;
        lastName: string;
        photoUrl: string | null;
    } | null;
    client: {
        name: string;
    } | null;
}

interface KanbanBoardProps {
    initialData: Application[];
}

const COLUMNS = [
    { id: 'PENDING_MOL', title: 'Pending MOL' },
    { id: 'MOL_AUTH_RECEIVED', title: 'MOL Auth Received' },
    { id: 'VISA_PROCESSING', title: 'Visa Processing' },
    { id: 'VISA_RECEIVED', title: 'Visa Received' },
    { id: 'WORKER_ARRIVED', title: 'Worker Arrived' },
];

export function KanbanBoard({ initialData }: KanbanBoardProps) {
    const [applications, setApplications] = useState(initialData);

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const newStatus = destination.droppableId;

        // Optimistic update
        const updatedApps = applications.map(app =>
            app.id === draggableId ? { ...app, status: newStatus } : app
        );
        setApplications(updatedApps);

        // Server update
        try {
            const result = await updateApplicationStatus(draggableId, newStatus);
            if (result.error) {
                toast.error('Failed to update status');
                // Revert
                setApplications(initialData);
            } else {
                toast.success('Status updated');
            }
        } catch (error) {
            toast.error('Something went wrong');
            setApplications(initialData);
        }
    };

    const getColumnApplications = (status: string) => {
        return applications.filter((app) => app.status === status);
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex h-full gap-4 overflow-x-auto pb-4">
                {COLUMNS.map((column) => (
                    <div key={column.id} className="min-w-[300px] max-w-[300px]">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="font-semibold text-muted-foreground">{column.title}</h3>
                            <Badge variant="secondary">{getColumnApplications(column.id).length}</Badge>
                        </div>
                        <Droppable droppableId={column.id}>
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="flex min-h-[500px] flex-col gap-3 rounded-lg border bg-muted/50 p-2"
                                >
                                    {getColumnApplications(column.id).map((app, index) => (
                                        <Draggable key={app.id} draggableId={app.id} index={index}>
                                            {(provided) => (
                                                <Card
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className="cursor-grab active:cursor-grabbing"
                                                >
                                                    <CardContent className="p-3">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage src={app.candidate?.photoUrl || ''} />
                                                                <AvatarFallback>{app.candidate?.firstName?.[0]}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="text-sm font-medium leading-none">
                                                                    {app.candidate?.firstName} {app.candidate?.lastName}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                    {app.client?.name}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>
                ))}
            </div>
        </DragDropContext>
    );
}
