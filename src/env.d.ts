// Bundlers replace process.env.NODE_ENV in dependencies; declared here instead of all of @types/node
declare const process: { env: { NODE_ENV?: string } }
