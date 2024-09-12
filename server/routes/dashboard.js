router.get('/progress', async (req, res) => {
    try {
        const topics = await Topic.aggregate([
            {
                $group: {
                    _id: { topic: '$topic', subtopic: '$subtopic' },
                    name: { $first: '$topic' },
                    subtopic: { $first: '$subtopic' },
                    info: { $first: '$info' },
                    averageScore: { $avg: { $multiply: [ { $divide: ['$score', '$totalQuestions'] }, 100 ] } }
                }
            },
            {
                $group: {
                    _id: '$_id.topic',
                    name: { $first: '$name' },
                    subtopics: {
                        $push: {
                            name: '$subtopic',
                            info: '$info',
                            averageScore: '$averageScore'
                        }
                    },
                    overallAverageScore: { $avg: '$averageScore' }
                }
            }
        ]);
        res.json(topics);
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});