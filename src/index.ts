import { app } from './app';
import { AppDataSource } from './config/data-source';

const PORT = process.env.PORT || 3000;

AppDataSource.initialize()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Database connection error:', error);
        process.exit(1);
    });