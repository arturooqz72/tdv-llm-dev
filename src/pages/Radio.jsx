const disabledMessage =
  "Base44 está deshabilitado temporalmente en este proyecto.";

const asyncNull = async () => null;
const asyncEmptyArray = async () => [];
const asyncCreateEcho = async (payload = {}) => payload;
const asyncNoop = async () => true;

function createEntityStub() {
  return {
    get: asyncNull,
    list: asyncEmptyArray,
    filter: asyncEmptyArray,
    create: asyncCreateEcho,
    update: asyncCreateEcho,
    delete: asyncNoop,
    subscribe: () => () => {}
  };
}

export const base44 = {
  auth: {
    me: asyncNull,
    redirectToLogin: () => {
      console.warn(disabledMessage);
    },
    logout: asyncNoop
  },

  integrations: {
    Core: {
      UploadFile: async () => {
        throw new Error(
          "La subida de archivos con Base44 está deshabilitada temporalmente."
        );
      }
    }
  },

  entities: new Proxy(
    {},
    {
      get(_target, prop) {
        if (typeof prop === "string") {
          return createEntityStub();
        }
        return createEntityStub();
      }
    }
  )
};

export default base44;
