export interface BaseRoutesOptions {
  resource: string;
  tags: string[];

  auth?: {
    skipMemberContext?: boolean;
    skipPermissions?: boolean;
  };

  schemas: {
    /**
     * PARAMS
     */
    idParams?: any;

    /**
     * QUERIES
     */
    getManyQuery?: any;
    GetListQuery?: any;

    /**
     * INDIVIDUAL BODIES
     */
    createBody?: any;
    updateBody?: any;

    /**
     * BULK BODIES
     */
    bulkCreateBody?: any; // z.array(createBody)
    bulkIdsBody?: any; // z.object({ ids: z.array(z.string()) })

    /**
     * INDIVIDUAL RESPONSES
     */
    getManyResponse?: any;
    getOneResponse?: any;

    createResponse?: any;
    updateResponse?: any;

    deleteResponse?: any;
    restoreResponse?: any;

    /**
     * BULK RESPONSES
     */
    bulkResponse?: any; // z.object({ count: z.number() })
    getListResponse?: any;
  };
}
