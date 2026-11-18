const ROLE_ID_MAP: Record<string, number> = {
  admin: 1,
  client: 2,
  manager: 3,
  freelancer: 4,
  editor: 5,
  account_owner: 6,
};

export function getRoleId(role: string): number {
  return ROLE_ID_MAP[role] ?? 2;
}

export { ROLE_ID_MAP };


