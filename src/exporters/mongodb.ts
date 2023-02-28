import { MongoDB } from "../../deps.ts";
import { Game, GameExporter } from "../types.ts";
import { parseHistoryDetailId } from "../utils.ts";

export class MongoDBExporter implements GameExporter {
	name = "mongodb";
	mongoDbClient: MongoDB.MongoClient;
	mongoDb: MongoDB.Db;
	battlesCollection: MongoDB.Collection;
	jobsCollection: MongoDB.Collection;
	constructor(private mongoDbUri: string) {
		this.mongoDbClient = new MongoDB.MongoClient(mongoDbUri);
		this.mongoDb = this.mongoDbClient.db("splashcat");
		this.battlesCollection = this.mongoDb.collection("battles");
		this.jobsCollection = this.mongoDb.collection("jobs");
	}

	getGameId(id: string) { // very similar to the file exporter
		const { uid, timestamp } = parseHistoryDetailId(id);

		return `${uid}_${timestamp}Z`;
	}

	async notExported({ type, list }: { type: Game["type"], list: string[] }): Promise<string[]> {
		const out: string[] = [];

		const collection = type === "CoopInfo" ? this.jobsCollection : this.battlesCollection;

		for (const id of list) {
			// countOldStorage can be removed later eventually when all old documents
			// are gone from SplatNet 3
			const countOldStorage = await collection.countDocuments({
				splatNetData: {
					id: id,
				}
			});

			const uniqueId = this.getGameId(id);
			const countNewStorage = await collection.countDocuments({
				gameId: uniqueId,
			});

			if (countOldStorage === 0 && countNewStorage === 0) {
				out.push(id);
			}
		}

		return out;
	}
}
