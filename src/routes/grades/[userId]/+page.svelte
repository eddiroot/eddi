<script lang="ts">
    import { Avatar, AvatarFallback, AvatarImage } from "$lib/components/ui/avatar";
    import { Badge } from "$lib/components/ui/badge";
    import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
    import { Progress } from "$lib/components/ui/progress";
    import BookOpen from '@lucide/svelte/icons/book-open';

    let { data } = $props();

    function getInitials(firstName: string | null, lastName: string | null): string {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    }

    function formatUserType(type: string): string {
        return type.charAt(0).toUpperCase() + type.slice(1);
    }

    function getRoleBadgeVariant(type: string): "default" | "secondary" | "destructive" | "outline" {
        switch (type) {
            case 'student':
                return 'default';
            case 'teacher':
                return 'secondary';
            case 'schoolAdmin':
            case 'systemAdmin':
            case 'principal':
                return 'destructive';
            default:
                return 'outline';
        }
    }

    function getFullName(): string {
        const parts = [
            data.profile.honorific,
            data.profile.firstName,
            data.profile.middleName,
            data.profile.lastName
        ].filter(Boolean);
        return parts.join(' ');
    }

    function formatDate(date: Date | string | null): string {
        if (!date) return 'Not specified';
        return new Date(date).toLocaleDateString('en-AU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function getGradeColor(marks: number | null): string {
        if (marks === null || marks === undefined) return 'text-muted-foreground';
        if (marks < 40) return 'text-red-500';
        return 'text-foreground';
    }

    function getLetterGrade(marks: number | null): string {
        if (marks === null || marks === undefined) return '-';
        if (marks >= 80) return 'A';
        if (marks >= 70) return 'B';
        if (marks >= 60) return 'C';
        if (marks >= 50) return 'D';
        if (marks >= 40) return 'E';
        return 'F';
    }

    function navigateToSubjectGrades(subjectId: number) {
        // TODO: Navigate to detailed subject grades page
        console.log(`Navigate to grades for subject ${subjectId}`);
        // Future implementation: goto(`/subjects/${subjectId}/grades`);
    }
</script>

<div class="container mx-auto p-6 max-w-6xl">
    <!-- Header -->
    <div class="mb-6">
        <div class="flex items-center gap-4">
            <Avatar class="h-12 w-12">
                <AvatarImage 
                    src={data.profile.avatarUrl} 
                    alt="Profile picture of {getFullName()}"
                />
                <AvatarFallback class="text-sm font-semibold">
                    {getInitials(data.profile.firstName, data.profile.lastName)}
                </AvatarFallback>
            </Avatar>
            
            <div>
                <h1 class="text-2xl font-bold text-foreground">
                    {getFullName()}'s Grades
                </h1>
                <div class="flex items-center gap-2">
                    <Badge variant={getRoleBadgeVariant(data.profile.type)} class="text-xs">
                        {formatUserType(data.profile.type)}
                    </Badge>
                </div>
            </div>
        </div>
    </div>

    <!-- Student Subjects Card -->
    <Card class="shadow-sm">
        <CardHeader class="pb-4">
            <CardTitle class="flex items-center gap-2 text-xl">
                <BookOpen class="h-5 w-5 text-primary" />
                Academic Performance
            </CardTitle>
        </CardHeader>
        <CardContent>
            {#if !data.studentSubjects || data.studentSubjects.length === 0}
                <div class="text-center py-8 text-muted-foreground">
                    <BookOpen class="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No subjects enrolled yet</p>
                </div>
            {:else}
                <!-- Subjects Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {#each data.studentSubjects as subject}
                        <Card class="hover:shadow-md transition-shadow cursor-pointer" onclick={() => navigateToSubjectGrades(subject.subjectId)}>
                            <CardContent class="p-4">
                                <div class="space-y-3">
                                    <!-- Subject Name -->
                                    <div class="space-y-1">
                                        <h3 class="font-semibold text-foreground hover:text-primary transition-colors">
                                            {subject.subjectName}
                                        </h3>
                                    </div>

                                    <!-- Grade Display -->
                                    <div class="flex items-center justify-between">
                                        <span class="text-sm text-muted-foreground">Current Grade:</span>
                                        <div class="flex items-center gap-2">
                                            <span class="text-lg font-bold {getGradeColor(subject.overallGrade)}">
                                                {getLetterGrade(subject.overallGrade)}
                                            </span>
                                            <span class="text-sm {getGradeColor(subject.overallGrade)}">
                                                ({subject.overallGrade}%)
                                            </span>
                                        </div>
                                    </div>

                                    <!-- Progress Bar -->
                                    <div class="space-y-1">
                                        <div class="flex justify-between text-xs text-muted-foreground">
                                            <span>Progress</span>
                                            <span>{subject.completedTasks}/{subject.totalTasks} tasks</span>
                                        </div>
                                        <Progress value={(subject.completedTasks / subject.totalTasks) * 100} class="h-2" />
                                    </div>

                                    <!-- Last Updated -->
                                    <div class="text-xs text-muted-foreground">
                                        Last updated: {formatDate(subject.lastUpdated)}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    {/each}
                </div>
            {/if}
        </CardContent>
    </Card>
</div>
