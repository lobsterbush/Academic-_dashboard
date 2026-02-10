"use client";

import { useLocalStorage } from "./use-local-storage";
import { v4 as uuidv4 } from "uuid";
import type {
  DashboardData,
  Paper,
  Course,
  Grant,
  PeerReview,
  EditorialRole,
  Student,
  Conference,
  ServiceRole,
  LinkedFolder,
  Todo,
} from "@/lib/types";

const DEFAULT_DATA: DashboardData = {
  papers: [],
  courses: [],
  grants: [],
  peerReviews: [],
  editorialRoles: [],
  students: [],
  conferences: [],
  serviceRoles: [],
  linkedFolders: [],
  todos: [],
};

export function useStore() {
  const [data, setData, isHydrated] = useLocalStorage<DashboardData>(
    "academic-dashboard",
    DEFAULT_DATA
  );

  // Ensure newer collections exist for older stored data
  const safeData = {
    ...data,
    linkedFolders: data.linkedFolders ?? [],
    todos: data.todos ?? [],
  };

  // Generic CRUD helpers
  function addItem<K extends keyof DashboardData>(
    collection: K,
    item: Omit<DashboardData[K][number], "id" | "createdAt">
  ) {
    setData((prev) => ({
      ...prev,
      [collection]: [
        ...prev[collection],
        { ...item, id: uuidv4(), createdAt: new Date().toISOString() },
      ],
    }));
  }

  function updateItem<K extends keyof DashboardData>(
    collection: K,
    id: string,
    updates: Partial<DashboardData[K][number]>
  ) {
    setData((prev) => ({
      ...prev,
      [collection]: prev[collection].map((item) =>
        (item as { id: string }).id === id ? { ...item, ...updates } : item
      ),
    }));
  }

  function deleteItem<K extends keyof DashboardData>(collection: K, id: string) {
    setData((prev) => ({
      ...prev,
      [collection]: prev[collection].filter(
        (item) => (item as { id: string }).id !== id
      ),
    }));
  }

  // Paper-specific helpers
  const papers = {
    list: safeData.papers,
    add: (paper: Omit<Paper, "id" | "createdAt" | "updatedAt">) =>
      addItem("papers", { ...paper, updatedAt: new Date().toISOString() } as never),
    update: (id: string, updates: Partial<Paper>) =>
      updateItem("papers", id, { ...updates, updatedAt: new Date().toISOString() } as never),
    delete: (id: string) => deleteItem("papers", id),
  };

  const courses = {
    list: safeData.courses,
    add: (course: Omit<Course, "id" | "createdAt">) => addItem("courses", course as never),
    update: (id: string, updates: Partial<Course>) => updateItem("courses", id, updates as never),
    delete: (id: string) => deleteItem("courses", id),
  };

  const grants = {
    list: safeData.grants,
    add: (grant: Omit<Grant, "id" | "createdAt">) => addItem("grants", grant as never),
    update: (id: string, updates: Partial<Grant>) => updateItem("grants", id, updates as never),
    delete: (id: string) => deleteItem("grants", id),
  };

  const peerReviews = {
    list: safeData.peerReviews,
    add: (review: Omit<PeerReview, "id" | "createdAt">) => addItem("peerReviews", review as never),
    update: (id: string, updates: Partial<PeerReview>) =>
      updateItem("peerReviews", id, updates as never),
    delete: (id: string) => deleteItem("peerReviews", id),
  };

  const editorialRoles = {
    list: safeData.editorialRoles,
    add: (role: Omit<EditorialRole, "id">) => addItem("editorialRoles", role as never),
    update: (id: string, updates: Partial<EditorialRole>) =>
      updateItem("editorialRoles", id, updates as never),
    delete: (id: string) => deleteItem("editorialRoles", id),
  };

  const students = {
    list: safeData.students,
    add: (student: Omit<Student, "id" | "createdAt">) => addItem("students", student as never),
    update: (id: string, updates: Partial<Student>) => updateItem("students", id, updates as never),
    delete: (id: string) => deleteItem("students", id),
  };

  const conferences = {
    list: safeData.conferences,
    add: (conference: Omit<Conference, "id" | "createdAt">) =>
      addItem("conferences", conference as never),
    update: (id: string, updates: Partial<Conference>) =>
      updateItem("conferences", id, updates as never),
    delete: (id: string) => deleteItem("conferences", id),
  };

  const serviceRoles = {
    list: safeData.serviceRoles,
    add: (role: Omit<ServiceRole, "id" | "createdAt">) =>
      addItem("serviceRoles", role as never),
    update: (id: string, updates: Partial<ServiceRole>) =>
      updateItem("serviceRoles", id, updates as never),
    delete: (id: string) => deleteItem("serviceRoles", id),
  };

  const linkedFolders = {
    list: safeData.linkedFolders,
    add: (folder: Omit<LinkedFolder, "id" | "createdAt">) =>
      addItem("linkedFolders", folder as never),
    update: (id: string, updates: Partial<LinkedFolder>) =>
      updateItem("linkedFolders", id, updates as never),
    delete: (id: string) => deleteItem("linkedFolders", id),
  };

  const todos = {
    list: safeData.todos,
    add: (todo: Omit<Todo, "id" | "createdAt">) => addItem("todos", todo as never),
    update: (id: string, updates: Partial<Todo>) => updateItem("todos", id, updates as never),
    delete: (id: string) => deleteItem("todos", id),
  };

  return {
    isHydrated,
    papers,
    courses,
    grants,
    peerReviews,
    editorialRoles,
    students,
    conferences,
    serviceRoles,
    linkedFolders,
    todos,
  };
}
