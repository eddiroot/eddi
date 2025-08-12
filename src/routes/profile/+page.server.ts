import { getUserProfileById } from "$lib/server/db/service";

export const load = async ({ locals: { security } }) => {
    const user = security.isAuthenticated().getUser();
    const profile = await getUserProfileById(user.id);

    if (!profile) {
        throw new Error("Profile not found");
    }

    return { profile };
};
