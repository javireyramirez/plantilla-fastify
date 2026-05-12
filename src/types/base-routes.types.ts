export interface BaseRoutesOptions {
  tags: string[];

  schemas: {
    /**
     * PARAMS
     */
    idParams?: any;

    /**
     * QUERIES
     */
    getManyQuery?: any;

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
  };
}
