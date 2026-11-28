export const editorialRoutes = {
  catalog: { api: "/api/admin/editoriale", page: "/admin/archivio-editoriale" },
  historical: { api: "/api/admin/editoriale/racconti", page: "/admin/archivio-editoriale/racconti" },
} as const;

export function editorialConfirmationDestination(api: string, redirect: unknown, origin: string) {
  const route = Object.values(editorialRoutes).find(route => route.api === api);
  if (!route || typeof redirect !== "string" || !redirect.startsWith("/") || redirect.startsWith("//")) return null;

  try {
    const destination = new URL(redirect, origin);
    return destination.origin === origin && destination.pathname === route.page ? destination : null;
  } catch {
    return null;
  }
}
