"use client";
import React from "react";
import { UserContextProvider } from "../context/userContext";
import { TasksProvider } from "../context/taskContext";

interface Props {
  children: React.ReactNode;
}

const UserProvider = ({ children }: Props) => {
  return (
    <UserContextProvider>
      <TasksProvider>{children}</TasksProvider>
    </UserContextProvider>
  );
}

export default UserProvider;
