import { MongoDB } from "../deps.ts";
import { DEFAULT_ENV } from "../src/env.ts";
import { MongoDBExporter } from "../src/exporters/mongodb.ts";
import { FileStateBackend, Profile } from "../src/state.ts";

const OLD_BATTLES_END_DATE = new Date("2023-02-28T03:42:47.000+00:00");

const env = DEFAULT_ENV;
const stateBackend = new FileStateBackend("./profile.json");
const profile = new Profile({ stateBackend, env });
await profile.readState();

if (!profile.state.mongoDbUri) {
  console.error("MongoDB URI not set");
  Deno.exit(1);
}

const mongoDbClient = new MongoDB.MongoClient(profile.state.mongoDbUri);
const battlesCollection = mongoDbClient.db("splashcat").collection("battles");

const filter = {
  "exportDate": {
    "$lte": OLD_BATTLES_END_DATE,
  },
  "gameId": undefined,
};

const cursor = battlesCollection.find(filter);

const oldDocuments = await battlesCollection.countDocuments(filter);

console.log(`Found ${oldDocuments} old battles to update...`);

for await (const doc of cursor) {
  const { splatNetData, _id } = doc;

  const splatNetId = splatNetData.id;
  const uniqueId = MongoDBExporter.getGameId(splatNetId);

  await battlesCollection.updateOne({ _id }, {
    "$set": {
      gameId: uniqueId,
    },
  });

  console.log(`Updated ${splatNetId} to ${uniqueId}`);
}

console.log("Done!");
