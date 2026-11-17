import { useMemo } from 'react';
import { useGetProjectsQuery } from '../features/projects/projectsApi';
import { useGetTasksQuery } from '../features/tasks/tasksApi';
import { useGetUsersQuery } from '../features/team/usersApi';
import { useCurrentUser } from './useAuth';
import type { Project, Task, User } from '../types';

const NO_PROJECTS: Project[] = [];
const NO_TASKS: Task[] = [];
const NO_USERS: User[] = [];

/**
 * Role-scoped view of the data, computed once per cache change and shared by
 * every page that needs it:
 *  - admin:   everything
 *  - manager: projects they own or belong to, and those projects' tasks
 *  - member:  projects they belong to, and only tasks assigned to them
 */
export function useScopedData() {
  const user = useCurrentUser();
  const projectsQ = useGetProjectsQuery();
  const tasksQ = useGetTasksQuery();
  const usersQ = useGetUsersQuery();

  const allProjects = projectsQ.data ?? NO_PROJECTS;
  const allTasks = tasksQ.data ?? NO_TASKS;
  const users = usersQ.data ?? NO_USERS;

  const scoped = useMemo(() => {
    if (user.role === 'admin') return { projects: allProjects, tasks: allTasks };
    const projects = allProjects.filter((p) => p.ownerId === user.id || p.memberIds.includes(user.id));
    if (user.role === 'manager') {
      const ids = new Set(projects.map((p) => p.id));
      return { projects, tasks: allTasks.filter((t) => ids.has(t.projectId)) };
    }
    return { projects, tasks: allTasks.filter((t) => t.assigneeId === user.id) };
  }, [user, allProjects, allTasks]);

  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const projectById = useMemo(() => new Map(allProjects.map((p) => [p.id, p])), [allProjects]);

  const refetch = () => {
    void projectsQ.refetch();
    void tasksQ.refetch();
    void usersQ.refetch();
  };

  return {
    user,
    users,
    userById,
    projectById,
    projects: scoped.projects,
    tasks: scoped.tasks,
    isLoading: projectsQ.isLoading || tasksQ.isLoading || usersQ.isLoading,
    isError: projectsQ.isError || tasksQ.isError || usersQ.isError,
    refetch,
  };
}
