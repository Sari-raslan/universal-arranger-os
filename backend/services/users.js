const users = [];

export function createUser(email) {
  const user = {
    id: Date.now().toString(),
    email,
    plan: "free",
    exportsUsed: 0,
    createdAt: new Date().toISOString()
  };
  users.push(user);
  return user;
}

export function canExport(user) {
  if (user.plan === "pro") return true;
  if (user.plan === "creator") return user.exportsUsed < 100;
  return user.exportsUsed < 3;
}

