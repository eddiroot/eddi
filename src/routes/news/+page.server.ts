import { getPublishedNewsBySchoolId, getNewsResources } from '$lib/server/db/service/news';
import { getCampusesByUserId } from '$lib/server/db/service/schools';

export const load = async ({ locals: { security } }) => {
    const user = security.isAuthenticated().getUser();

    console.log('📰 Loading news page for user:', {
        userId: user.id,
        schoolId: user.schoolId,
        userType: user.type
    });

    // Get user's campuses to determine which news they should see
    const userCampuses = await getCampusesByUserId(user.id);
    const userCampusId = userCampuses.length > 0 ? userCampuses[0].id : undefined;

    console.log('🏫 User campuses:', {
        userCampuses: userCampuses.map(c => ({ id: c.id, name: c.name })),
        selectedCampusId: userCampusId
    });

    // Get all published news for the user's school and campus, filtered by visibility
    const news = await getPublishedNewsBySchoolId(user.schoolId, userCampusId, user.type);

    console.log('📋 Raw news loaded:', {
        count: news.length,
        newsItems: news.map(n => ({
            id: n.news.id,
            title: n.news.title,
            status: n.news.status,
            publishedAt: n.news.publishedAt,
            visibility: n.news.visibility,
            isPinned: n.news.isPinned
        }))
    });

    const newsWithImages = await Promise.all(
        news.map(async (newsItem) => {
            const images = await getNewsResources(newsItem.news.id, user.schoolId);
            return {
                ...newsItem,
                images
            };
        })
    );

    console.log('🖼️ News with images loaded:', {
        count: newsWithImages.length,
        newsWithImageCounts: newsWithImages.map(n => ({
            id: n.news.id,
            title: n.news.title,
            imageCount: n.images.length
        }))
    });

    return { user, news: newsWithImages };
};