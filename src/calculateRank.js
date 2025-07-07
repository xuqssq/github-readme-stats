/**
 * Calculates the exponential cdf.
 *
 * @param {number} x The value.
 * @returns {number} The exponential cdf.
 */
function exponential_cdf(x) {
  return 1 - 2 ** -x;
}
/**
 * Calculates the log normal cdf.
 *
 * @param {number} x The value.
 * @returns {number} The log normal cdf.
 */
function log_normal_cdf(x) {
  // approximation
  return x / (1 + x);
}
/**
 * Calculates the users rank.
 *
 * @param {object} params Parameters on which the user's rank depends.
 * @param {boolean} params.all_commits Whether `include_all_commits` was used.
 * @param {number} params.commits Number of commits.
 * @param {number} params.prs The number of pull requests.
 * @param {number} params.issues The number of issues.
 * @param {number} params.reviews The number of reviews.
 * @param {number} params.repos Total number of repos.
 * @param {number} params.stars The number of stars.
 * @param {number} params.followers The number of followers.
 * @returns {{level: string, percentile: number}}} The users rank.
 */
function calculateRank({
  all_commits,
  commits,
  prs,
  issues,
  reviews,
  // eslint-disable-next-line no-unused-vars
  repos, // unused
  stars,
  followers,
}) {
  // 优化配置：强化commits权重，降低其他指标权重
  const COMMITS_MEDIAN = all_commits ? 400 : 80,   // 降低中位数门槛
    COMMITS_WEIGHT = 15;                           // 大幅提升权重
  const PRS_MEDIAN = 15,                           // 稍微提高门槛  
    PRS_WEIGHT = 3;                                // 降低权重
  const ISSUES_MEDIAN = 2,                         // 提高门槛
    ISSUES_WEIGHT = 0.5;                           // 降低权重
  const REVIEWS_MEDIAN = 2,                        // 提高门槛
    REVIEWS_WEIGHT = 0.5;                          // 降低权重
  const STARS_MEDIAN = 0.1,
    STARS_WEIGHT = 0.05;                           // 进一步降低权重
  const FOLLOWERS_MEDIAN = 2,                      // 提高门槛
    FOLLOWERS_WEIGHT = 0.5;                        // 降低权重
  const TOTAL_WEIGHT =
    COMMITS_WEIGHT +
    PRS_WEIGHT +
    ISSUES_WEIGHT +
    REVIEWS_WEIGHT +
    STARS_WEIGHT +
    FOLLOWERS_WEIGHT;
  // 扩展等级系统，增加S+和S-等级
  const THRESHOLDS = [0.1, 0.5, 1, 5, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100];
  const LEVELS = ["S++", "S+", "S", "S-", "A+", "A", "A-", "B+", "B", "B-", "C+", "C"];
  // 计算各项得分
  const commits_score = exponential_cdf(commits / COMMITS_MEDIAN);
  const prs_score = exponential_cdf(prs / PRS_MEDIAN);
  const issues_score = exponential_cdf(issues / ISSUES_MEDIAN);
  const reviews_score = exponential_cdf(reviews / REVIEWS_MEDIAN);
  const stars_score = log_normal_cdf(stars / STARS_MEDIAN);
  const followers_score = log_normal_cdf(followers / FOLLOWERS_MEDIAN);
  // 计算加权总分
  const weighted_sum = 
    COMMITS_WEIGHT * commits_score +
    PRS_WEIGHT * prs_score +
    ISSUES_WEIGHT * issues_score +
    REVIEWS_WEIGHT * reviews_score +
    STARS_WEIGHT * stars_score +
    FOLLOWERS_WEIGHT * followers_score;
  // 计算排名百分位（越小越好）
  const rank = 1 - (weighted_sum / TOTAL_WEIGHT);
  // 找到对应等级
  const level = LEVELS[THRESHOLDS.findIndex((t) => rank * 100 <= t)];
  // 返回详细信息（可选）
  const detailed = {
    level,
    percentile: rank * 100,
    scores: {
      commits: commits_score,
      prs: prs_score,
      issues: issues_score,
      reviews: reviews_score,
      stars: stars_score,
      followers: followers_score
    },
    weights: {
      commits: COMMITS_WEIGHT,
      prs: PRS_WEIGHT,
      issues: ISSUES_WEIGHT,
      reviews: REVIEWS_WEIGHT,
      stars: STARS_WEIGHT,
      followers: FOLLOWERS_WEIGHT
    },
    weighted_contributions: {
      commits: COMMITS_WEIGHT * commits_score,
      prs: PRS_WEIGHT * prs_score,
      issues: ISSUES_WEIGHT * issues_score,
      reviews: REVIEWS_WEIGHT * reviews_score,
      stars: STARS_WEIGHT * stars_score,
      followers: FOLLOWERS_WEIGHT * followers_score
    },
    total_weighted_score: weighted_sum,
    max_possible_score: TOTAL_WEIGHT
  };
  return { level, percentile: rank * 100, detailed };
}
export { calculateRank };
export default calculateRank;
