const disabledMessage =
  "Cliente anterior deshabilitado. Este proyecto ya no usa ese servicio.";

const asyncError = async () => {
  throw new Error(disabledMessage);
};

const asyncNull = async () => null;
const asyncTrue = async () => true;
const asyncEcho = async (payload = {}) => payload;
const asyncEmptyArray = async () => [];

function createEntityStub() {
  return {
    list: asyncEmptyArray,
    get: asyncNull,
    filter: asyncEmptyArray,
    create: asyncEcho,
    update: asyncEcho,
    delete: asyncTrue,
    subscribe: () => () => {},
  };
}

const collections = new Proxy(
  {},
  {
    get() {
      return createEntityStub();
    },
  }
);

export const backendClient = {
  logs: {
    logUserInApp: asyncNull,
  },
  analytics: {
    track: asyncNull,
    trackBatch: asyncNull,
  },
  auth: {
    me: asyncNull,
    redirectToLogin: () => {
      if (typeof window !== "undefined") {
        window.location.href = "/Login";
      }
    },
    logout: asyncNull,
  },
  functions: new Proxy(
    {},
    {
      get() {
        return asyncNull;
      },
    }
  ),
  uploads: {
    uploadFile: asyncError,
  },
  collection: collections,
  collections,
};

export const base44 = {
  auth: backendClient.auth,
  entities: collections,
  integrations: {
    Core: {
      UploadFile: asyncError,
    },
  },
  functions: backendClient.functions,
};

export default base44;
