export function runCoreAgent(task) {
  return {
    agent: 'core',
    status: 'ready',
    task,
    next: 'Split task into small executable steps'
  };
}
