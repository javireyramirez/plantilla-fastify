export function parsePagination(query: {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: string;
}) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 10);
  return {
    skip: (page - 1) * limit,
    take: limit,
    orderBy: query.sortBy
      ? { [query.sortBy]: (query.sortOrder ?? 'desc') as 'asc' | 'desc' }
      : undefined,
    meta: (total: number) => ({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }),
  };
}
