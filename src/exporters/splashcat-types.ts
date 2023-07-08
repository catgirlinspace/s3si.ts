/**
 * A battle to be uploaded to Splashcat. Any SplatNet 3 strings should use en-US locale.
 * Splashcat will translate strings into the user's language.
 */
export interface SplashcatBattle {
    anarchy?: Anarchy;
    /**
     * The en-US string for the award. Splashcat will translate this into the user's language
     * and manage the award's rank.
     */
    awards:     string[];
    challenge?: Challenge;
    duration:   number;
    judgement:  SplashcatBattleJudgement;
    knockout?:  Knockout;
    playedTime: Date;
    splatfest?: Splatfest;
    /**
     * base64 decoded and split by `:` to get the last section
     */
    splatnetId: string;
    teams:      Team[];
    vsMode:     VsMode;
    vsRule:     VsRule;
    vsStageId:  number;
    xBattle?:   XBattle;
    [property: string]: any;
}

export interface Anarchy {
    mode?:        AnarchyMode;
    pointChange?: number;
    power?:       number;
    [property: string]: any;
}

export type AnarchyMode = "SERIES" | "OPEN";

export interface Challenge {
    /**
     * base64 decoded and split by `-` to get the last section
     */
    id?:    string;
    power?: number;
    [property: string]: any;
}

export type SplashcatBattleJudgement = "WIN" | "LOSE" | "DRAW" | "EXEMPTED_LOSE" | "DEEMED_LOSE";

export type Knockout = "NEITHER" | "WIN" | "LOSE";

export interface Splatfest {
    cloutMultiplier?: CloutMultiplier;
    mode?:            SplatfestMode;
    power?:           number;
    [property: string]: any;
}

export type CloutMultiplier = "NONE" | "DECUPLE" | "DRAGON" | "DOUBLE_DRAGON";

export type SplatfestMode = "OPEN" | "PRO";

export interface Team {
    color:                 Color;
    festStreakWinCount?:   number;
    festTeamName?:         string;
    festUniformBonusRate?: number;
    festUniformName?:      string;
    isMyTeam:              boolean;
    judgement?:            TeamJudgement;
    noroshi?:              number;
    order:                 number;
    paintRatio?:           number;
    players?:              Player[];
    score?:                number;
    tricolorRole?:         TricolorRole;
    [property: string]: any;
}

export interface Color {
    a: number;
    b: number;
    g: number;
    r: number;
    [property: string]: any;
}

export type TeamJudgement = "WIN" | "LOSE" | "DRAW";

export interface Player {
    assists?: number;
    /**
     * Array of badge IDs. Use JSON `null` for empty slots.
     */
    badges:       Array<number | null>;
    clothingGear: Gear;
    deaths?:      number;
    disconnected: boolean;
    headGear:     Gear;
    isMe:         boolean;
    /**
     * Should report the same way that SplatNet 3 does (kills + assists)
     */
    kills?:                number;
    name:                  string;
    nameId:                string;
    noroshiTry?:           number;
    nplnId:                string;
    paint:                 number;
    shoesGear:             Gear;
    specials?:             number;
    species:               Species;
    splashtagBackgroundId: number;
    title:                 string;
    weaponId:              number;
    [property: string]: any;
}

/**
 * A piece of gear. Use en-US locale for name and all abilities.
 */
export interface Gear {
    name?:               string;
    primaryAbility?:     string;
    secondaryAbilities?: string[];
    [property: string]: any;
}

export type Species = "INKLING" | "OCTOLING";

export type TricolorRole = "ATTACK1" | "ATTACK2" | "DEFENSE";

export type VsMode = "BANKARA" | "X_MATCH" | "REGULAR" | "FEST" | "PRIVATE" | "CHALLENGE";

export type VsRule = "AREA" | "TURF_WAR" | "TRI_COLOR" | "LOFT" | "CLAM" | "GOAL";

export interface XBattle {
    xPower?: number;
    xRank?:  number;
    [property: string]: any;
}
