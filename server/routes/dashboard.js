router.get('/progress', async (req, res) => {
    try {
        const topics = await Topic.aggregate([
            {
                $group: {
                    _id: '$topic',
                    name: { $first: '$topic' },
                    info: { $first: '$subtopic' }, // Assuming 'subtopic' is the info field
                    averageScore: { $avg: { $multiply: [ { $divide: ['$score', '$totalQuestions'] }, 100 ] } }
                }
            }
        ]);
        res.json(topics);
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});