import { MongoDB } from "../deps.ts";
import { DEFAULT_ENV } from "../src/env.ts";
import { MongoDBExporter } from "../src/exporters/mongodb.ts";
import { SplashcatExporter } from "../src/exporters/splashcat.ts";
import { FileStateBackend, Profile } from "../src/state.ts";

const env = DEFAULT_ENV;
const stateBackend = new FileStateBackend("./profile.json");
const profile = new Profile({ stateBackend, env });
await profile.readState();

if (!profile.state.mongoDbUri) {
  console.error("MongoDB URI not set");
  Deno.exit(1);
}

const splashcatClient = new SplashcatExporter({
  env,
  splashcatApiKey: profile.state.splashcatApiKey!,
  uploadMode: "manual",
});

const mongoDbClient = new MongoDB.MongoClient(profile.state.mongoDbUri);
const battlesCollection = mongoDbClient.db("splashcat").collection("battles");

const cursor = battlesCollection.find();

const oldDocuments = await battlesCollection.countDocuments();

console.log(`Found ${oldDocuments} old battles to upload...`);

let count = 0;

const erroredBattles = [];

for await (const doc of cursor) {
  const { data, splatNetData, _id } = doc;

  // start time for performance tracking, needs to be very accurate
  const startTime = new Date();

  try {
    if (data) {
      await splashcatClient.exportGame(data);
    } else {
      await splashcatClient.exportGame({
        type: "VsInfo",
        detail: splatNetData,
        bankaraMatchChallenge: null,
        challengeProgress: null,
        groupInfo: null,
        listNode: null,
        rankBeforeState: null,
        rankState: null,
      });
    }
  } catch (e) {
    console.log("Failed to export game", e);
    erroredBattles.push(e.toString());
  }

  // end time for performance tracking, needs to be very accurate
  const endTime = new Date();
  const timeTaken = endTime.getTime() - startTime.getTime();
  
  console.log(`Uploaded ${splatNetData.id} (${timeTaken}ms)`);
  count++;
  console.log(`Uploaded ${count}/${oldDocuments} battles`)

  if (count % 100 === 0) {
    console.log("Updating error logs...");
    if (erroredBattles.length > 0) {
      await Deno.writeFile("./errored-battles.json", new TextEncoder().encode(JSON.stringify(erroredBattles, null, "\t")));
    }
  }
}

console.log("Done!");

if (erroredBattles.length > 0) {
  await Deno.writeFile("./errored-battles.json", new TextEncoder().encode(JSON.stringify(erroredBattles, null, 2)));
}
