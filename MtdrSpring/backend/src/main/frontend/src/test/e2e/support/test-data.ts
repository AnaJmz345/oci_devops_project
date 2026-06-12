export type UserRole = 'ADMIN' | 'MANAGER' | 'DEVELOPER';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
export type TaskCategory = 'FEATURE' | 'BUG' | 'ISSUE';

export interface TestUser {
  oracleId: number;
  oracle_id: number;
  name: string;
  mail: string;
  role: UserRole;
}

export interface TestSprint {
  sprintId: number;
  sprintName: string;
  goal: string;
}

export interface TestTask {
  taskId: number;
  taskName: string;
  description: string;
  status: TaskStatus;
  category: TaskCategory;
  storyPoints: number;
  dueDate: string;
  sprintId: number | null;
  createdBy: number;
}

export interface TestTaskAssignee {
  taskId: number;
  oracleId: number;
  oracle_id: number;
  estimatedCompletionTime: number;
  realTimeSpent: number;
  additionalComments?: string;
}

export interface TestBug {
  bugId: number;
  taskId: number;
  title: string;
  description: string;
  reportedBy: number;
  solvedBy: number | null;
}

export const E2E_CLOCK = new Date('2026-06-12T09:00:00-06:00');

export const TEST_TAGS = {
  auth: '@auth',
  manager: '@manager',
  developer: '@developer',
  tasks: '@tasks',
  analytics: '@analytics',
  mockedApi: '@mocked-api',
  har: '@har',
} as const;

export const API_ENDPOINTS = {
  currentUser: '/users/me',
  login: '/users/login',
  logout: '/logout',
  users: '/users',
  developers: '/users/developers',
  tasks: '/tasks',
  taskAssignees: '/tasks/assignees',
  allTaskAssignees: '/tasks/assignees/all',
  sprints: '/sprints',
  bugs: '/bugs',
} as const;

export const USERS = {
  manager: {
    oracleId: 101,
    oracle_id: 101,
    name: 'Mariana Manager',
    mail: 'manager@vantage.test',
    role: 'MANAGER',
  },
  developer: {
    oracleId: 202,
    oracle_id: 202,
    name: 'Diego Developer',
    mail: 'developer@vantage.test',
    role: 'DEVELOPER',
  },
  developerTwo: {
    oracleId: 203,
    oracle_id: 203,
    name: 'Ana Developer',
    mail: 'ana@vantage.test',
    role: 'DEVELOPER',
  },
} satisfies Record<string, TestUser>;

export const SPRINTS: TestSprint[] = [
  { sprintId: 1, sprintName: 'Sprint 1', goal: 'Build the Vantage task baseline' },
  { sprintId: 2, sprintName: 'Sprint 2', goal: 'Improve delivery visibility' },
];

export const TASKS: TestTask[] = [
  {
    taskId: 301,
    taskName: 'Create authentication smoke tests',
    description: 'Cover the most important authentication states.',
    status: 'DONE',
    category: 'FEATURE',
    storyPoints: 5,
    dueDate: '2026-06-14',
    sprintId: 1,
    createdBy: USERS.manager.oracleId,
  },
  {
    taskId: 302,
    taskName: 'Build analytics cards',
    description: 'Show sprint progress and work distribution.',
    status: 'IN_PROGRESS',
    category: 'FEATURE',
    storyPoints: 8,
    dueDate: '2026-06-18',
    sprintId: 1,
    createdBy: USERS.manager.oracleId,
  },
  {
    taskId: 303,
    taskName: 'Fix blocked status color',
    description: 'Make blocked tickets easier to scan.',
    status: 'TODO',
    category: 'BUG',
    storyPoints: 3,
    dueDate: '2026-06-20',
    sprintId: 2,
    createdBy: USERS.manager.oracleId,
  },
  {
    taskId: 304,
    taskName: 'Document mocked E2E flows',
    description: 'Explain the no-real-API testing strategy.',
    status: 'BLOCKED',
    category: 'ISSUE',
    storyPoints: 2,
    dueDate: '2026-06-21',
    sprintId: null,
    createdBy: USERS.manager.oracleId,
  },
];

export const TASK_ASSIGNEES: TestTaskAssignee[] = [
  {
    taskId: 301,
    oracleId: USERS.developer.oracleId,
    oracle_id: USERS.developer.oracleId,
    estimatedCompletionTime: 6,
    realTimeSpent: 5,
    additionalComments: 'Use Playwright fixtures.',
  },
  {
    taskId: 302,
    oracleId: USERS.developer.oracleId,
    oracle_id: USERS.developer.oracleId,
    estimatedCompletionTime: 8,
    realTimeSpent: 3,
    additionalComments: 'Keep charts readable.',
  },
  {
    taskId: 303,
    oracleId: USERS.developerTwo.oracleId,
    oracle_id: USERS.developerTwo.oracleId,
    estimatedCompletionTime: 4,
    realTimeSpent: 0,
  },
];

export const BUGS: TestBug[] = [
  {
    bugId: 401,
    taskId: 301,
    title: 'Login snapshot mismatch',
    description: 'The login button text changed.',
    reportedBy: USERS.developer.oracleId,
    solvedBy: USERS.developerTwo.oracleId,
  },
  {
    bugId: 402,
    taskId: 301,
    title: 'Analytics card spacing',
    description: 'One chart overflows at small widths.',
    reportedBy: USERS.developerTwo.oracleId,
    solvedBy: null,
  },
];

export const NEW_TASKS: TestTask[] = [
  {
    taskId: 901,
    taskName: 'Create Playwright auth suite',
    description: 'Validate landing page and protected shell state.',
    status: 'TODO',
    category: 'FEATURE',
    storyPoints: 3,
    dueDate: '2026-06-25',
    sprintId: 1,
    createdBy: USERS.manager.oracleId,
  },
  {
    taskId: 902,
    taskName: 'Create Playwright manager suite',
    description: 'Validate analytics KPIs using mocked data.',
    status: 'TODO',
    category: 'FEATURE',
    storyPoints: 5,
    dueDate: '2026-06-26',
    sprintId: 1,
    createdBy: USERS.manager.oracleId,
  },
  {
    taskId: 903,
    taskName: 'Create Playwright developer suite',
    description: 'Validate status changes and completion flow.',
    status: 'TODO',
    category: 'FEATURE',
    storyPoints: 8,
    dueDate: '2026-06-27',
    sprintId: 2,
    createdBy: USERS.manager.oracleId,
  },
];

export const PARAMETERIZED_STATUS_CHANGES: Array<{
  taskName: string;
  nextStatus: TaskStatus;
}> = [
  { taskName: TASKS[1].taskName, nextStatus: 'DONE' },
  { taskName: TASKS[2].taskName, nextStatus: 'IN_PROGRESS' },
  { taskName: TASKS[3].taskName, nextStatus: 'TODO' },
];
