import { getApplications } from '@/app/actions/applications';
import { KanbanBoard } from '@/components/pipeline/kanban-board';

export const dynamic = 'force-dynamic';

export default async function PipelinePage() {
    const result = await getApplications();
    const applications = result.success ? result.data : [];

    return (
        <div className="flex h-[calc(100vh-2rem)] flex-col space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Pipeline</h2>
                <p className="text-muted-foreground">
                    Visual overview of application statuses.
                </p>
            </div>

            <div className="flex-1 overflow-hidden">
                <KanbanBoard initialData={applications as any} />
            </div>
        </div>
    );
}
