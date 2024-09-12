app.delete('/api/questions/delete-subset/:topic/:subsValue', async (req, res) => {
    console.log('Delete subset route hit');
    console.log('Request params:', req.params);
    try {
        const { topic, subsValue } = req.params;
        console.log(`Attempting to delete subset ${subsValue} for topic ${topic}`);
        
        // Your logic to delete the subset from the database
        // For example:
        // await YourDatabaseModel.deleteMany({ topic: topic, subs: subsValue });
        
        // Simulating a successful deletion for now
        console.log(`Subset ${subsValue} deleted successfully for topic ${topic}`);
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({ message: 'Subset deleted successfully' });
    } catch (error) {
        console.error('Error deleting subset:', error);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({ error: 'Failed to delete subset', details: error.message });
    }
});