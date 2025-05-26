import Router from "express";
import {
  createTask,
  deleteTask,
  getTask,
  getTasks,
  updateTask,
} from "../controllers/task/taskController.js";
import { protect } from "../middleware/authMiddleware.js";

const taskRouter = Router();

taskRouter.post("/task/create", protect, createTask);
taskRouter.get("/tasks", protect,getTasks);
taskRouter.get("/task/:id", protect, getTask);
taskRouter.patch("/task/:id", protect, updateTask);
taskRouter.delete("/task/:id", protect, deleteTask);

export default taskRouter;
