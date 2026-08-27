import { describe, it, expect } from 'vitest';
import { ScoreEngine } from '@shared/utils/score';

describe('Score Engine', () => {
  const scoreEngine = new ScoreEngine();

  describe('calculateRoundResult', () => {
    it('should mark contract as success when bidder meets bid', () => {
      const result = scoreEngine.calculateRoundResult('A', 18, { A: 20, B: 9 });
      
      expect(result.contractResult).toBe('success');
      expect(result.bidderTeamPoints).toBe(20);
      expect(result.opponentTeamPoints).toBe(9);
    });

    it('should mark contract as failure when bidder fails to meet bid', () => {
      const result = scoreEngine.calculateRoundResult('A', 20, { A: 18, B: 11 });
      
      expect(result.contractResult).toBe('failure');
    });

    it('should award points correctly on successful contract', () => {
      const result = scoreEngine.calculateRoundResult('A', 18, { A: 20, B: 9 });
      
      expect(result.scoreUpdate.teamA).toBe(20);
      expect(result.scoreUpdate.teamB).toBe(9);
    });

    it('should penalize failed bid by awarding bid amount to opponents', () => {
      const result = scoreEngine.calculateRoundResult('A', 20, { A: 18, B: 11 });
      
      expect(result.scoreUpdate.teamA).toBe(0);
      expect(result.scoreUpdate.teamB).toBe(20);
    });

    it('should work for Team B as bidder', () => {
      const successResult = scoreEngine.calculateRoundResult('B', 18, { A: 10, B: 19 });
      expect(successResult.contractResult).toBe('success');
      expect(successResult.scoreUpdate.teamB).toBe(19);
      
      const failResult = scoreEngine.calculateRoundResult('B', 20, { A: 15, B: 14 });
      expect(failResult.contractResult).toBe('failure');
      expect(failResult.scoreUpdate.teamA).toBe(20);
      expect(failResult.scoreUpdate.teamB).toBe(0);
    });
  });

  describe('verifyTotalPoints', () => {
    it('should verify total is 29', () => {
      const valid = scoreEngine.verifyTotalPoints({ A: 18, B: 11 });
      expect(valid).toBe(true);
    });

    it('should reject totals other than 29', () => {
      const invalid1 = scoreEngine.verifyTotalPoints({ A: 18, B: 10 });
      expect(invalid1).toBe(false);
      
      const invalid2 = scoreEngine.verifyTotalPoints({ A: 20, B: 15 });
      expect(invalid2).toBe(false);
    });
  });

  describe('determineGameWinner', () => {
    it('should return null when winningScore is 0', () => {
      const winner = scoreEngine.determineGameWinner({ teamA: 100, teamB: 50 }, 0);
      expect(winner).toBe(null);
    });

    it('should return winning team when threshold reached', () => {
      const winnerA = scoreEngine.determineGameWinner({ teamA: 50, teamB: 30 }, 50);
      expect(winnerA).toBe('A');
      
      const winnerB = scoreEngine.determineGameWinner({ teamA: 30, teamB: 50 }, 50);
      expect(winnerB).toBe('B');
    });

    it('should return null when no team has reached threshold', () => {
      const winner = scoreEngine.determineGameWinner({ teamA: 40, teamB: 35 }, 50);
      expect(winner).toBe(null);
    });
  });

  describe('getLeadingTeam', () => {
    it('should return team A when ahead', () => {
      const leader = scoreEngine.getLeadingTeam({ teamA: 30, teamB: 20 });
      expect(leader).toBe('A');
    });

    it('should return team B when ahead', () => {
      const leader = scoreEngine.getLeadingTeam({ teamA: 20, teamB: 30 });
      expect(leader).toBe('B');
    });

    it('should return tie when scores equal', () => {
      const leader = scoreEngine.getLeadingTeam({ teamA: 25, teamB: 25 });
      expect(leader).toBe('tie');
    });
  });
});
