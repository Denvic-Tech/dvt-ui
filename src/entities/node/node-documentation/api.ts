import {
  client,
  type PublishedNodeDocumentationSchema,
} from '@/shared/gatewayClient';

export interface GetNodeDocumentationParams {
  language: string;
  nodeName: string;
}

export const nodeDocumentationApi = {
  async getNodeDocumentation({
    language,
    nodeName,
  }: GetNodeDocumentationParams): Promise<PublishedNodeDocumentationSchema> {
    const response = await client.nodes.nodeName(nodeName).documentation.get(
      {
        headers: {
          'accept-language': language,
          'x-language': language,
        },
      },
      { silent: true }
    );

    return response.data;
  },
};
