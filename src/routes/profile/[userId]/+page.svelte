<script lang="ts">
    import { Avatar, AvatarFallback, AvatarImage } from "$lib/components/ui/avatar";
    import { Badge } from "$lib/components/ui/badge";
    import { Button } from "$lib/components/ui/button";
    import { toast } from "svelte-sonner";
    import ChangePasswordForm from "$lib/components/change-password-form.svelte";
    import Mail from '@lucide/svelte/icons/mail';
    import Calendar from '@lucide/svelte/icons/calendar';
    import User from '@lucide/svelte/icons/user';
    import Lock from '@lucide/svelte/icons/lock';
    import ArrowLeft from '@lucide/svelte/icons/arrow-left';
    import { goto } from '$app/navigation';

    let { data, form } = $props();
    let showChangePasswordForm = $state(false);

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

    function formatGender(gender: string): string {
        if (gender === 'unspecified') return 'Not specified';
        return gender.charAt(0).toUpperCase() + gender.slice(1);
    }

    function handleChangePasswordClick() {
        showChangePasswordForm = true;
    }

    function handlePasswordChangeSuccess() {
        const message = data.isOwnProfile 
            ? "Password changed successfully!" 
            : `Password changed successfully for ${getFullName()}!`;
        toast.success(message);
    }

    function handleBackClick() {
        goto('/dashboard');
    }

    // Show change password button if it's the user's own profile or if current user is admin
    const canChangePassword = data.isOwnProfile || data.isAdmin;
</script>

<div class="container mx-auto p-6 max-w-6xl">
    <header class="bg-card rounded-lg border p-6 shadow-sm">
        <div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div class="flex items-center gap-4">
                <Avatar class="h-16 w-16 md:h-20 md:w-20">
                    <AvatarImage 
                        src={data.profile.avatarUrl} 
                        alt="Profile picture of {getFullName()}"
                    />
                    <AvatarFallback class="text-lg font-semibold">
                        {getInitials(data.profile.firstName, data.profile.lastName)}
                    </AvatarFallback>
                </Avatar>

                <div class="flex flex-col gap-2">
                    <h2 class="text-2xl font-bold text-foreground md:text-3xl">
                        {getFullName()}
                    </h2>

                    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                        <Badge 
                            variant={getRoleBadgeVariant(data.profile.type)}
                            class="w-fit"
                        >
                            {formatUserType(data.profile.type)}
                        </Badge>

                        <div class="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail class="h-4 w-4" aria-hidden="true" />
                            <span>{data.profile.email}</span>
                        </div>
                    </div>

                    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
                        <div class="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar class="h-4 w-4" aria-hidden="true" />
                            <span>{formatDate(data.profile.dateOfBirth)}</span>
                        </div>

                        <div class="flex items-center gap-2 text-sm text-muted-foreground">
                            <User class="h-4 w-4" aria-hidden="true" />
                            <span>{formatGender(data.profile.gender)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {#if canChangePassword}
                <div class="flex flex-col gap-2 sm:flex-row">
                    <Button 
                        variant="outline" 
                        size="sm"
                        class="flex items-center gap-2"
                        aria-label="Change password"
                        onclick={handleChangePasswordClick}
                    >
                        <Lock class="h-4 w-4" aria-hidden="true" />
                        <span>
                            {#if data.isOwnProfile}
                                Change Password
                            {:else}
                                Change User Password
                            {/if}
                        </span>
                    </Button>
                </div>
            {/if}
        </div>
    </header>
</div>

{#if canChangePassword}
    <ChangePasswordForm 
        bind:open={showChangePasswordForm}
        {form}
        onSuccess={handlePasswordChangeSuccess}
        isAdmin={data.isAdmin}
        isOwnProfile={data.isOwnProfile}
        targetUserName={getFullName()}
    />
{/if}
