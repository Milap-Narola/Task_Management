import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import cookieParser from 'cookie-parser';
import UserRouter from './src/routes/userRoutes.js';
import taskRouter from './src/routes/tasksRoutes.js';
import errorHandler from './src/helpers/errorhandler.js';
dotenv.config();
const app = express();
app.use(cors(
    {
 origin: 'http://localhost:3000',
        credentials: true,
    }
));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(errorHandler);

app.get('/', (req, res) => {
    res.send('Welcome to the Node server');
});
app.use('/', UserRouter);
app.use('/', taskRouter)
const PORT = process.env.PORT || 8090;
app.listen(8000, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
    connectDB();
});