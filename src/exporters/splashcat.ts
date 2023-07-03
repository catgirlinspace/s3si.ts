import {
  USERAGENT,
} from "../constant.ts";
import {
  Color,
  ExportResult,
  Game,
  GameExporter,
  Nameplate,
  PlayerGear,
  StatInkPostBody,
  VsHistoryDetail,
  VsInfo,
  VsPlayer,
VsTeam,
} from "../types.ts";
import { base64, msgpack, Mutex } from "../../deps.ts";
import { APIError } from "../APIError.ts";
import {
  b64Number,
  gameId,
  parseHistoryDetailId,
} from "../utils.ts";
import { Env } from "../env.ts";
import { Gear, Player, SplashcatBattle, Team, TeamJudgement } from "./splashcat-types.ts";

class SplashcatAPI {
  splashcatApiBase = "https://splashcat.ink";
  FETCH_LOCK = new Mutex();
  cache: Record<string, unknown> = {};

  constructor(private splashcatApiKey: string, private env: Env) {}

  requestHeaders() {
    return {
      "User-Agent": USERAGENT,
      "Authorization": `Bearer ${this.splashcatApiKey}`,
    };
  }

  async uuidList(): Promise<string[]> {
    const fetch = this.env.newFetcher();
    const response = await fetch.get({
      url: `${this.splashcatApiBase}/battles/api/recent/`,
      headers: this.requestHeaders(),
    });

    const uuidResult: Record<string, unknown> = await response.json();

    return uuidResult.battle_ids as string[];
  }

  async postBattle(body: unknown) {
    const fetch = this.env.newFetcher();
    const resp = await fetch.post({
      url: `${this.splashcatApiBase}/battles/api/upload/`,
      headers: {
        ...this.requestHeaders(),
        "Content-Type": "application/x-msgpack",
      },
      body: msgpack.encode(body),
    });

    const json: unknown = {}//await resp.json().catch(() => ({}));

    console.log(json)

    // read the body again as text
    const text = await resp.text();
    console.log(text);

    if (resp.status !== 200 && resp.status !== 201) {
      throw new APIError({
        response: resp,
        message: "Failed to export battle",
        json,
      });
    }

    if (json.error) {
      throw new APIError({
        response: resp,
        message: "Failed to export battle",
        json,
      });
    }

    return json;
  }
}

export class SplashcatExporter implements GameExporter {
  name = "Splashcat";
  private api: SplashcatAPI;
  private uploadMode: string;

  constructor(
    { splashcatApiKey, uploadMode, env }: {
      splashcatApiKey: string;
      uploadMode: string;
      env: Env;
    },
  ) {
    this.api = new SplashcatAPI(splashcatApiKey, env);
    this.uploadMode = uploadMode;
  }
  async exportGame(game: Game): Promise<ExportResult> {
    if (game.type === "VsInfo") {
      const body = await this.mapBattle(game);
      const resp = await this.api.postBattle(body);
      console.log(resp);

      return {
        status: "success",
        url: undefined,
      };
    } else {
      return {
        status: "skip",
        reason: "Splashcat API does not support Salmon Run",
      }
    }
  }
  static getGameIdOld(id: string) { // very similar to the file exporter
    const { uid, timestamp } = parseHistoryDetailId(id);

    return `${uid}_${timestamp}Z`;
  }

  static getGameId(id: string) {
    const plainText = new TextDecoder().decode(base64.decode(id));

    return plainText.split(':').at(-1);
  }
  async notExported(
    { type, list }: { list: string[]; type: Game["type"] },
  ): Promise<string[]> {
    if (type !== "VsInfo") return [];
    const uuid = await this.api.uuidList();

    const out: string[] = [];

    for (const id of list) {
      const oldGameId = SplashcatExporter.getGameIdOld(id);
      const gameId = SplashcatExporter.getGameId(id);

      if (
        !uuid.includes(oldGameId) && !uuid.includes(gameId)
      ) {
        out.push(id);
      }
    }

    return out;
  }
  mapPlayer = (
    player: VsPlayer,
    _index: number,
  ): Player => {
    const result: Player = {
      badges: (player.nameplate as Nameplate).badges.map((i) => i ? Number(new TextDecoder().decode(base64.decode(i.id)).split("-")[1]) : null),
      splashtagBackgroundId: Number(new TextDecoder().decode(base64.decode((player.nameplate as Nameplate).background.id)).split('-')[1]),
      clothingGear: this.mapGear(player.clothingGear),
      headGear: this.mapGear(player.headGear),
      shoesGear: this.mapGear(player.shoesGear),
      disconnected: player.result === undefined,
      isMe: player.isMyself,
      name: player.name,
      nameId: player.nameId ?? "",
      nplnId: new TextDecoder().decode(base64.decode(player.id)).split(":").at(-1),
      paint: player.paint,
      species: player.species,
      weaponId: Number(new TextDecoder().decode(base64.decode(player.weapon.id)).split("-")[1]),
      assists: player.result?.assist,
      deaths: player.result?.death,
      kills: player.result?.kill,
      specials: player.result?.special,
      noroshiTry: player.result?.noroshiTry ?? undefined,
      title: player.byname,
    }
    return result;
  };
  async mapBattle(
    {
      groupInfo,
      challengeProgress,
      bankaraMatchChallenge,
      listNode,
      detail: vsDetail,
      rankBeforeState,
      rankState,
    }: VsInfo,
  ): Promise<Record<string, unknown>> {
    const {
      knockout,
      vsRule: { rule },
      myTeam,
      otherTeams,
      bankaraMatch,
      festMatch,
      playedTime,
    } = vsDetail;

    const self = vsDetail.myTeam.players.find((i) => i.isMyself);
    if (!self) {
      throw new Error("Self not found");
    }

    if (otherTeams.length === 0) {
      throw new Error(`Other teams is empty`);
    }

    let anarchyMode: "OPEN" | "SERIES" | undefined;
    if (vsDetail.bankaraMatch?.mode) {
      anarchyMode = vsDetail.bankaraMatch.mode === "OPEN" ? "OPEN" : "SERIES"
    }

    const result: SplashcatBattle = {
      splatnetId: await SplashcatExporter.getGameId(vsDetail.id),
      duration: vsDetail.duration,
      judgement: vsDetail.judgement,
      playedTime: new Date(vsDetail.playedTime).toISOString(),
      vsMode: vsDetail.vsMode.mode === "LEAGUE" ? "CHALLENGE" : vsDetail.vsMode.mode,
      vsRule: vsDetail.vsRule.rule,
      vsStageId: Number(new TextDecoder().decode(base64.decode(vsDetail.vsStage.id)).split("-")[1]),
      anarchy: vsDetail.vsMode.mode === "BANKARA" ? {
        mode: anarchyMode,
        pointChange: vsDetail.bankaraMatch?.earnedUdemaePoint ?? undefined,
        power: vsDetail.bankaraMatch?.bankaraPower ?? undefined,
      } : undefined,
      knockout: vsDetail.knockout ?? undefined,
      splatfest: vsDetail.vsMode.mode === "FEST" ? {
        cloutMultiplier: vsDetail.festMatch?.dragonMatchType === "NORMAL" ? "NONE" : (vsDetail.festMatch?.dragonMatchType ?? undefined),
        power: vsDetail.festMatch?.myFestPower ?? undefined,
      } : undefined,
      xBattle: vsDetail.vsMode.mode === "X_MATCH" ? {
        xPower: vsDetail.xMatch?.lastXPower ?? undefined,
      } : undefined,
      teams: [],
      awards: vsDetail.awards.map((i) => i.name),
    };

    const teams: VsTeam[] = [vsDetail.myTeam, ...vsDetail.otherTeams];

    for (const team of teams) {
      const players = team.players.map(this.mapPlayer);
      const teamResult: Team = {
        players,
        color: team.color,
        isMyTeam: team.players.find((i) => i.isMyself) !== undefined,
        judgement: team.judgement as TeamJudgement,
        order: team.order as number,
        festStreakWinCount: team.festStreakWinCount as unknown as number ?? undefined,
        festTeamName: team.festTeamName ?? undefined,
        festUniformBonusRate: team.festUniformBonusRate as unknown as number ?? undefined,
        festUniformName: team.festUniformName as unknown as string ?? undefined,
        noroshi: team.result?.noroshi ?? undefined,
        paintRatio: team.result?.paintRatio ?? undefined,
        score: team.result?.score ?? undefined,
        tricolorRole: team.tricolorRole ?? undefined,
      }
      result.teams.push(teamResult);
    }

    return {
      battle: result,
      data_type: "splashcat"
    }
  }
  mapColor(color: Color): string | undefined {
    const float2hex = (i: number) =>
      Math.round(i * 255).toString(16).padStart(2, "0");
    // rgba
    const nums = [color.r, color.g, color.b, color.a];
    return nums.map(float2hex).join("");
  }

  mapGear(gear: PlayerGear): Gear {
    return {
      name: gear.name,
      primaryAbility: gear.primaryGearPower.name,
      secondaryAbilities: gear.additionalGearPowers.map((i) => i.name),
    }
  }
}