import express, { Router } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import cookieParser from 'cookie-parser';
import UserRouter from './src/routes/userRoutes.js';
import errorHandler from './src/helpers/errorhandler.js';
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(errorHandler);

app.get('/', (req, res) => {
    res.send('Hello World');
});
app.use('/api/v1',UserRouter);
app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
    connectDB;
});