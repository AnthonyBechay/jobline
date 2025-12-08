'use client';

import { Candidate, columns } from './columns';
import { DataTable } from '@/components/tables/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CandidatesClientProps {
    data: Candidate[];
}

export function CandidatesClient({ data }: CandidatesClientProps) {
    const availableCandidates = data.filter((c) => c.status.includes('AVAILABLE'));
    const reservedCandidates = data.filter((c) => c.status === 'RESERVED');
    const placedCandidates = data.filter((c) => c.status === 'PLACED');

    return (
        <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="available">Available</TabsTrigger>
                <TabsTrigger value="reserved">Reserved</TabsTrigger>
                <TabsTrigger value="placed">Placed</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
                <Card>
                    <CardHeader>
                        <CardTitle>All Candidates</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable columns={columns} data={data} searchKey="firstName" />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="available">
                <Card>
                    <CardHeader>
                        <CardTitle>Available Candidates</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable columns={columns} data={availableCandidates} searchKey="firstName" />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="reserved">
                <Card>
                    <CardHeader>
                        <CardTitle>Reserved Candidates</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable columns={columns} data={reservedCandidates} searchKey="firstName" />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="placed">
                <Card>
                    <CardHeader>
                        <CardTitle>Placed Candidates</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable columns={columns} data={placedCandidates} searchKey="firstName" />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
