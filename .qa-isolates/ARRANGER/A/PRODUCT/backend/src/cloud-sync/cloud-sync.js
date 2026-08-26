const memory = {
  users: [],
  sessions: [],
  libraries: []
};

export function createCloudUser(email) {
  let user = memory.users.find((item) => item.email === email);

  if (!user) {
    user = {
      id: Date.now().toString(),
      email,
      createdAt: new Date().toISOString()
    };
    memory.users.push(user);
  }

  return user;
}

export function syncLibrary(userId, items) {
  const row = {
    userId,
    items: items || [],
    syncedAt: new Date().toISOString()
  };

  memory.libraries.push(row);
  return row;
}
