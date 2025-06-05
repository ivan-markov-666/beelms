export interface DailyStatistic {
  date: string;
  views: string;
  clicks: string;
}

export interface ViewStatistics {
  total: string;
  totalViews: string;
  uniqueSessions: string;
  uniqueUsers: string;
  totalClicks: string;
  uniqueSessionClicks: string;
  uniqueUserClicks: string;
}

export interface AdStatisticsResult {
  views: ViewStatistics;
  daily: DailyStatistic[];
}
