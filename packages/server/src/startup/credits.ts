// import { db } from "@repo/lib/db";

// export async function runCreditStartupTasks() {
// 	console.log("┌ Running credit startup tasks");
// 	const brokenFailedAssetObjects = await db.credit.count({
// 		where: {
// 			state: {
// 				notIn: ["DELETED", "FAILED", "OUTDATED", "READY"],
// 			},
// 		},
// 	});

// 	if (brokenFailedAssetObjects > 0) {
// 		console.log(
// 			`│ Found ${brokenFailedAssetObjects} failed credits, marking them failed`,
// 		);

// 		await db.credit.updateMany({
// 			where: {
// 				state: {
// 					notIn: ["DELETED", "FAILED", "OUTDATED", "READY"],
// 				},
// 			},
// 			data: {
// 				state: "FAILED",
// 			},
// 		});
// 	}

// 	const failedAssets = await db.credit.count({
// 		where: {
// 			state: "FAILED",
// 		},
// 	});

// 	if (failedAssets > 0) {
// 		console.log(
// 			`└ There are ${failedAssets} failed credits, please check /assets for more info`,
// 		);
// 		return;
// 	}
// 	console.log("└ No failed credits found!");
// }
