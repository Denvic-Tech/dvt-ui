import type {
  AdminUserCreateSchema,
  AdminUserReadSchema,
  AdminUserUpdateSchema,
  CommonResponse,
} from '@/shared/gatewayClient';
import { client } from '@/shared/gatewayClient';
import { ApiError } from '@/shared/lib/errors';

export const adminApi = {
  async getAllUsers(
    page = 1,
    limit = 30,
    emailContains?: string
  ): Promise<AdminUserReadSchema[]> {
    const response = await client.admin.users.get({
      query: { page, limit, email_contains: emailContains ?? null },
    });

    return response.data;
  },

  async getUserById(id: string): Promise<AdminUserReadSchema> {
    const response = await client.admin.users.userId(id).get();
    return response.data;
  },

  async createUser(data: AdminUserCreateSchema): Promise<CommonResponse> {
    const response = await client.admin.users.post({
      body: data,
    });

    return response.data;
  },

  async updateUser(
    id: string,
    data: AdminUserUpdateSchema
  ): Promise<CommonResponse> {
    const response = await client.admin.users.patch({
      body: data,
    });
    return response.data;
  },

  async deleteUser(id: string): Promise<CommonResponse> {
    const response = await client.admin.users.userId(id).delete();
    const result = response.data;
    if (!result.success) {
      throw new ApiError({
        code: 'ADMIN_USERS.DELETE_FAILED',
        message: result.message ?? 'Не удалось удалить пользователя.',
        meta: { id },
      });
    }
    return result;
  },
};
