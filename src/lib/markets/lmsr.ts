export type MarketSide = "YES" | "NO";
export type ResolutionOutcome = MarketSide | "VOID";

export type MarketStateInput = {
  liquidity: number;
  yesShares?: number;
  noShares?: number;
};

export type MarketState = {
  liquidity: number;
  yesShares: number;
  noShares: number;
};

export type PositionLot = {
  side: MarketSide;
  shareCount: number;
  totalCost: number;
};

export type BuyOrderQuote = {
  side: MarketSide;
  shareCount: number;
  cost: number;
  averagePrice: number;
  newState: MarketState;
};

export type SellOrderQuote = {
  side: MarketSide;
  shareCount: number;
  refund: number;
  averagePrice: number;
  newState: MarketState;
};

export type PortfolioSettlement = {
  grossPayout: number;
  netPayout: number;
  winningShares: number;
  losingShares: number;
};

const PAYOUT_PER_SHARE = 1;

export function createMarketState(input: MarketStateInput): MarketState {
  if (input.liquidity <= 0) {
    throw new Error("Liquidity must be greater than zero.");
  }

  return {
    liquidity: input.liquidity,
    yesShares: input.yesShares ?? 0,
    noShares: input.noShares ?? 0,
  };
}

export function getMarketProbabilities(state: MarketState) {
  const expYes = Math.exp(state.yesShares / state.liquidity);
  const expNo = Math.exp(state.noShares / state.liquidity);
  const denominator = expYes + expNo;

  return {
    yes: expYes / denominator,
    no: expNo / denominator,
  };
}

function getCost(state: MarketState) {
  const expYes = Math.exp(state.yesShares / state.liquidity);
  const expNo = Math.exp(state.noShares / state.liquidity);

  return state.liquidity * Math.log(expYes + expNo);
}

export function quoteBuyOrder(
  state: MarketState,
  input: {
    side: MarketSide;
    shareCount: number;
  },
): BuyOrderQuote {
  if (input.shareCount <= 0) {
    throw new Error("shareCount must be greater than zero.");
  }

  const nextState =
    input.side === "YES"
      ? { ...state, yesShares: state.yesShares + input.shareCount }
      : { ...state, noShares: state.noShares + input.shareCount };

  const cost = getCost(nextState) - getCost(state);

  return {
    side: input.side,
    shareCount: input.shareCount,
    cost,
    averagePrice: cost / input.shareCount,
    newState: nextState,
  };
}

export function quoteSellOrder(
  state: MarketState,
  input: {
    side: MarketSide;
    shareCount: number;
  },
): SellOrderQuote {
  if (input.shareCount <= 0) {
    throw new Error("shareCount must be greater than zero.");
  }

  const availableShares = input.side === "YES" ? state.yesShares : state.noShares;
  if (input.shareCount > availableShares) {
    throw new Error("shareCount exceeds market inventory for this side.");
  }

  const nextState =
    input.side === "YES"
      ? { ...state, yesShares: state.yesShares - input.shareCount }
      : { ...state, noShares: state.noShares - input.shareCount };

  const refund = getCost(state) - getCost(nextState);

  return {
    side: input.side,
    shareCount: input.shareCount,
    refund,
    averagePrice: refund / input.shareCount,
    newState: nextState,
  };
}

export function settlePortfolioPayout(
  positions: PositionLot[],
  outcome: ResolutionOutcome,
): PortfolioSettlement {
  if (outcome === "VOID") {
    const refunded = positions.reduce((sum, position) => sum + position.totalCost, 0);

    return {
      grossPayout: refunded,
      netPayout: 0,
      winningShares: 0,
      losingShares: 0,
    };
  }

  const summary = positions.reduce(
    (acc, position) => {
      const isWinner = position.side === outcome;

      if (isWinner) {
        acc.winningShares += position.shareCount;
      } else {
        acc.losingShares += position.shareCount;
      }

      acc.totalCost += position.totalCost;
      return acc;
    },
    {
      totalCost: 0,
      winningShares: 0,
      losingShares: 0,
    },
  );

  const grossPayout = summary.winningShares * PAYOUT_PER_SHARE;

  return {
    grossPayout,
    netPayout: grossPayout - summary.totalCost,
    winningShares: summary.winningShares,
    losingShares: summary.losingShares,
  };
}

export { PAYOUT_PER_SHARE };
