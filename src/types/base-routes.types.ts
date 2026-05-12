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
     * BODIES
     */
    createBody?: any;
    updateBody?: any;

    /**
     * RESPONSES
     */
    getManyResponse?: any;
    getOneResponse?: any;

    createResponse?: any;
    updateResponse?: any;

    deleteResponse?: any;
    restoreResponse?: any;
  };
}
