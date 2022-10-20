export enum Queries {
  HomeQuery = "dba47124d5ec3090c97ba17db5d2f4b3",
  LatestBattleHistoriesQuery = "7d8b560e31617e981cf7c8aa1ca13a00",
  RegularBattleHistoriesQuery = "f6e7e0277e03ff14edfef3b41f70cd33",
  BankaraBattleHistoriesQuery = "c1553ac75de0a3ea497cdbafaa93e95b",
  PrivateBattleHistoriesQuery = "38e0529de8bc77189504d26c7a14e0b8",
  VsHistoryDetailQuery = "2b085984f729cd51938fc069ceef784a",
  CoopHistoryQuery = "817618ce39bcf5570f52a97d73301b30",
  CoopHistoryDetailQuery = "f3799a033f0a7ad4b1b396f9a3bafb1e",
}
export type VarsMap = {
  [Queries.HomeQuery]: [];
  [Queries.LatestBattleHistoriesQuery]: [];
  [Queries.RegularBattleHistoriesQuery]: [];
  [Queries.BankaraBattleHistoriesQuery]: [];
  [Queries.PrivateBattleHistoriesQuery]: [];
  [Queries.VsHistoryDetailQuery]: [{
    vsResultId: string;
  }];
  [Queries.CoopHistoryQuery]: [];
  [Queries.CoopHistoryDetailQuery]: [{
    coopHistoryDetailId: string;
  }];
};

export type Image = {
  url: string;
  width?: number;
  height?: number;
};
export type HistoryGroups = {
  nodes: {
    historyDetails: {
      nodes: {
        id: string;
      }[];
    };
  }[];
};
export type VsHistoryDetail = {
  id: string;
  vsRule: {
    name: string;
    id: string;
    rule: "TURF_WAR" | "AREA" | "LOFT" | "GOAL" | "CLAM" | "TRI_COLOR";
  };
  vsMode: {
    id: string;
    mode: "REGULAR" | "BANKARA" | "PRIVATE" | "FEST";
  };
  vsStage: {
    id: string;
    name: string;
    image: Image;
  };
  playedTime: string; // 2021-01-01T00:00:00Z
};

export type BattleExporter<D> = {
  name: string;
  notExported: (list: string[]) => Promise<string[]>;
  exportBattle: (detail: D) => Promise<void>;
};

export type RespMap = {
  [Queries.HomeQuery]: {
    currentPlayer: {
      weapon: {
        image: Image;
        id: string;
      };
    };
    banners: { image: Image; message: string; jumpTo: string }[];
    friends: {
      nodes: {
        id: number;
        nickname: string;
        userIcon: Image;
      }[];
      totalCount: number;
    };
    footerMessages: unknown[];
  };
  [Queries.LatestBattleHistoriesQuery]: {
    latestBattleHistories: {
      historyGroups: HistoryGroups;
    };
  };
  [Queries.RegularBattleHistoriesQuery]: {
    regularBattleHistories: {
      historyGroups: HistoryGroups;
    };
  };
  [Queries.BankaraBattleHistoriesQuery]: {
    bankaraBattleHistories: {
      historyGroups: HistoryGroups;
    };
  };
  [Queries.PrivateBattleHistoriesQuery]: {
    privateBattleHistories: {
      historyGroups: HistoryGroups;
    };
  };
  [Queries.VsHistoryDetailQuery]: {
    vsHistoryDetail: VsHistoryDetail;
  };
  [Queries.CoopHistoryQuery]: Record<never, never>;
  [Queries.CoopHistoryDetailQuery]: Record<never, never>;
};
export type GraphQLResponse<T> = {
  data: T;
} | {
  errors: {
    message: string;
  }[];
};

export enum BattleListType {
  Latest,
  Regular,
  Bankara,
  Private,
}

export type StatInkPlayer = {
  me: "yes" | "no";
  rank_in_team: number;
  name: string;
  number: string;
  splashtag_title: string;
  weapon: string;
  inked: number;
  kill: number;
  assist: number;
  kill_or_assist: number;
  death: number;
  special: number;
  disconnected: "yes" | "no";
};

export type StatInkPostBody = {
  test: "yes" | "no";
  uuid: string;
  lobby:
    | "regular"
    | "bankara_challenge"
    | "bankara_open"
    | "splatfest_challenge"
    | "splatfest_open"
    | "private";
  rule: "nawabari" | "area" | "hoko" | "yagura" | "asari";
  stage: string;
  weapon: string;
  result: "win" | "lose" | "draw" | "exempted_lose";
  knockout: "yes" | "no" | null; // for TW, set null or not sending
  rank_in_team: 1 | 2 | 3 | 4; // position in scoreboard
  kill: number;
  assist: number;
  kill_or_assist: number; // equals to kill + assist if you know them
  death: number;
  special: number; // use count
  inked: number; // not including bonus
  medals: string[]; // 0-3 elements
  our_team_inked: number; // TW, not including bonus
  their_team_inked: number; // TW, not including bonus
  our_team_percent: number; // TW
  their_team_percent: number; // TW
  our_team_count: number; // Anarchy
  their_team_count: number; // Anarchy
  level_before: number;
  level_after: number;
  rank_before: string; // one of c- ... s+, lowercase only /^[abcs][+-]?$/ except s-
  rank_before_s_plus: number;
  rank_before_exp: number;
  rank_after: string;
  rank_after_s_plus: number;
  rank_after_exp: number;
  rank_exp_change: number; // Set rank_after_exp - rank_before_exp. It can be negative. Set only this value if you don't know their exact values.
  rank_up_battle: "yes" | "no"; // Set "yes" if now "Rank-up Battle" mode.
  challenge_win: number; // Win count for Anarchy (Series) If rank_up_battle is truthy("yes"), the value range is limited to [0, 3].
  challenge_lose: number;
  fest_power: number; // Splatfest Power (Pro)
  fest_dragon?:
    | "10x"
    | "decuple"
    | "100x"
    | "dragon"
    | "333x"
    | "double_dragon";
  clout_before: number; // Splatfest Clout, before the battle
  clout_after: number; // Splatfest Clout, after the battle
  clout_change: number; // Splatfest Clout, equals to clout_after - clout_before if you know them
  cash_before?: number;
  cash_after?: number;
  our_team_players: StatInkPlayer[];
  their_team_players: StatInkPlayer[];

  agent: string;
  agent_version: string;
  agent_variables: Record<string, string>;
  automated: "yes";
  start_at: number; // the battle starts at e.g. 1599577200
  end_at: number;
};
