import { MongoDB } from "../../deps.ts";
import { AGENT_VERSION, NSOAPP_VERSION, S3SI_VERSION } from "../constant.ts";
import {
  CoopHistoryDetail,
  ExportResult,
  Game,
  GameExporter,
  Queries,
  RespMap,
  Summary,
  VsHistoryDetail,
} from "../types.ts";
import { parseHistoryDetailId } from "../utils.ts";

export class MongoDBExporter implements GameExporter {
  name = "mongodb";
  mongoDbClient: MongoDB.MongoClient;
  mongoDb: MongoDB.Db;
  battlesCollection: MongoDB.Collection;
  jobsCollection: MongoDB.Collection;
  summariesCollection: MongoDB.Collection;
  constructor(private mongoDbUri: string) {
    this.mongoDbClient = new MongoDB.MongoClient(mongoDbUri);
    this.mongoDb = this.mongoDbClient.db("splashcat");
    this.battlesCollection = this.mongoDb.collection("battles");
    this.jobsCollection = this.mongoDb.collection("jobs");
    this.summariesCollection = this.mongoDb.collection("summaries");
  }

  static getGameId(id: string) { // very similar to the file exporter
    const { uid, timestamp } = parseHistoryDetailId(id);

    return `${uid}_${timestamp}Z`;
  }

  async notExported(
    { type, list }: { type: Game["type"]; list: string[] },
  ): Promise<string[]> {
    const out: string[] = [];

    const collection = type === "CoopInfo"
      ? this.jobsCollection
      : this.battlesCollection;

    for (const id of list) {
      const uniqueId = MongoDBExporter.getGameId(id);
      const countNewStorage = await collection.countDocuments({
        gameId: uniqueId,
      });

      if (countNewStorage === 0) {
        out.push(id);
      }
    }

    return out;
  }

  async exportGame(game: Game): Promise<ExportResult> {
    const uniqueId = MongoDBExporter.getGameId(game.detail.id);

    const common = {
      // this seems like useful data to store...
      // loosely modeled after FileExporterTypeCommon
      nsoVersion: NSOAPP_VERSION,
      agentVersion: AGENT_VERSION,
      s3siVersion: S3SI_VERSION,
      exportDate: new Date(),
    };

    const splatNetData = {
      ...game.detail,
      playedTime: new Date(game.detail.playedTime),
    };

    const body: {
      data: Game;
      splatNetData:
        & Omit<(VsHistoryDetail | CoopHistoryDetail), "playedTime">
        & { playedTime: Date };
      gameId: string;
    } & typeof common = {
      ...common,
      data: game,
      splatNetData,
      gameId: uniqueId,
    };

    const isJob = game.type === "CoopInfo";

    const collection = isJob ? this.jobsCollection : this.battlesCollection;

    const result = await collection.insertOne(body);

    const objectId = result.insertedId;

    return {
      status: "success",
      url: `https://new.splatoon.catgirlin.space/battle/${objectId.toString()}`,
    };
  }

  async exportSummary(summary: Summary): Promise<ExportResult> {
    const id = summary.uid;

    await this.summariesCollection.insertOne({
      summaryId: id,
      ...summary,
    });

    return {
      status: "success",
    };
  }

  async exportStages(stages: RespMap[Queries.StageRecordQuery]["stageRecords"]["nodes"]): Promise<ExportResult> {

    for (const stage of stages) {
      await this.mongoDb.collection("stages").updateOne({
        "stage.id": stage.id,
      }, {
        $set: stage,
      }, {
        upsert: true,
      });
    }

    return {
      status: "success",
    }
  }
}
