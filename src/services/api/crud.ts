import { apiRequest, type ApiMutationResult, type ApiRequestOptions } from "./client";

export type EntityId = number | string;

export class CrudApiService<TRecord extends { id?: EntityId }, TCreate = Partial<TRecord>> {
  private readonly basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  getAll(options?: ApiRequestOptions): Promise<TRecord[]> {
    return apiRequest<TRecord[]>(this.basePath, options);
  }

  getById(id: EntityId, options?: ApiRequestOptions): Promise<TRecord> {
    return apiRequest<TRecord>(`${this.basePath}/${encodeURIComponent(String(id))}`, options);
  }

  create(data: TCreate, options?: ApiRequestOptions): Promise<ApiMutationResult> {
    return apiRequest<ApiMutationResult>(this.basePath, {
      ...options,
      method: "POST",
      body: data,
    });
  }

  update(
    id: EntityId,
    data: Partial<TRecord>,
    options?: ApiRequestOptions
  ): Promise<ApiMutationResult> {
    return apiRequest<ApiMutationResult>(`${this.basePath}/${encodeURIComponent(String(id))}`, {
      ...options,
      method: "PUT",
      body: data,
    });
  }

  delete(id: EntityId, options?: ApiRequestOptions): Promise<ApiMutationResult> {
    return apiRequest<ApiMutationResult>(`${this.basePath}/${encodeURIComponent(String(id))}`, {
      ...options,
      method: "DELETE",
    });
  }
}
