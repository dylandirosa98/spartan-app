// Quick script to introspect all Task fields from Twenty CRM
const query = `
  query IntrospectTask {
    __type(name: "Task") {
      name
      fields {
        name
        type {
          name
          kind
          ofType {
            name
            kind
          }
          enumValues {
            name
          }
        }
      }
    }
  }
`;

console.log(JSON.stringify({
  query: query
}, null, 2));
