// Quick script to introspect all Lead fields from Twenty CRM
const query = `
  query IntrospectLead {
    __type(name: "Lead") {
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
        }
      }
    }
  }
`;

console.log(JSON.stringify({
  query: query
}, null, 2));
