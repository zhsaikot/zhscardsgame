import type { Team, GameSettings } from '../types/index.js';
import { DEFAULT_GAME_RULES } from './gameRules.js';

/**
 * Score engine for calculating round and game scores
 * Handles contract success/failure determination
 */
export class ScoreEngine {
  private settings: GameSettings;

  constructor(settings: GameSettings = DEFAULT_GAME_RULES) {
    this.settings = settings;
  }

  /**
   * Calculates round results including contract success/failure
   * @param bidderTeam - The team that won the bid
   * @param winningBid - The amount of the winning bid
   * @param teamPoints - Points earned by each team in the round
   * @returns Round result object
   */
  calculateRoundResult(
    bidderTeam: Team,
    winningBid: number,
    teamPoints: { A: number; B: number }
  ): {
    bidderTeamPoints: number;
    opponentTeamPoints: number;
    contractResult: 'success' | 'failure';
    scoreUpdate: { teamA: number; teamB: number };
  } {
    const bidderTeamPoints = teamPoints[bidderTeam];
    const opponentTeam = bidderTeam === 'A' ? 'B' : 'A';
    const opponentTeamPoints = teamPoints[opponentTeam];

    // Determine if contract was fulfilled
    const contractResult: 'success' | 'failure' = 
      bidderTeamPoints >= winningBid ? 'success' : 'failure';

    // Calculate score update based on scoring mode
    const scoreUpdate = this.calculateScoreUpdate(
      bidderTeam,
      contractResult,
      winningBid,
      bidderTeamPoints,
      opponentTeamPoints
    );

    return {
      bidderTeamPoints,
      opponentTeamPoints,
      contractResult,
      scoreUpdate,
    };
  }

  /**
   * Calculates score update based on contract result
   * Classic scoring:
   * - Success: Bidder team gets their points, opponents get theirs
   * - Failure: Opponents get points equal to winning bid, bidder team gets 0
   */
  private calculateScoreUpdate(
    bidderTeam: Team,
    contractResult: 'success' | 'failure',
    winningBid: number,
    bidderTeamPoints: number,
    opponentTeamPoints: number
  ): { teamA: number; teamB: number } {
    let teamAScore = 0;
    let teamBScore = 0;

    if (contractResult === 'success') {
      // Successful contract - both teams get their earned points
      teamAScore = teamPoints.A;
      teamBScore = teamPoints.B;
    } else {
      // Failed contract - opponents get winning bid amount
      if (bidderTeam === 'A') {
        teamAScore = 0;
        teamBScore = winningBid;
      } else {
        teamAScore = winningBid;
        teamBScore = 0;
      }
    }

    return { teamA: teamAScore, teamB: teamBScore };
  }

  /**
   * Verifies that total points equal 29 (28 card points + 1 final trick bonus)
   * @param teamPoints - Points for each team
   * @returns True if points sum to 29
   */
  verifyTotalPoints(teamPoints: { A: number; B: number }): boolean {
    const total = teamPoints.A + teamPoints.B;
    return total === 29;
  }

  /**
   * Determines the game winner based on game score
   * @param gameScore - Current game score
   * @param winningScore - Score needed to win (0 for fixed rounds)
   * @returns Winning team or null if game not over
   */
  determineGameWinner(
    gameScore: { teamA: number; teamB: number },
    winningScore: number
  ): Team | null {
    if (winningScore <= 0) {
      // Fixed rounds mode - no winner determined by score threshold
      return null;
    }

    if (gameScore.teamA >= winningScore) {
      return 'A';
    }
    if (gameScore.teamB >= winningScore) {
      return 'B';
    }

    return null;
  }

  /**
   * Gets the leading team in the current game
   */
  getLeadingTeam(gameScore: { teamA: number; teamB: number }): Team | 'tie' {
    if (gameScore.teamA > gameScore.teamB) {
      return 'A';
    }
    if (gameScore.teamB > gameScore.teamA) {
      return 'B';
    }
    return 'tie';
  }
}
