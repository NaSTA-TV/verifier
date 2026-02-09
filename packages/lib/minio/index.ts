import * as Minio from "minio";

import { env } from "../env";

// export const getMinioClient = () => {
// 	return new Minio.Client({
// 		endPoint: env.MINIO_ENDPOINT,
// 		useSSL: env.MINIO_USE_SSL === "true",
// 		accessKey: env.MINIO_ACCESS_KEY,
// 		secretKey: env.MINIO_SECRET_KEY,
// 	});
// };

// export async function checkMinioConnection() {
//   console.log("┌ Checking Minio connection");

//   const exists = await getMinioClient().bucketExists(env.MINIO_BUCKET);

//   if (!exists) {
//     console.error(`└
//         Failed to connect to bucket ${env.MINIO_BUCKET} at ${
//           env.MINIO_ENDPOINT
//         } ${env.MINIO_USE_SSL === "true" ? "using SSL" : "without SSL"}`);
//   }
//   console.log("└ Connection to Minio sucessful");
// }
