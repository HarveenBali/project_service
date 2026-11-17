import type { Project, ProjectInput } from '../../types';
import { commit, getState, logActivity, newId } from './state';

export const listProjects = () => getState().projects;

export function createProject(actorId: string, input: ProjectInput): Project {
  const project: Project = { ...input, id: newId('p') };
  const s = getState();
  commit(logActivity({ ...s, projects: [...s.projects, project] }, {
    actorId, message: `created project "${project.name}"`, projectId: project.id,
  }));
  return project;
}

export function updateProject(actorId: string, id: string, patch: Partial<ProjectInput>): Project {
  const s = getState();
  const existing = s.projects.find((p) => p.id === id);
  if (!existing) throw new Error('Project not found.');
  const updated = { ...existing, ...patch };
  const next = { ...s, projects: s.projects.map((p) => (p.id === id ? updated : p)) };
  commit(
    patch.status && patch.status !== existing.status
      ? logActivity(next, { actorId, message: `set "${updated.name}" to ${patch.status.replace('_', ' ')}`, projectId: id })
      : next,
  );
  return updated;
}

export function deleteProject(actorId: string, id: string) {
  const s = getState();
  const project = s.projects.find((p) => p.id === id);
  if (!project) throw new Error('Project not found.');
  const taskIds = new Set(s.tasks.filter((t) => t.projectId === id).map((t) => t.id));
  commit(logActivity({
    ...s,
    projects: s.projects.filter((p) => p.id !== id),
    tasks: s.tasks.filter((t) => t.projectId !== id),
    comments: s.comments.filter((c) => !taskIds.has(c.taskId)),
  }, { actorId, message: `deleted project "${project.name}"` }));
}
