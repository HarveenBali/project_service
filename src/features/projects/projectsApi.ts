import { actorOf, baseApi, run } from '../../services/api';
import * as projectsDb from '../../services/mock/projectsDb';
import type { Project, ProjectInput } from '../../types';

export const projectsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProjects: build.query<Project[], void>({
      queryFn: () => run(() => projectsDb.listProjects()),
      providesTags: (result) => [
        { type: 'Project', id: 'LIST' },
        ...(result ?? []).map((p) => ({ type: 'Project' as const, id: p.id })),
      ],
    }),
    createProject: build.mutation<Project, ProjectInput>({
      queryFn: (input, api) => run(() => projectsDb.createProject(actorOf(api), input)),
      invalidatesTags: [{ type: 'Project', id: 'LIST' }, { type: 'Activity', id: 'LIST' }],
    }),
    updateProject: build.mutation<Project, { id: string; patch: Partial<ProjectInput> }>({
      queryFn: ({ id, patch }, api) => run(() => projectsDb.updateProject(actorOf(api), id, patch)),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Project', id }, { type: 'Project', id: 'LIST' }, { type: 'Activity', id: 'LIST' }],
    }),
    deleteProject: build.mutation<void, string>({
      queryFn: (id, api) => run(() => projectsDb.deleteProject(actorOf(api), id)),
      invalidatesTags: [
        { type: 'Project', id: 'LIST' },
        { type: 'Task', id: 'LIST' },
        { type: 'Activity', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} = projectsApi;
