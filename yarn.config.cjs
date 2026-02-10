/** @type {import('@yarnpkg/types')} */
const { defineConfig } = require("@yarnpkg/types");

module.exports = defineConfig({
  async constraints({ Yarn }) {
    const packageVersions = {
      "@prisma/client": "7.3.0",
      next: "15.2.8",
      minio: "^8.0.6",
      prisma: "7.3.0",
      "socket.io": "^4.8.1",
      "socket.io-client": "^4.8.1",
      zod: "^4.1.12",
    };

    for (const workspace of Yarn.workspaces()) {
      for (const [packageName, packageVersion] of Object.entries(
        packageVersions,
      )) {
        for (const dep of Yarn.dependencies({
          ident: packageName,
          workspace: workspace,
        })) {
          dep.update(packageVersion);
        }
      }
    }
  },
});
